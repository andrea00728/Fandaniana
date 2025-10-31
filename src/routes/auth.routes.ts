import express, { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { AppDataSource } from "../config/data-source";
import { Wallet } from "../entities/wallet";

dotenv.config();

const AuthRouter = express.Router();
const SECRET = "taxibe_secret_key_2025";

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// ============================================================================
// SENDGRID CONFIGURATION
// ============================================================================
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not configured!');
} else {
  console.log('✅ SendGrid configured successfully');
}

// ============================================================================
// EMAIL SENDING WITH RETRY LOGIC
// ============================================================================
async function sendEmailWithRetry(
  to: string,
  subject: string,
  html: string,
  retries: number = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || "andrea112samuel@gmail.com",
        subject,
        html,
      });
      console.log(' Email sent successfully via SendGrid');
      return;
    } catch (error: any) {
      console.error(
        ` Attempt ${i + 1}/${retries} failed:`,
        error.message
      );

      if (i < retries - 1) {
        const delay = 1000 * Math.pow(2, i);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Email send failed after ${retries} attempts: ${error.message}`);
      }
    }
  }
}

// ============================================================================
// OTP IN-MEMORY STORE
// ============================================================================
type OtpRecord = {
  code: string;
  expiresAt: number;
  attempts: number;
  role: string;
};
const pendingOtps = new Map<string, OtpRecord>();

function generateOtp(len: number = 6): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
}

// ============================================================================
// SWAGGER DOCUMENTATION
// ============================================================================

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification utilisateurs via OTP email
 */

/**
 * @swagger
 * /auth/send-confirmation:
 *   post:
 *     summary: Envoie un code de confirmation par email pour créer un utilisateur (email + rôle)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *     responses:
 *       200:
 *         description: Code envoyé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 step:
 *                   type: string
 *       400:
 *         description: Email ou rôle invalide / email déjà utilisé
 *       500:
 *         description: Erreur d'envoi d'email
 */
AuthRouter.post('/send-confirmation', async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const validRoles = ['user', 'admin'];

  if (!email || !role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Email ou rôle invalide' });
  }

  try {
    await admin.auth().getUserByEmail(email);
    return res.status(400).json({ error: "Email déjà utilisé" });
  } catch {
    // Utilisateur non trouvé, ok pour générer code
  }

  const code = generateOtp(6);
  pendingOtps.set(email, {
    code,
    role,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  try {
    await sendEmailWithRetry(
      email,
      "Votre code de confirmation",
      `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background-color: #FCB53B; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Fandaniana</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Code de confirmation</h2>
            <p style="color: #666; font-size: 16px;">Votre code de confirmation (valide 5 minutes):</p>
            <div style="background-color: white; border: 2px solid #FCB53B; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
              <h1 style="color: #FCB53B; letter-spacing: 5px; margin: 0; font-size: 36px;">${code}</h1>
            </div>
            <p style="color: #999; font-size: 12px;">⚠️ Ne partagez ce code avec personne. Notre équipe ne vous le demandera jamais.</p>
          </div>
        </div>
      `
    );

    res.json({
      message: "Code envoyé, veuillez confirmer",
      step: "CONFIRM_EMAIL",
    });
  } catch (emailError: any) {
    console.error("❌ Erreur d'envoi d'email:", emailError.message);
    res.status(500).json({
      error: "Erreur d'envoi d'email. Veuillez réessayer.",
      details: emailError.message,
    });
  }
});

// ============================================================================
// LOGIN - SEND OTP
// ============================================================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Vérification email, envoi OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Code envoyé
 *       400:
 *         description: Erreur d'email
 *       500:
 *         description: Erreur d'envoi d'email
 */
AuthRouter.post("/login", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email manquant" });
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    const code = generateOtp(6);

    pendingOtps.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      role: "",
    });

    try {
      await sendEmailWithRetry(
        email,
        "Votre code de vérification Fandaniana",
        `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background-color: #FCB53B; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">Fandaniana</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333;">Votre code de vérification</h2>
              <p style="color: #666; font-size: 16px;">Veuillez entrer ce code pour accéder à votre compte (valide 5 minutes):</p>
              <div style="background-color: white; border: 2px solid #FCB53B; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                <h1 style="color: #FCB53B; letter-spacing: 5px; margin: 0; font-size: 36px;">${code}</h1>
              </div>
              <p style="color: #999; font-size: 12px;">⚠️ Ne partagez ce code avec personne.</p>
            </div>
          </div>
        `
      );

      return res.json({
        message: "Code envoyé par email",
        step: "VERIFY_OTP",
        uid: user.uid,
      });
    } catch (emailError: any) {
      console.error("❌ Erreur d'envoi d'email:", emailError.message);
      return res.status(500).json({
        error: "Erreur d'envoi d'email. Veuillez réessayer.",
        code: emailError.code,
      });
    }
  } catch (error: any) {
    console.error("❌ Erreur login:", error.message);
    return res.status(400).json({
      error: "Utilisateur introuvable ou erreur d'envoi",
      code: error.code,
    });
  }
});

// ============================================================================
// VERIFY OTP
// ============================================================================

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Vérifie le code OTP reçu par email, délivre un JWT si correct
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Connexion réussie (token)
 *       400:
 *         description: Code invalide ou expiré
 *       429:
 *         description: Trop de tentatives
 */
AuthRouter.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email et code requis" });
  }

  const record = pendingOtps.get(email);

  if (!record) {
    return res.status(400).json({ error: "Aucun OTP en attente" });
  }

  if (record.attempts >= 5) {
    pendingOtps.delete(email);
    return res.status(429).json({
      error: "Trop de tentatives, redemandez un code",
    });
  }

  if (Date.now() > record.expiresAt) {
    pendingOtps.delete(email);
    return res.status(400).json({ error: "Code expiré, redemandez un code" });
  }

  record.attempts += 1;

  if (code !== record.code) {
    return res.status(400).json({ error: "Code invalide" });
  }

  pendingOtps.delete(email);

  try {
    const user = await admin.auth().getUserByEmail(email);
    const role = user.customClaims?.role || "user";
    const token = jwt.sign({ uid: user.uid, role }, SECRET, {
      expiresIn: "2h",
    });

    return res.json({ token, role });
  } catch (error: any) {
    console.error("❌ Erreur verify OTP:", error.message);
    return res.status(400).json({ error: "Utilisateur introuvable" });
  }
});

// ============================================================================
// RESEND OTP
// ============================================================================

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Renvoyer un nouveau code OTP à l'email si délai/expiration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Nouveau code envoyé
 *       400:
 *         description: Utilisateur introuvable
 *       429:
 *         description: Rate limit atteint
 *       500:
 *         description: Erreur d'envoi d'email
 */
const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.email || ipKeyGenerator(req as any),
  message: "Trop de tentatives, veuillez réessayer plus tard",
});

AuthRouter.post(
  "/resend-otp",
  resendLimiter,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email manquant" });
    }

    try {
      await admin.auth().getUserByEmail(email);

      const code = generateOtp(6);
      pendingOtps.set(email, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
        role: "",
      });

      try {
        await sendEmailWithRetry(
          email,
          "Nouveau code de vérification",
          `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background-color: #FCB53B; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">Fandaniana</h1>
              </div>
              <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333;">Nouveau code de vérification</h2>
                <p style="color: #666; font-size: 16px;">Voici votre nouveau code (valide 5 minutes):</p>
                <div style="background-color: white; border: 2px solid #FCB53B; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                  <h1 style="color: #FCB53B; letter-spacing: 5px; margin: 0; font-size: 36px;">${code}</h1>
                </div>
                <p style="color: #999; font-size: 12px;">⚠️ Ne partagez ce code avec personne.</p>
              </div>
            </div>
          `
        );

        return res.json({ message: "Nouveau code envoyé" });
      } catch (emailError: any) {
        console.error("❌ Erreur d'envoi d'email:", emailError.message);
        return res.status(500).json({
          error: "Erreur d'envoi d'email. Veuillez réessayer.",
        });
      }
    } catch (error: any) {
      console.error("❌ Erreur resend OTP:", error.message);
      return res.status(400).json({
        error: "Utilisateur introuvable",
        code: error.code,
      });
    }
  }
);

// ============================================================================
// CONFIRM - CREATE ACCOUNT AND WALLET (IDEMPOTENT)
// ============================================================================

/**
 * @swagger
 * /auth/confirm:
 *   post:
 *     summary: Confirme le code OTP, crée (ou récupère) l'utilisateur et son wallet (idempotent)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compte et wallet prêts à l'emploi
 *       400:
 *         description: Code invalide, expiré ou validation error
 *       500:
 *         description: Firebase ou database error
 */
AuthRouter.post("/confirm", async (req: Request, res: Response) => {
  const { email, code } = req.body;

  console.log("===========================================");
  console.log("📥 CONFIRM - Début de la requête");
  console.log("Email:", email);
  console.log("Code reçu:", code);
  console.log("===========================================");

  // 0) Validation
  if (!email || !code) {
    return res.status(400).json({ error: "Email et code requis" });
  }

  const otpData = pendingOtps.get(email);

  if (!otpData) {
    return res.status(400).json({ error: "Aucun code en attente pour cet email" });
  }

  if (Date.now() > otpData.expiresAt) {
    pendingOtps.delete(email);
    return res.status(400).json({ error: "Code expiré" });
  }

  if (otpData.code !== code) {
    return res.status(400).json({ error: "Code incorrect" });
  }

  console.log("✅ OTP validé");

  try {
    // 1) Récupérer ou créer l'utilisateur Firebase (idempotent)
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log("ℹ️ Utilisateur déjà existant:", userRecord.uid);
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        userRecord = await admin.auth().createUser({
          email,
          emailVerified: false,
        });
        console.log("✅ Utilisateur créé:", userRecord.uid);
      } else {
        throw e;
      }
    }

    // 2) Définir/mettre à jour les custom claims (rôle)
    try {
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: otpData.role || "user",
      });
      console.log("✅ Rôle défini/mis à jour:", otpData.role || "user");
    } catch (roleError: any) {
      console.error("❌ Erreur setCustomUserClaims:", roleError);
      throw roleError;
    }

    // 3) Vérifier l'état de la DB
    if (!AppDataSource.isInitialized) {
      console.log("⚠️ AppDataSource non initialisé, initialisation...");
      await AppDataSource.initialize();
      console.log("✅ AppDataSource initialisé");
    }

    // 4) Créer le wallet s'il n'existe pas (idempotent)
    const walletRepo = AppDataSource.getRepository(Wallet);
    let wallet = await walletRepo.findOne({
      where: { firebase_uid: userRecord.uid },
    });

    if (!wallet) {
      wallet = walletRepo.create({
        firebase_uid: userRecord.uid,
        email,
        role: otpData.role || "user",
        nom: `Portefeuille de ${email.split("@")[0]}`,
        solde_total: 0,
      });
      await walletRepo.save(wallet);
      console.log("✅ Wallet créé:", wallet.id);
    } else {
      console.log("ℹ️ Wallet déjà existant:", wallet.id);
    }

    // 5) Nettoyer l'OTP en mémoire
    pendingOtps.delete(email);

    return res.status(200).json({
      message: "Compte et portefeuille prêts",
      uid: userRecord.uid,
      wallet_id: wallet.id,
    });
  } catch (error: any) {
    console.error("❌ ERREUR confirm:", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });

    // Mappage d'erreurs Firebase
    if (error.code === "auth/invalid-email") {
      return res.status(400).json({
        error: "Adresse email invalide",
        code: error.code,
      });
    }
    if (error.code === "auth/insufficient-permission") {
      return res.status(500).json({
        error: "Permissions Firebase insuffisantes",
        code: error.code,
      });
    }
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        error: "Email déjà utilisé",
        code: error.code,
      });
    }

    // Mappage d'erreurs DB
    if (error.name === "RepositoryNotFoundError") {
      return res.status(500).json({
        error: "Configuration DB incorrecte (entité Wallet manquante)",
        code: error.name,
      });
    }
    if (error.name === "QueryFailedError") {
      return res.status(500).json({
        error: "Erreur SQL lors de la création du wallet",
        details: error.message,
        code: error.name,
      });
    }

    // Fallback générique
    return res.status(500).json({
      error: "Erreur lors de la création du compte",
      code: error.code || "UNKNOWN",
      message: error.message,
    });
  }
});

export default AuthRouter;

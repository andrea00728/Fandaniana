import express, { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer, { Transporter } from "nodemailer";
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
// NODEMAILER CONFIGURATION - GMAIL SMTP
// ============================================================================
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 30000,
  socketTimeout: 30000,
  greetingTimeout: 30000,
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Connected Successfully');
  }
});


// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Connected Successfully');
  }
});

// ============================================================================
// EMAIL SENDING WITH RETRY LOGIC
// ============================================================================
async function sendEmailWithRetry(
  mailOptions: any,
  retries: number = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
      return;
    } catch (error: any) {
      console.error(
        `❌ Attempt ${i + 1}/${retries} failed:`,
        error.message,
        `(${error.code})`
      );

      if (i < retries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, i);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Last attempt failed
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
 *   description: User authentication via OTP email
 */

/**
 * @swagger
 * /auth/send-confirmation:
 *   post:
 *     summary: Send confirmation code by email to create a user account
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
 *         description: Code sent successfully
 *       400:
 *         description: Invalid email/role or email already exists
 *       500:
 *         description: Email sending failed after retries
 */
AuthRouter.post('/send-confirmation', async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const validRoles = ['user', 'admin'];

  if (!email || !role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Email or role invalid' });
  }

  try {
    await admin.auth().getUserByEmail(email);
    return res.status(400).json({ error: "Email already exists" });
  } catch {
    // User not found, OK to proceed
  }

  const code = generateOtp(6);
  pendingOtps.set(email, {
    code,
    role,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  try {
    await sendEmailWithRetry({
      from: `"Support Fandaniana" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Votre code de confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #FCB53B;">Code de confirmation</h2>
          <p>Votre code de confirmation (valide 5 minutes):</p>
          <h1 style="color: #FCB53B; letter-spacing: 5px; text-align: center;">${code}</h1>
          <p style="color: #666; font-size: 14px;">Ne partagez ce code avec personne.</p>
        </div>
      `,
    });

    res.json({
      message: "Code sent, please confirm",
      step: "CONFIRM_EMAIL",
    });
  } catch (emailError: any) {
    console.error("❌ Email sending failed:", emailError.message);
    res.status(500).json({
      error: "Email sending failed. Please try again in a few moments.",
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
 *     summary: Verify email and send OTP code
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
 *         description: Code sent
 *       400:
 *         description: User not found or email error
 *       500:
 *         description: Email sending failed
 */
AuthRouter.post("/login", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
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
      await sendEmailWithRetry({
        from: `"Support Fandaniana" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Votre code de vérification Fandaniana",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background-color: #FCB53B; padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Fandaniana</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333;">Votre code de vérification</h2>
              <p style="color: #666; font-size: 16px;">Veuillez entrer ce code pour accéder à votre compte (valide 5 minutes):</p>
              <div style="background-color: white; border: 2px solid #FCB53B; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                <h1 style="color: #FCB53B; letter-spacing: 5px; margin: 0; font-size: 36px;">${code}</h1>
              </div>
              <p style="color: #999; font-size: 12px;">⚠️ Ne partagez ce code avec personne. Notre équipe ne vous le demandera jamais.</p>
            </div>
          </div>
        `,
      });

      return res.json({
        message: "Code sent by email",
        step: "VERIFY_OTP",
        uid: user.uid,
      });
    } catch (emailError: any) {
      console.error("❌ Email sending error:", emailError.message);
      return res.status(500).json({
        error: "Email sending failed. Please try again.",
        code: emailError.code,
      });
    }
  } catch (error: any) {
    console.error("❌ Login error:", error.message);
    return res.status(400).json({
      error: "User not found or email error",
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
 *     summary: Verify OTP code and return JWT token
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
 *         description: Successful login (token)
 *       400:
 *         description: Invalid or expired code
 *       429:
 *         description: Too many attempts
 */
AuthRouter.post("/verify-otp", async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code required" });
  }

  const record = pendingOtps.get(email);

  if (!record) {
    return res.status(400).json({ error: "No OTP pending for this email" });
  }

  if (record.attempts >= 5) {
    pendingOtps.delete(email);
    return res.status(429).json({
      error: "Too many attempts, request a new code",
    });
  }

  if (Date.now() > record.expiresAt) {
    pendingOtps.delete(email);
    return res.status(400).json({ error: "Code expired, request a new one" });
  }

  record.attempts += 1;

  if (code !== record.code) {
    return res.status(400).json({ error: "Invalid code" });
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
    console.error("❌ Verify OTP error:", error.message);
    return res.status(400).json({ error: "User not found" });
  }
});

// ============================================================================
// RESEND OTP
// ============================================================================

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP code to email
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
 *         description: New code sent
 *       400:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded (max 3 resends per 5 minutes)
 *       500:
 *         description: Email sending failed
 */
const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  keyGenerator: (req) =>
    req.body.email || ipKeyGenerator(req as any),
  message: "Too many resend attempts, please try again later",
});

AuthRouter.post(
  "/resend-otp",
  resendLimiter,
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
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
        await sendEmailWithRetry({
          from: `"Support Fandaniana" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Nouveau code de vérification",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #FCB53B;">Nouveau code de vérification</h2>
              <p>Voici votre nouveau code (valide 5 minutes):</p>
              <h1 style="color: #FCB53B; letter-spacing: 5px; text-align: center;">${code}</h1>
              <p style="color: #666; font-size: 14px;">Ne partagez ce code avec personne.</p>
            </div>
          `,
        });

        return res.json({ message: "New code sent" });
      } catch (emailError: any) {
        console.error("❌ Email sending error:", emailError.message);
        return res.status(500).json({
          error: "Email sending failed. Please try again.",
          code: emailError.code,
        });
      }
    } catch (error: any) {
      console.error("❌ Resend OTP error:", error.message);
      return res.status(400).json({
        error: "User not found",
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
 *     summary: Confirm OTP, create (or retrieve) user and wallet (idempotent)
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
 *         description: Account and wallet ready
 *       400:
 *         description: Invalid, expired code or validation error
 *       500:
 *         description: Firebase or database error
 */
AuthRouter.post("/confirm", async (req: Request, res: Response) => {
  const { email, code } = req.body;

  console.log("===========================================");
  console.log("📥 CONFIRM - Request started");
  console.log("Email:", email);
  console.log("Code received:", code);
  console.log("===========================================");

  // 0) Validation
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code required" });
  }

  const otpData = pendingOtps.get(email);

  if (!otpData) {
    return res.status(400).json({ error: "No OTP pending for this email" });
  }

  if (Date.now() > otpData.expiresAt) {
    pendingOtps.delete(email);
    return res.status(400).json({ error: "Code expired" });
  }

  if (otpData.code !== code) {
    return res.status(400).json({ error: "Invalid code" });
  }

  console.log("✅ OTP validated");

  try {
    // 1) Get or create Firebase user (idempotent)
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log("ℹ️ User already exists:", userRecord.uid);
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        userRecord = await admin.auth().createUser({
          email,
          emailVerified: false,
        });
        console.log("✅ User created:", userRecord.uid);
      } else {
        throw e;
      }
    }

    // 2) Set/update custom claims (role)
    try {
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: otpData.role || "user",
      });
      console.log("✅ Role set/updated:", otpData.role || "user");
    } catch (roleError: any) {
      console.error("❌ setCustomUserClaims error:", roleError);
      throw roleError;
    }

    // 3) Check DB state
    if (!AppDataSource.isInitialized) {
      console.log("⚠️ AppDataSource not initialized, initializing...");
      await AppDataSource.initialize();
      console.log("✅ AppDataSource initialized");
    }

    // 4) Create wallet if it doesn't exist (idempotent)
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
      console.log("✅ Wallet created:", wallet.id);
    } else {
      console.log("ℹ️ Wallet already exists:", wallet.id);
    }

    // 5) Clean up OTP in memory
    pendingOtps.delete(email);

    return res.status(200).json({
      message: "Account and wallet ready",
      uid: userRecord.uid,
      wallet_id: wallet.id,
    });
  } catch (error: any) {
    console.error("❌ CONFIRM ERROR:", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });

    // Firebase error mapping
    if (error.code === "auth/invalid-email") {
      return res.status(400).json({
        error: "Invalid email address",
        code: error.code,
      });
    }
    if (error.code === "auth/insufficient-permission") {
      return res.status(500).json({
        error: "Firebase insufficient permissions",
        code: error.code,
      });
    }
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        error: "Email already used",
        code: error.code,
      });
    }

    // Database error mapping
    if (error.name === "RepositoryNotFoundError") {
      return res.status(500).json({
        error: "DB configuration incorrect (Wallet entity missing)",
        code: error.name,
      });
    }
    if (error.name === "QueryFailedError") {
      return res.status(500).json({
        error: "SQL error creating wallet",
        details: error.message,
        code: error.name,
      });
    }

    // Generic fallback
    return res.status(500).json({
      error: "Account creation error",
      code: error.code || "UNKNOWN",
      message: error.message,
    });
  }
});

export default AuthRouter;

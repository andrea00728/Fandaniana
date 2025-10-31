import '@dotenvx/dotenvx/config';

import express from "express";
import "reflect-metadata";
import { AppDataSource } from "./config/data-source.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import AuthRouter from "./routes/auth.routes.js";
import cors from "cors";
import ActiviteRouter from './routes/active.routes.js';
import WalletRouter from './routes/wallet.routes.js';
import TransactionRoute from './routes/transaction.route.js';

const app = express();
app.use(express.json());
console.log('EMAIL_USER=', process.env.SMTP_USER);
console.log('EMAIL_PASS=', process.env.SMTP_PASS);


//configuration cors
app.use(
  cors({
    origin: [
      "http://localhost:8081", // si tu utilises le web via Expo
      "exp://192.168.1.189:8081", // ton adresse Expo Go
      "http://localhost:19006", // port Expo Web
      "http://localhost:19000", // port Expo dev tools
      "http://192.168.1.189:19000", // IP de ton téléphone sur le même réseau
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- Swagger configuration ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TaxiBe API",
      version: "1.0.0",
      description: "Documentation de l'API TaxiBe",
    },
    servers: [
      { url: "http://localhost:3000/api" },
    ],
    // Ajoutez la configuration de security
    components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Entrer le token JWT depuis l’authentification (format: Bearer <votre_token>)"
    }
  }
} ,

// Ajoutez la configuration de security
security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./dist/routes/*.js", "./src/routes/*.js"],

}; 

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Route pour accéder à Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Routes ---
app.use("/api/auth",AuthRouter);
app.use("/api/Activity",ActiviteRouter);
app.use("/api/Transactions",TransactionRoute);
app.use("/api/Wallet",WalletRouter);




AppDataSource.initialize()
  .then(() => console.log("📦 Base de données connectée"))
  .catch((err) => console.error("Erreur de connexion DB :", err));

export default app;

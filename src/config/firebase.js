import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Pour résoudre __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier de clé privée
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

// Parse le JSON
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialisation de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;

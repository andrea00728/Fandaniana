import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { TransactionController } from "../controllers/transaction.controller";

const TransactionRoute = Router();
const transactionController = new TransactionController();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Gestion des dépenses et transactions
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Créer une nouvelle transaction (dépense)
 *     description: Enregistre une dépense et déduit le montant du solde du wallet. Vérifie que le solde est suffisant avant d'effectuer la transaction.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activity_type_id
 *               - montant
 *             properties:
 *               activity_type_id:
 *                 type: integer
 *                 description: ID du type d'activité (catégorie de dépense)
 *                 example: 1
 *               montant:
 *                 type: number
 *                 format: decimal
 *                 description: Montant de la dépense (doit être > 0)
 *                 example: 5000
 *               description:
 *                 type: string
 *                 description: Description optionnelle de la transaction
 *                 example: "Courses alimentaires au supermarché"
 *     responses:
 *       201:
 *         description: Dépense enregistrée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dépense enregistrée avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     wallet_id:
 *                       type: integer
 *                       example: 1
 *                     activity_type_id:
 *                       type: integer
 *                       example: 1
 *                     montant:
 *                       type: number
 *                       example: 5000
 *                     description:
 *                       type: string
 *                       example: "Courses alimentaires"
 *                     date_transaction:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-30T08:20:00.000Z"
 *       400:
 *         description: Erreur de validation (solde insuffisant, montant invalide, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Solde insuffisant. Solde actuel: 3000 Ar, Montant requis: 5000 Ar"
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Token invalide ou expiré"
 */
TransactionRoute.post('/', authenticate, transactionController.createTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Supprimer une transaction et rembourser le montant
 *     description: Supprime une transaction existante et rembourse automatiquement le montant dans le wallet. L'utilisateur ne peut supprimer que ses propres transactions.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la transaction à supprimer
 *         example: 15
 *     responses:
 *       200:
 *         description: Transaction supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transaction supprimée et montant remboursé"
 *       400:
 *         description: Erreur (transaction introuvable ou n'appartient pas à l'utilisateur)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cette transaction ne vous appartient pas"
 *       401:
 *         description: Token manquant ou invalide
 */
TransactionRoute.delete('/:id', authenticate, transactionController.deleteTransaction);

/**
 * @swagger
 * /transactions/export-pdf:
 *   get:
 *     summary: Exporter l'historique des transactions en PDF
 *     description: Génère et télécharge un PDF contenant tout l'historique des transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF généré avec succès
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Erreur lors de la génération du PDF
 *       401:
 *         description: Token manquant ou invalide
 */
TransactionRoute.get('/export-pdf', authenticate, transactionController.exportHistoriquePdf);


export default TransactionRoute;

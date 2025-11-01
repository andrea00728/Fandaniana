"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const WalletRouter = (0, express_1.Router)();
const walletController = new wallet_controller_1.WalletController();
/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Gestion du portefeuille personnel
 */
/**
 * @swagger
 * /wallet/add-funds:
 *   post:
 *     summary: Ajouter des fonds au portefeuille
 *     description: Augmente le solde total du portefeuille de l'utilisateur connecté
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montant
 *             properties:
 *               montant:
 *                 type: number
 *                 format: decimal
 *                 description: Montant à ajouter (doit être > 0)
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Fonds ajoutés avec succès
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
 *                   example: "Fonds ajoutés avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     nouveau_solde:
 *                       type: number
 *                       example: 75000
 *       400:
 *         description: Montant invalide ou portefeuille introuvable
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
 *                   example: "Le montant doit être supérieur à 0"
 *       401:
 *         description: Token manquant ou invalide
 */
WalletRouter.post('/add-funds', authMiddleware_1.authenticate, walletController.addFunds);
/**
 * @swagger
 * /wallet/me:
 *   get:
 *     summary: Récupérer les informations complètes du portefeuille
 *     description: Retourne toutes les informations du portefeuille de l'utilisateur connecté, incluant les transactions
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations du portefeuille récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     firebase_uid:
 *                       type: string
 *                       example: "xyz123abc456"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     solde_total:
 *                       type: number
 *                       example: 45000
 *                     nom:
 *                       type: string
 *                       example: "Portefeuille de user@example.com"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Portefeuille introuvable
 *       401:
 *         description: Token manquant ou invalide
 */
WalletRouter.get('/me', authMiddleware_1.authenticate, walletController.getMyWallet);
/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Consulter le solde et statistiques du portefeuille
 *     description: Retourne le solde actuel, le total des dépenses et le nombre de transactions
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques du portefeuille récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     solde:
 *                       type: number
 *                       description: Solde actuel disponible
 *                       example: 45000
 *                     total_depenses:
 *                       type: number
 *                       description: Total cumulé des dépenses
 *                       example: 125000
 *                     nombre_transactions:
 *                       type: integer
 *                       description: Nombre total de transactions effectuées
 *                       example: 42
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       500:
 *         description: Erreur serveur
 *       401:
 *         description: Token manquant ou invalide
 */
WalletRouter.get('/balance', authMiddleware_1.authenticate, walletController.getBalance);
/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Récupérer l'historique des transactions
 *     description: Retourne la liste des transactions du portefeuille, triées par date décroissante
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre maximum de transactions à retourner
 *         example: 20
 *     responses:
 *       200:
 *         description: Historique des transactions récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       wallet_id:
 *                         type: integer
 *                         example: 1
 *                       activity_type_id:
 *                         type: integer
 *                         example: 1
 *                       montant:
 *                         type: number
 *                         example: 5000
 *                       description:
 *                         type: string
 *                         example: "Courses alimentaires"
 *                       date_transaction:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-30T08:20:00.000Z"
 *                       activityType:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nom:
 *                             type: string
 *                             example: "Alimentation"
 *                           icon:
 *                             type: string
 *                             example: "🍔"
 *       500:
 *         description: Erreur serveur
 *       401:
 *         description: Token manquant ou invalide
 */
WalletRouter.get('/transactions', authMiddleware_1.authenticate, walletController.getTransactionHistory);
/**
 * @swagger
 * /wallet/delete-balance:
 *   delete:
 *     summary: Réinitialiser le solde du portefeuille à zéro
 *     description: Réinitialise le solde à zéro. Le portefeuille persiste avec un solde vide
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Solde réinitialisé avec succès
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
 *                   example: "votre portefeuille est vide"
 *                 data:
 *                   type: object
 *                   properties:
 *                     nouveau_solde:
 *                       type: number
 *                       example: 0
 *       400:
 *         description: Le solde est déjà vide ou portefeuille introuvable
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
 *                   example: "votre portefeuille est deja vide"
 *       401:
 *         description: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
WalletRouter.delete('/delete-balance', authMiddleware_1.authenticate, walletController.deleteBalance);
exports.default = WalletRouter;
//# sourceMappingURL=wallet.routes.js.map
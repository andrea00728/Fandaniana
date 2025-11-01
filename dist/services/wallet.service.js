"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const data_source_1 = require("../config/data-source");
const Transaction_1 = require("../entities/Transaction");
const wallet_1 = require("../entities/wallet");
class WalletService {
    constructor() {
        this.walletRepository = data_source_1.AppDataSource.getRepository(wallet_1.Wallet);
    }
    async getWalletByUid(firebaseUid) {
        return await this.walletRepository.findOne({
            where: { firebase_uid: firebaseUid },
            relations: ['transactions', 'transactions.activityType']
        });
    }
    async addFunds(firebaseUid, montant) {
        if (montant <= 0) {
            throw new Error('Le montant doit être supérieur à 0');
        }
        const wallet = await this.walletRepository.findOne({
            where: { firebase_uid: firebaseUid }
        });
        if (!wallet) {
            throw new Error('Portefeuille introuvable');
        }
        wallet.solde_total = Number(wallet.solde_total) + Number(montant);
        return await this.walletRepository.save(wallet);
    }
    /**
     * Retourne le solde actuel, le total cumulé des dépenses et le nombre de transactions
     * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
     * @returns {Promise<{ solde: number, total_depenses: number, nombre_transactions: number, email: string }>}
     * @throws {Error} - Si le portefeuille est introuvable
     */
    async getBalance(firebaseUid) {
        const wallet = await this.walletRepository.findOne({
            where: { firebase_uid: firebaseUid },
            relations: ['transactions']
        });
        if (!wallet) {
            throw new Error('Portefeuille introuvable');
        }
        const totalDepenses = wallet.transactions.reduce((sum, t) => sum + Number(t.montant), 0);
        return {
            solde: Number(wallet.solde_total),
            total_depenses: totalDepenses,
            nombre_transactions: wallet.transactions.length,
            email: wallet.email
        };
    }
    /**
     * Récupère l'historique des transactions du portefeuille
     * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
     * @param {number} [limit=50] - Nombre maximum de transactions à retourner
     * @returns {Promise<Transaction[]>} - Liste des transactions triées par date décroissante
     * @throws {Error} - Si le portefeuille est introuvable
     */
    async getTransactionHistory(firebaseUid, limit = 50) {
        const wallet = await this.walletRepository.findOne({
            where: { firebase_uid: firebaseUid }
        });
        if (!wallet) {
            throw new Error('Portefeuille introuvable');
        }
        const transactionRepository = data_source_1.AppDataSource.getRepository(Transaction_1.Transaction);
        return await transactionRepository.find({
            where: { wallet_id: wallet.id },
            relations: ['activityType'],
            order: { date_transaction: 'DESC' },
            take: limit
        });
    }
    async deleteBalance(firebaseUid) {
        const supBalance = await this.walletRepository.delete({ firebase_uid: firebaseUid });
        if (solde === 0) {
            throw new Error('votre solde est vide');
        }
        return supBalance;
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map
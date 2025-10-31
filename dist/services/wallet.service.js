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
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map
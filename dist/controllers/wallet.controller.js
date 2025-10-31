"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const wallet_service_1 = require("../services/wallet.service");
class WalletController {
    constructor() {
        this.walletService = new wallet_service_1.WalletService();
        this.addFunds = async (req, res) => {
            try {
                const { montant } = req.body;
                const firebaseUid = req.user.uid;
                const wallet = await this.walletService.addFunds(firebaseUid, montant);
                res.status(200).json({
                    success: true,
                    message: 'Fonds ajoutés avec succès',
                    data: {
                        nouveau_solde: wallet.solde_total
                    }
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        };
        this.getMyWallet = async (req, res) => {
            try {
                const firebaseUid = req.user.uid;
                const wallet = await this.walletService.getWalletByUid(firebaseUid);
                if (!wallet) {
                    res.status(404).json({
                        success: false,
                        message: 'Portefeuille introuvable'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: wallet
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
        this.getBalance = async (req, res) => {
            try {
                const firebaseUid = req.user.uid;
                const balance = await this.walletService.getBalance(firebaseUid);
                res.status(200).json({
                    success: true,
                    data: balance
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
        this.getTransactionHistory = async (req, res) => {
            try {
                const firebaseUid = req.user.uid;
                const limit = req.query.limit ? parseInt(req.query.limit) : 50;
                const transactions = await this.walletService.getTransactionHistory(firebaseUid, limit);
                res.status(200).json({
                    success: true,
                    data: transactions
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        };
    }
}
exports.WalletController = WalletController;
//# sourceMappingURL=wallet.controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
class TransactionController {
    constructor() {
        this.transactionService = new transaction_service_1.TransactionService();
        this.createTransaction = async (req, res) => {
            try {
                const { activity_type_id, montant, description } = req.body;
                const firebaseUid = req.user.uid;
                const transaction = await this.transactionService.createTransaction(firebaseUid, activity_type_id, montant, description);
                res.status(201).json({
                    success: true,
                    message: 'Dépense enregistrée avec succès',
                    data: transaction
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        };
        this.deleteTransaction = async (req, res) => {
            try {
                const transactionId = Number(req.params.id);
                const firebaseUid = req.user.uid;
                await this.transactionService.deleteTransaction(firebaseUid, transactionId);
                res.status(200).json({
                    success: true,
                    message: 'Transaction supprimée et montant remboursé'
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        };
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map
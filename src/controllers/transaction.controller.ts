import { Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AuthRequest } from '../middlewares/authMiddleware';


export class TransactionController {
  private transactionService = new TransactionService();

  createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { activity_type_id, montant, description } = req.body;
      const firebaseUid = req.user!.uid;

      const transaction = await this.transactionService.createTransaction(
        firebaseUid,
        activity_type_id,
        montant,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Dépense enregistrée avec succès',
        data: transaction
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const transactionId = Number(req.params.id);
      const firebaseUid = req.user!.uid;
      
      await this.transactionService.deleteTransaction(firebaseUid, transactionId);
      
      res.status(200).json({
        success: true,
        message: 'Transaction supprimée et montant remboursé'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

   exportHistoriquePdf = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const firebaseUid = req.user!.uid;
      await this.transactionService.ImporteHistoriquePdf(firebaseUid, res);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
  
}

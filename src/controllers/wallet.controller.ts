import { Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { AuthRequest } from '../middlewares/authMiddleware';


export class WalletController {
  private walletService = new WalletService();

  addFunds = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { montant } = req.body;
      const firebaseUid = req.user!.uid;

      const wallet = await this.walletService.addFunds(firebaseUid, montant);
      
      res.status(200).json({
        success: true,
        message: 'Fonds ajoutés avec succès',
        data: {
          nouveau_solde: wallet.solde_total
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  getMyWallet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const firebaseUid = req.user!.uid;
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };


  /**
   * 
   * @param req 
   * @param res 
   */
  getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const firebaseUid = req.user!.uid;
      const balance = await this.walletService.getBalance(firebaseUid);
      
      res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const firebaseUid = req.user!.uid;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const transactions = await this.walletService.getTransactionHistory(firebaseUid, limit);
      
      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };



 deleteBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.user!.uid;
    const result = await this.walletService.deleteBalance(firebaseUid);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        nouv_solde: result.solde
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

}

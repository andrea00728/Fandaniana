import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class WalletController {
    private walletService;
    addFunds: (req: AuthRequest, res: Response) => Promise<void>;
    getMyWallet: (req: AuthRequest, res: Response) => Promise<void>;
    getBalance: (req: AuthRequest, res: Response) => Promise<void>;
    getTransactionHistory: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=wallet.controller.d.ts.map
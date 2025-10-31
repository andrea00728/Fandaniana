import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class TransactionController {
    private transactionService;
    createTransaction: (req: AuthRequest, res: Response) => Promise<void>;
    deleteTransaction: (req: AuthRequest, res: Response) => Promise<void>;
}
//# sourceMappingURL=transaction.controller.d.ts.map
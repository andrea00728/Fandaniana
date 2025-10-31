import { Transaction } from '../entities/Transaction';
export declare class TransactionService {
    createTransaction(firebaseUid: string, activityTypeId: number, montant: number, description?: string): Promise<Transaction>;
    deleteTransaction(firebaseUid: string, transactionId: number): Promise<void>;
}
//# sourceMappingURL=transaction.service.d.ts.map
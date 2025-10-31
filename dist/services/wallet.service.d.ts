import { Transaction } from '../entities/Transaction';
import { Wallet } from '../entities/wallet';
export declare class WalletService {
    private walletRepository;
    getWalletByUid(firebaseUid: string): Promise<Wallet | null>;
    addFunds(firebaseUid: string, montant: number): Promise<Wallet>;
    getBalance(firebaseUid: string): Promise<{
        solde: number;
        total_depenses: number;
        nombre_transactions: number;
        email: string;
    }>;
    getTransactionHistory(firebaseUid: string, limit?: number): Promise<Transaction[]>;
}
//# sourceMappingURL=wallet.service.d.ts.map
import { Transaction } from '../entities/Transaction';
import { Wallet } from '../entities/wallet';
export declare class WalletService {
    private walletRepository;
    getWalletByUid(firebaseUid: string): Promise<Wallet | null>;
    addFunds(firebaseUid: string, montant: number): Promise<Wallet>;
    /**
     * Retourne le solde actuel, le total cumulé des dépenses et le nombre de transactions
     * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
     * @returns {Promise<{ solde: number, total_depenses: number, nombre_transactions: number, email: string }>}
     * @throws {Error} - Si le portefeuille est introuvable
     */
    getBalance(firebaseUid: string): Promise<{
        solde: number;
        total_depenses: number;
        nombre_transactions: number;
        email: string;
    }>;
    /**
     * Récupère l'historique des transactions du portefeuille
     * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
     * @param {number} [limit=50] - Nombre maximum de transactions à retourner
     * @returns {Promise<Transaction[]>} - Liste des transactions triées par date décroissante
     * @throws {Error} - Si le portefeuille est introuvable
     */
    getTransactionHistory(firebaseUid: string, limit?: number): Promise<Transaction[]>;
    deleteBalance(firebaseUid: string): Promise<{
        solde: number;
    }>;
}
//# sourceMappingURL=wallet.service.d.ts.map
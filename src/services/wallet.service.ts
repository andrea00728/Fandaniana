
import { AppDataSource } from '../config/data-source';
import { Transaction } from '../entities/Transaction';
import { Wallet } from '../entities/wallet';

export class WalletService {
  private walletRepository = AppDataSource.getRepository(Wallet);

  async getWalletByUid(firebaseUid: string): Promise<Wallet | null> {
    return await this.walletRepository.findOne({
      where: { firebase_uid: firebaseUid },
      relations: ['transactions', 'transactions.activityType']
    });
  }

  async addFunds(firebaseUid: string, montant: number): Promise<Wallet> {
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

  async getBalance(firebaseUid: string): Promise<{ 
    solde: number; 
    total_depenses: number; 
    nombre_transactions: number;
    email: string;
  }> {
    const wallet = await this.walletRepository.findOne({
      where: { firebase_uid: firebaseUid },
      relations: ['transactions']
    });

    if (!wallet) {
      throw new Error('Portefeuille introuvable');
    }

    const totalDepenses = wallet.transactions.reduce(
      (sum, t) => sum + Number(t.montant), 0
    );

    return {
      solde: Number(wallet.solde_total),
      total_depenses: totalDepenses,
      nombre_transactions: wallet.transactions.length,
      email: wallet.email
    };
  }

  async getTransactionHistory(
    firebaseUid: string, 
    limit: number = 50
  ): Promise<Transaction[]> {
    const wallet = await this.walletRepository.findOne({
      where: { firebase_uid: firebaseUid }
    });

    if (!wallet) {
      throw new Error('Portefeuille introuvable');
    }

    const transactionRepository = AppDataSource.getRepository(Transaction);
    
    return await transactionRepository.find({
      where: { wallet_id: wallet.id },
      relations: ['activityType'],
      order: { date_transaction: 'DESC' },
      take: limit
    });
  }
}

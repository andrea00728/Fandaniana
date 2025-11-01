
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

  /**
   * Retourne le solde actuel, le total cumulé des dépenses et le nombre de transactions
   * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
   * @returns {Promise<{ solde: number, total_depenses: number, nombre_transactions: number, email: string }>}
   * @throws {Error} - Si le portefeuille est introuvable
   */
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

  /**
   * Récupère l'historique des transactions du portefeuille
   * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
   * @param {number} [limit=50] - Nombre maximum de transactions à retourner
   * @returns {Promise<Transaction[]>} - Liste des transactions triées par date décroissante
   * @throws {Error} - Si le portefeuille est introuvable
   */
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

  /**
   * Réinitialiser le solde du portefeuille
   * @param {string} firebaseUid - L'UID Firebase de l'utilisateur
   * @returns {Promise<{solde: number, message: string}>} - Le solde actuel et un message de confirmation
   * @throws {Error} - Si le portefeuille est introuvable ou déjà vide
   */
async deleteBalance(firebaseUid: string): Promise<{
  solde: number;
  message: string;
}> {
  const wallet = await this.walletRepository.findOne({
    where: { firebase_uid: firebaseUid }
  });

  if (!wallet) {
    throw new Error('Portefeuille introuvable');
  }

  if (wallet.solde_total === 0) {
    throw new Error('votre portefeuille est deja vide');
  }

  wallet.solde_total = 0;
  const updateSold = await this.walletRepository.save(wallet);

  return {
    solde: updateSold.solde_total,
    message: "votre portefeuille est vide"
  };
}

//**
//  */
}

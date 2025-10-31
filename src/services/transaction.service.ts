import { Transaction } from '../entities/Transaction';
import { ActivityType } from '../entities/ActivityType';
import { AppDataSource } from '../config/data-source';
import { Wallet } from '../entities/wallet';

export class TransactionService {
  async createTransaction(
    firebaseUid: string,
    activityTypeId: number,
    montant: number,
    description?: string
  ): Promise<Transaction> {
    if (montant <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    return await AppDataSource.transaction(async (manager) => {
      // Récupérer le wallet de l'utilisateur
      const wallet = await manager.findOne(Wallet, {
        where: { firebase_uid: firebaseUid },
        lock: { mode: 'pessimistic_write' }
      });

      if (!wallet) {
        throw new Error('Portefeuille introuvable');
      }

      // Vérifier le type d'activité
      const activityType = await manager.findOne(ActivityType, {
        where: { id: activityTypeId }
      });

      if (!activityType) {
        throw new Error('Type d\'activité introuvable');
      }

      // Validation: Solde insuffisant
      if (Number(wallet.solde_total) < Number(montant)) {
        throw new Error(
          `Solde insuffisant. Solde actuel: ${wallet.solde_total} Ar, Montant requis: ${montant} Ar`
        );
      }

      // Créer la transaction
      const transaction = manager.create(Transaction, {
        wallet_id: wallet.id,
        activity_type_id: activityTypeId,
        montant: montant,
        description: description
      });
      await manager.save(transaction);

      // Déduire le montant du solde
      wallet.solde_total = Number(wallet.solde_total) - Number(montant);
      await manager.save(wallet);

      return transaction;
    });
  }

  async deleteTransaction(firebaseUid: string, transactionId: number): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(Transaction, {
        where: { id: transactionId },
        relations: ['wallet']
      });

      if (!transaction) {
        throw new Error('Transaction introuvable');
      }

      // Vérifier que la transaction appartient bien à l'utilisateur
      if (transaction.wallet.firebase_uid !== firebaseUid) {
        throw new Error('Cette transaction ne vous appartient pas');
      }

      const wallet = await manager.findOne(Wallet, {
        where: { id: transaction.wallet_id },
        lock: { mode: 'pessimistic_write' }
      });

      if (!wallet) {
        throw new Error('Portefeuille introuvable');
      }

      // Rembourser le montant
      wallet.solde_total = Number(wallet.solde_total) + Number(transaction.montant);
      await manager.save(wallet);

      // Supprimer la transaction
      await manager.remove(transaction);
    });
  }
}

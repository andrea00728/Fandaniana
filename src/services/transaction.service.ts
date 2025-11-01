import { Transaction } from '../entities/Transaction';
import { ActivityType } from '../entities/ActivityType';
import { AppDataSource } from '../config/data-source';
import { Wallet } from '../entities/wallet';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
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


 async ImporteHistoriquePdf(firebaseUid: string, res: Response): Promise<void> {
    try {
      // Récupérer le portefeuille et les transactions
      const wallet = await AppDataSource.getRepository(Wallet).findOne({
        where: { firebase_uid: firebaseUid },
        relations: ['transactions', 'transactions.activityType']
      });

      if (!wallet) {
        throw new Error('Portefeuille introuvable');
      }

      if (!wallet.transactions || wallet.transactions.length === 0) {
        throw new Error('Aucune transaction à exporter');
      }

      // Créer un nouveau document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Configurer les headers HTTP
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="historique-transactions-${new Date().toISOString().split('T')[0]}.pdf"`
      );

      // Pipe le PDF vers la réponse
      doc.pipe(res);

      // En-tête du document
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .text('Fandaniana', { align: 'center' })
        .fontSize(14)
        .text('Historique des Transactions', { align: 'center' })
        .moveDown(0.5);

      // Informations du portefeuille
      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Email: ${wallet.email}`, { align: 'left' })
        .text(`Solde actuel: ${Number(wallet.solde_total).toLocaleString('fr-FR')} Ar`)
        .text(`Date d'export: ${new Date().toLocaleString('fr-FR')}`)
        .moveDown(1);

      // Ligne séparatrice
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // En-têtes du tableau
      const tableTop = doc.y;
      const col1 = 60;
      const col2 = 150;
      const col3 = 280;
      const col4 = 400;
      const col5 = 480;
      const rowHeight = 25;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Date', col1, tableTop)
        .text('Type', col2, tableTop)
        .text('Description', col3, tableTop)
        .text('Montant (Ar)', col4, tableTop)
        .text('Solde', col5, tableTop);

      doc.moveDown(1.2);

      // Ligne séparatrice
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Contenu du tableau
      doc.font('Helvetica').fontSize(9);

      let cumulBalance = Number(wallet.solde_total);
      
      // Trier les transactions par date croissante pour recalculer les soldes
      const sortedTransactions = [...wallet.transactions].sort(
        (a, b) => new Date(a.date_transaction).getTime() - new Date(b.date_transaction).getTime()
      );

      // Recalculer le solde initial
      let balanceAtStart = Number(wallet.solde_total);
      sortedTransactions.forEach(t => {
        balanceAtStart += Number(t.montant);
      });

      // Afficher les transactions
      sortedTransactions.forEach((transaction, index) => {
        const dateStr = new Date(transaction.date_transaction).toLocaleString('fr-FR');
        const activityName = transaction.activityType?.nom || 'N/A';
        const description = transaction.description || '-';
        const montantStr = Number(transaction.montant).toLocaleString('fr-FR');
        const balanceStr = balanceAtStart.toLocaleString('fr-FR');

        doc
          .text(dateStr.substring(0, 10), col1)
          .text(activityName, col2)
          .text(description.substring(0, 20), col3)
          .text(montantStr, col4)
          .text(balanceStr, col5);

        doc.moveDown(0.8);
        balanceAtStart -= Number(transaction.montant);
      });

      // Ligne séparatrice
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Résumé
      const totalTransactions = wallet.transactions.length;
      const totalDepenses = wallet.transactions.reduce(
        (sum, t) => sum + Number(t.montant),
        0
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(`Total des transactions: ${totalTransactions}`)
        .text(`Total dépensé: ${totalDepenses.toLocaleString('fr-FR')} Ar`)
        .moveDown(1);

      // Pied de page
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#999999')
        .text('Document généré automatiquement par Fandaniana', { align: 'center' })
        .text(`${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

      // Finaliser le PDF
      doc.end();
    } catch (error: any) {
      throw new Error(`Erreur lors de la génération du PDF: ${error.message}`);
    }
  }
}

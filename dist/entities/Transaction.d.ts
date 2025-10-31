import { Wallet } from './wallet';
import { ActivityType } from './ActivityType';
export declare class Transaction {
    id: number;
    wallet_id: number;
    activity_type_id: number;
    montant: number;
    description: string | undefined;
    date_transaction: Date;
    wallet: Wallet;
    activityType: ActivityType;
}
//# sourceMappingURL=Transaction.d.ts.map
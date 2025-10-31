export class CreateTransactionDto {
  wallet_id!: number;
  activity_type_id!: number;
  montant!: number;
  description?: string;
}

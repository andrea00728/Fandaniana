import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Check } from 'typeorm';
import { Wallet } from './wallet';
import { ActivityType } from './ActivityType';

@Entity('transactions')
@Check(`"montant" > 0`)
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  wallet_id!: number;

  @Column()
  activity_type_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montant!: number;

  @Column({ type: 'text', nullable: true })
  description!: string|undefined;

  @CreateDateColumn()
  date_transaction!: Date;

  @ManyToOne(() => Wallet, wallet => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @ManyToOne(() => ActivityType, activityType => activityType.transactions)
  @JoinColumn({ name: 'activity_type_id' })
  activityType!: ActivityType;
}

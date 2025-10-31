import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Transaction } from './Transaction';


@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  solde_total!: number;

  @Column()
  @Index({ unique: true }) // Un seul wallet par utilisateur
  firebase_uid!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 50, default: 'user' })
  role!: string;

  @Column({ length: 100, nullable: true })
  nom!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Transaction, transaction => transaction.wallet)
  transactions!: Transaction[];
}

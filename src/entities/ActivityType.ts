import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from './Transaction';

@Entity('activity_types')
export class ActivityType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nom!: string;

  @Column({ type: 'text', nullable: true })
  description!: string|undefined;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string|undefined;

  @OneToMany(() => Transaction, transaction => transaction.activityType)
  transactions!: Transaction[];
}

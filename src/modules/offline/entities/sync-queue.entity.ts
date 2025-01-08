import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SyncOperation } from '../enums/sync-operation.enum';

export type SyncStatus = 'pending' | 'completed' | 'failed';

@Entity('sync_queue')
export class SyncQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({
    type: 'enum',
    enum: SyncOperation,
  })
  operation: SyncOperation;

  @Column('json')
  data: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status: SyncStatus;

  @Column({ default: 0 })
  attempts: number;

  @Column({ nullable: true })
  lastError: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'synced_at' })
  syncedAt: Date;
}

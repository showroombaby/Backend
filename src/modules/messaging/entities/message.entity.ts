import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'product_id', nullable: true })
  productId?: string;

  @Column('text', { default: MessageStatus.SENT })
  status: MessageStatus;

  @Column('boolean', { name: 'archived_by_sender', default: false })
  archivedBySender: boolean;

  @Column('boolean', { name: 'archived_by_recipient', default: false })
  archivedByRecipient: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

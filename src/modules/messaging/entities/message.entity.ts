import { ApiProperty } from '@nestjs/swagger';
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

@Entity('messages')
export class Message {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Bonjour, est-ce toujours disponible ?' })
  @Column('text')
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column('uuid', { name: 'sender_id' })
  senderId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column('uuid', { name: 'recipient_id' })
  recipientId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column('uuid', { name: 'product_id', nullable: true })
  productId: string;

  @ApiProperty({ example: false })
  @Column('boolean', { default: false })
  read: boolean;

  @ApiProperty({ example: false })
  @Column('boolean', { name: 'archived_by_sender', default: false })
  archivedBySender: boolean;

  @ApiProperty({ example: false })
  @Column('boolean', { name: 'archived_by_recipient', default: false })
  archivedByRecipient: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

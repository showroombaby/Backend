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
  @Column('uuid')
  senderId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column('uuid')
  recipientId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column('uuid', { nullable: true })
  productId: string;

  @ApiProperty({ example: false })
  @Column('boolean', { default: false })
  read: boolean;

  @ApiProperty({ example: false })
  @Column('boolean', { default: false })
  archivedBySender: boolean;

  @ApiProperty({ example: false })
  @Column('boolean', { default: false })
  archivedByRecipient: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;
}

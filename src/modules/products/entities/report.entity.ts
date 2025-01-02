import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportReason {
  INAPPROPRIATE = 'inappropriate',
  FAKE = 'fake',
  OFFENSIVE = 'offensive',
  SPAM = 'spam',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

@Entity('reports')
@Check(`"reason" IN ('inappropriate', 'fake', 'offensive', 'spam', 'other')`)
@Check(`"status" IN ('pending', 'reviewed', 'resolved', 'rejected')`)
export class Report {
  @ApiProperty({
    description: 'ID unique du signalement',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur qui signale',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ApiProperty({
    description: 'ID du produit signalé',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'product_id' })
  productId: string;

  @ApiProperty({
    description: 'Raison du signalement',
    enum: ReportReason,
    example: 'inappropriate'
  })
  @Column({
    type: 'varchar',
    enum: ReportReason,
    default: ReportReason.OTHER
  })
  reason: ReportReason;

  @ApiProperty({
    description: 'Description détaillée du signalement',
    example: 'Ce produit contient du contenu inapproprié'
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'Statut du signalement',
    enum: ReportStatus,
    example: 'pending'
  })
  @Column({
    type: 'varchar',
    enum: ReportStatus,
    default: ReportStatus.PENDING
  })
  status: ReportStatus;

  @ApiProperty({
    description: 'Note de modération',
    example: 'Signalement vérifié et validé'
  })
  @Column('text', { nullable: true })
  moderationNote?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({
    description: 'Date de création du signalement',
    example: '2024-01-02T12:00:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification du signalement',
    example: '2024-01-02T12:00:00Z'
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 
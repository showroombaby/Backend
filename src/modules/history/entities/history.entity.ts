import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  REPORT = 'report',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

@Entity('history')
@Check(`"action_type" IN ('create', 'update', 'delete', 'view', 'favorite', 'unfavorite', 'report', 'login', 'logout')`)
export class History {
  @ApiProperty({
    description: 'ID unique de l\'entrée d\'historique',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Type d\'action',
    enum: ActionType,
    example: ActionType.CREATE
  })
  @Column({
    name: 'action_type',
    type: 'varchar',
    enum: ActionType
  })
  actionType: ActionType;

  @ApiProperty({
    description: 'ID de l\'entité concernée',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'entity_id' })
  entityId: string;

  @ApiProperty({
    description: 'Type d\'entité',
    example: 'product'
  })
  @Column({ name: 'entity_type' })
  entityType: string;

  @ApiProperty({
    description: 'Détails supplémentaires de l\'action',
    example: '{"field": "status", "oldValue": "draft", "newValue": "published"}'
  })
  @Column('jsonb', { nullable: true })
  details?: Record<string, any>;

  @ApiProperty({
    description: 'Adresse IP de l\'utilisateur',
    example: '192.168.1.1'
  })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent du navigateur',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Date de création de l\'entrée',
    example: '2024-01-02T12:00:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 
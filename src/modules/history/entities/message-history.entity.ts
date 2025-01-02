import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';

export enum MessageAction {
  SENT = 'sent',
  READ = 'read',
  DELETED = 'deleted',
}

@Entity()
export class MessageHistory {
  @ApiProperty({ description: 'Identifiant unique de l\'entrée d\'historique' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Identifiant de l\'expéditeur' })
  @Column()
  @IsUUID()
  senderId: string;

  @ApiProperty({ description: 'Expéditeur du message' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ApiProperty({ description: 'Identifiant du destinataire' })
  @Column()
  @IsUUID()
  receiverId: string;

  @ApiProperty({ description: 'Destinataire du message' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @ApiProperty({ description: 'Identifiant du message' })
  @Column()
  @IsUUID()
  messageId: string;

  @ApiProperty({ description: 'Action effectuée sur le message', enum: MessageAction })
  @Column({
    type: 'enum',
    enum: MessageAction,
  })
  @IsEnum(MessageAction)
  action: MessageAction;

  @ApiProperty({ description: 'Contenu du message', required: false })
  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Date de création de l\'entrée' })
  @CreateDateColumn()
  createdAt: Date;
} 
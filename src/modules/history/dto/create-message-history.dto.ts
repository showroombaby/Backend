import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';
import { MessageAction } from '../entities/message-history.entity';

export class CreateMessageHistoryDto {
  @ApiProperty({ description: 'Identifiant du destinataire' })
  @IsUUID()
  receiverId: string;

  @ApiProperty({ description: 'Identifiant du message' })
  @IsUUID()
  messageId: string;

  @ApiProperty({ description: 'Action effectuée sur le message', enum: MessageAction })
  @IsEnum(MessageAction)
  action: MessageAction;

  @ApiProperty({ description: 'Contenu du message', required: false })
  @IsString()
  @IsOptional()
  content?: string;
} 
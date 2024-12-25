import { IsString, IsUUID, IsOptional, IsNumber, IsDate } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsUUID()
  receiverId: string;

  @IsUUID()
  @IsOptional()
  productId?: string;
}

export class MessageResponseDto {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    avatarUrl: string;
    name: string;
    email: string;
    rating?: number;
  };
  receiver: {
    id: string;
    username: string;
    avatarUrl: string;
    name: string;
    email: string;
    rating?: number;
  };
  product?: {
    id: string;
    title: string;
    price: number;
    images: { url: string }[];
  };
  isRead: boolean;
  createdAt: Date;
}

export class ConversationDto {
  userId: string;
  username: string;
  avatarUrl?: string;
  name: string;
  email: string;
  rating?: number;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: Date;
  productId?: string;
  productTitle?: string;
  productImage?: string;
} 
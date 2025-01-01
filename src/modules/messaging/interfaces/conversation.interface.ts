import { User } from '../../users/entities/user.entity';
import { Message } from '../entities/message.entity';

export interface ConversationResult {
  otherUserId: string;
  lastMessageDate: Date;
  unreadCount?: number;
}

export interface ConversationWithDetails {
  otherUser: Partial<User>;
  lastMessage: Message;
  unreadCount?: number;
  lastMessageDate: Date;
}

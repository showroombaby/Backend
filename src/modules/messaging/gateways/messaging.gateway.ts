import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsUser } from '../../auth/decorators/ws-user.decorator';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { User } from '../../users/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import {
  ApiMarkAsRead,
  ApiSendMessage,
  ApiTypingIndicator,
  ApiWebSocketConnection,
} from '../messaging.gateway.swagger';
import { MessagingService } from '../services/messaging.service';

interface NotificationPayload {
  type: 'message' | 'read' | 'typing' | 'archive' | 'unarchive';
  data: any;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:8080',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
  namespace: 'messaging',
})
@UseGuards(WsJwtGuard)
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();
  private userNotifications: Map<string, NotificationPayload[]> = new Map();

  constructor(private readonly messagingService: MessagingService) {}

  @ApiWebSocketConnection()
  async handleConnection(client: Socket) {
    try {
      // La validation du token est gérée par le guard
      const user = client.handshake.auth.user;
      if (user && user.id) {
        this.connectedUsers.set(user.id, client.id);
        client.join(`user_${user.id}`);
        this.server.emit('userConnected', user.id);

        // Envoyer les notifications en attente
        const pendingNotifications = this.userNotifications.get(user.id) || [];
        if (pendingNotifications.length > 0) {
          client.emit('pendingNotifications', pendingNotifications);
          this.userNotifications.delete(user.id);
        }
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const user = client.handshake.auth.user;
      if (user && user.id) {
        this.connectedUsers.delete(user.id);
        this.server.emit('userDisconnected', user.id);
      }
    } catch (error) {
      // Logger l'erreur si nécessaire
    }
  }

  @SubscribeMessage('message')
  @ApiSendMessage()
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @WsUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messagingService.createMessage(
        user.id,
        createMessageDto,
      );

      // Émettre le message au destinataire
      if (this.isUserOnline(createMessageDto.recipientId)) {
        this.server
          .to(`user_${createMessageDto.recipientId}`)
          .emit('newMessage', message);
      } else {
        // Stocker la notification pour une livraison ultérieure
        this.addNotification(createMessageDto.recipientId, {
          type: 'message',
          data: message,
        });
      }

      // Émettre une confirmation à l'expéditeur
      client.emit('messageSent', message);

      return message;
    } catch (error) {
      client.emit('messageError', {
        message: "Erreur lors de l'envoi du message",
        error: error.message,
      });
    }
  }

  @SubscribeMessage('read')
  @ApiMarkAsRead()
  async handleReadMessage(
    @MessageBody() data: { messageId: string },
    @WsUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messagingService.markMessageAsRead(
        data.messageId,
        user.id,
      );

      // Notifier l'expéditeur original que son message a été lu
      if (this.isUserOnline(message.senderId)) {
        this.server
          .to(`user_${message.senderId}`)
          .emit('messageRead', { messageId: message.id });
      } else {
        this.addNotification(message.senderId, {
          type: 'read',
          data: { messageId: message.id },
        });
      }

      return message;
    } catch (error) {
      client.emit('messageError', {
        message: 'Erreur lors du marquage du message comme lu',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('typing')
  @ApiTypingIndicator()
  async handleTyping(
    @MessageBody() data: { recipientId: string; isTyping: boolean },
    @WsUser() user: User,
  ) {
    if (this.isUserOnline(data.recipientId)) {
      this.server.to(`user_${data.recipientId}`).emit('userTyping', {
        userId: user.id,
        isTyping: data.isTyping,
      });
    }
  }

  @SubscribeMessage('archiveMessage')
  async handleArchiveMessage(
    @MessageBody() data: { messageId: string },
    @WsUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messagingService.archiveMessage(
        data.messageId,
        user.id,
      );

      // Notifier l'autre utilisateur que le message a été archivé
      const otherUserId =
        message.senderId === user.id ? message.recipientId : message.senderId;
      if (this.isUserOnline(otherUserId)) {
        this.server.to(`user_${otherUserId}`).emit('messageArchived', {
          messageId: message.id,
          archivedBySender: message.archivedBySender,
          archivedByRecipient: message.archivedByRecipient,
        });
      } else {
        this.addNotification(otherUserId, {
          type: 'archive',
          data: {
            messageId: message.id,
            archivedBySender: message.archivedBySender,
            archivedByRecipient: message.archivedByRecipient,
          },
        });
      }

      return message;
    } catch (error) {
      client.emit('messageError', {
        message: "Erreur lors de l'archivage du message",
        error: error.message,
      });
    }
  }

  @SubscribeMessage('unarchiveMessage')
  async handleUnarchiveMessage(
    @MessageBody() data: { messageId: string },
    @WsUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messagingService.unarchiveMessage(
        data.messageId,
        user.id,
      );

      // Notifier l'autre utilisateur que le message a été désarchivé
      const otherUserId =
        message.senderId === user.id ? message.recipientId : message.senderId;
      if (this.isUserOnline(otherUserId)) {
        this.server.to(`user_${otherUserId}`).emit('messageUnarchived', {
          messageId: message.id,
          archivedBySender: message.archivedBySender,
          archivedByRecipient: message.archivedByRecipient,
        });
      } else {
        this.addNotification(otherUserId, {
          type: 'unarchive',
          data: {
            messageId: message.id,
            archivedBySender: message.archivedBySender,
            archivedByRecipient: message.archivedByRecipient,
          },
        });
      }

      return message;
    } catch (error) {
      client.emit('messageError', {
        message: 'Erreur lors du désarchivage du message',
        error: error.message,
      });
    }
  }

  private getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private addNotification(userId: string, notification: NotificationPayload) {
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }
    this.userNotifications.get(userId).push(notification);
  }
}

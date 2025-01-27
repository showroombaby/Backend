import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { DeviceTokensService } from '../services/device-tokens.service';
import { NotificationsService } from '../services/notifications.service';

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
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokensService: DeviceTokensService,
  ) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket) {
    const userId = client.data.user?.id;
    if (!userId) {
      client.disconnect();
      return;
    }

    // Ajouter le socket à la liste des sockets de l'utilisateur
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(client.id);

    // Rejoindre la room personnelle de l'utilisateur
    await client.join(`user:${userId}`);

    // Envoyer le compteur de notifications non lues
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    client.emit('unreadCount', unreadCount);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.id;
    if (userId) {
      // Retirer le socket de la liste des sockets de l'utilisateur
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  @SubscribeMessage('markAsRead')
  @UseGuards(WsJwtGuard)
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    payload: { notificationId: string },
  ) {
    const userId = client.data.user?.id;
    if (!userId) return;

    await this.notificationsService.markAsRead(payload.notificationId, userId);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);

    // Émettre le nouveau compteur à tous les sockets de l'utilisateur
    this.server.to(`user:${userId}`).emit('unreadCount', unreadCount);
  }

  @SubscribeMessage('markAllAsRead')
  @UseGuards(WsJwtGuard)
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.id;
    if (!userId) return;

    await this.notificationsService.markAllAsRead(userId);

    // Émettre le nouveau compteur (0) à tous les sockets de l'utilisateur
    this.server.to(`user:${userId}`).emit('unreadCount', 0);
  }

  // Méthode pour envoyer une notification à un utilisateur
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);

    // Mettre à jour le compteur de notifications non lues
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadCount', unreadCount);
  }

  // Méthode pour envoyer une notification à plusieurs utilisateurs
  async sendNotificationToUsers(userIds: string[], notification: any) {
    for (const userId of userIds) {
      await this.sendNotificationToUser(userId, notification);
    }
  }
}

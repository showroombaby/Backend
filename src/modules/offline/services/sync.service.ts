import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncQueue } from '../entities/sync-queue.entity';
import { SyncOperation } from '../enums/sync-operation.enum';
import { MessagingService } from '../../messaging/services/messaging.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateMessageDto } from '../../messaging/dto/create-message.dto';
import { CreateNotificationDto } from '../../notifications/dto/create-notification.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(SyncQueue)
    private syncQueueRepository: Repository<SyncQueue>,
    private messagingService: MessagingService,
    private notificationsService: NotificationsService,
  ) {}

  async queueOperation(
    userId: string,
    entityType: string,
    entityId: string,
    operation: SyncOperation,
    data: any,
  ) {
    try {
      this.logger.debug(
        `Données reçues dans queueOperation: ${JSON.stringify({
          userId,
          entityType,
          entityId,
          operation,
          data,
        })}`,
      );

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Les données ne peuvent pas être vides');
      }

      // Vérifier les conflits potentiels
      const existingOperations = await this.syncQueueRepository.find({
        where: {
          entityId,
          entityType,
          status: 'pending',
        },
        order: {
          createdAt: 'ASC',
        },
      });

      if (existingOperations.length > 0) {
        // Gérer le conflit selon le type d'opération
        await this.handleConflict(existingOperations, operation, data);
      }

      // Valider les données avant la création
      await this.validateQueueData(entityType, operation, data);

      // Créer l'objet de synchronisation
      const syncItem = this.syncQueueRepository.create({
        userId,
        entityType,
        entityId,
        operation,
        data,
        status: 'pending',
        attempts: 0,
      });

      const savedItem = await this.syncQueueRepository.save(syncItem);

      this.logger.debug(`SyncItem sauvegardé: ${JSON.stringify(savedItem)}`);

      return savedItem;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de l'opération de synchronisation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async validateQueueData(
    entityType: string,
    operation: SyncOperation,
    data: any,
  ) {
    switch (entityType) {
      case 'message':
        if (operation === SyncOperation.CREATE) {
          if (!data.content || !data.recipientId) {
            throw new Error(
              'Les données du message sont invalides: contenu et destinataire requis',
            );
          }
        } else if (operation === SyncOperation.DELETE) {
          // Pour la suppression, aucune donnée supplémentaire n'est requise
          return;
        }
        break;
      case 'notification':
        if (operation === SyncOperation.CREATE) {
          if (!data.title || !data.message) {
            throw new Error(
              'Les données de notification sont invalides: titre et message requis',
            );
          }
        }
        break;
      default:
        throw new Error(`Type d'entité non supporté: ${entityType}`);
    }
  }

  private async handleConflict(
    existingOperations: SyncQueue[],
    newOperation: SyncOperation,
    newData: any,
  ) {
    const lastOperation = existingOperations[existingOperations.length - 1];

    // Si la dernière opération est une suppression, rejeter toute nouvelle opération
    if (lastOperation.operation === SyncOperation.DELETE) {
      throw new Error(
        'Impossible de modifier une entité marquée pour suppression',
      );
    }

    // Si la nouvelle opération est une création et qu'il existe déjà des opérations
    if (
      newOperation === SyncOperation.CREATE &&
      existingOperations.length > 0
    ) {
      throw new Error('Une opération est déjà en attente pour cette entité');
    }

    // Fusionner les mises à jour si possible
    if (
      newOperation === SyncOperation.UPDATE &&
      lastOperation.operation === SyncOperation.UPDATE
    ) {
      lastOperation.data = { ...lastOperation.data, ...newData };
      await this.syncQueueRepository.save(lastOperation);
      return;
    }
  }

  async processSyncQueue(userId: string) {
    const pendingItems = await this.syncQueueRepository.find({
      where: {
        userId,
        status: 'pending',
      },
      order: {
        createdAt: 'ASC',
      },
    });

    for (const item of pendingItems) {
      try {
        await this.processItem(item);
        item.status = 'completed';
        item.syncedAt = new Date();
        await this.syncQueueRepository.save(item);
      } catch (error) {
        item.status = 'failed';
        item.attempts += 1;
        item.lastError = error.message;
        await this.syncQueueRepository.save(item);
        console.error(
          `Erreur de synchronisation pour l'item ${item.id}:`,
          error,
        );
      }
    }
  }

  private async processItem(item: SyncQueue) {
    try {
      // Valider les données avant le traitement
      await this.validateOperation(item);

      // Incrémenter le compteur de tentatives
      item.attempts += 1;
      await this.syncQueueRepository.save(item);

      // Les données sont déjà un objet grâce au type JSONB de PostgreSQL
      const data = item.data;

      switch (item.operation) {
        case SyncOperation.CREATE:
          await this.processCreate(item, data);
          break;
        case SyncOperation.UPDATE:
          await this.processUpdate(item, data);
          break;
        case SyncOperation.DELETE:
          await this.processDelete(item);
          break;
        default:
          throw new Error(`Opération non supportée: ${item.operation}`);
      }

      // Marquer comme complété uniquement si l'opération réussit
      item.status = 'completed';
      item.syncedAt = new Date();
      await this.syncQueueRepository.save(item);
    } catch (error) {
      // Gestion détaillée des erreurs
      item.status = 'failed';
      item.lastError = error.message;

      // Si le nombre maximum de tentatives est atteint
      if (item.attempts >= 3) {
        item.status = 'failed';
        this.logger.error(
          `Échec définitif de la synchronisation pour l'item ${item.id} après ${item.attempts} tentatives`,
          error,
        );
      }

      await this.syncQueueRepository.save(item);
      throw error;
    }
  }

  private async validateOperation(item: SyncQueue) {
    // Valider le type d'entité
    if (!['message', 'notification'].includes(item.entityType)) {
      throw new Error(`Type d'entité non valide: ${item.entityType}`);
    }

    // Valider l'opération
    if (!Object.values(SyncOperation).includes(item.operation)) {
      throw new Error(`Type d'opération non valide: ${item.operation}`);
    }

    // Valider les données en fonction du type d'entité
    switch (item.entityType) {
      case 'message':
        await this.validateMessageData(item);
        break;
      case 'notification':
        await this.validateNotificationData(item);
        break;
    }
  }

  private async validateMessageData(item: SyncQueue) {
    if (item.operation === SyncOperation.CREATE) {
      const data = item.data as CreateMessageDto;
      if (!data.content || !data.recipientId) {
        throw new Error(
          'Données de message invalides: contenu et destinataire requis',
        );
      }
      // Empêcher l'envoi de messages à soi-même
      if (data.recipientId === item.userId) {
        throw new Error(
          'Vous ne pouvez pas vous envoyer un message à vous-même',
        );
      }
    }
  }

  private async validateNotificationData(item: SyncQueue) {
    if (item.operation === SyncOperation.CREATE) {
      const data = item.data as CreateNotificationDto;
      if (!data.title || !data.message) {
        throw new Error(
          'Données de notification invalides: titre et message requis',
        );
      }
    }
  }

  private async processCreate(item: SyncQueue, data: any) {
    switch (item.entityType) {
      case 'message':
        const messageDto = data as CreateMessageDto;
        const createdMessage = await this.messagingService.createMessage(
          item.userId,
          messageDto,
        );
        // Mettre à jour l'entityId avec l'ID réel du message créé
        await this.updateEntityId(item, createdMessage.id);
        break;
      case 'notification':
        const notificationDto = data as CreateNotificationDto;
        await this.notificationsService.create(notificationDto);
        break;
      default:
        throw new Error(`Type d'entité non supporté: ${item.entityType}`);
    }
  }

  private async updateEntityId(item: SyncQueue, newEntityId: string) {
    item.entityId = newEntityId;
    await this.syncQueueRepository.save(item);
  }

  private async processUpdate(item: SyncQueue, data: any) {
    switch (item.entityType) {
      case 'message':
        if (data.read !== undefined) {
          await this.messagingService.markMessageAsRead(
            item.entityId,
            item.userId,
          );
        }
        break;
      case 'notification':
        if (data.read !== undefined) {
          await this.notificationsService.markAsRead(
            item.entityId,
            item.userId,
          );
        }
        break;
      default:
        throw new Error(`Type d'entité non supporté: ${item.entityType}`);
    }
  }

  private async processDelete(item: SyncQueue) {
    switch (item.entityType) {
      case 'message':
        await this.messagingService.archiveMessage(item.entityId, item.userId);
        break;
      case 'notification':
        await this.notificationsService.delete(item.entityId, item.userId);
        break;
      default:
        throw new Error(`Type d'entité non supporté: ${item.entityType}`);
    }
  }

  async getFailedOperations(userId: string) {
    return await this.syncQueueRepository.find({
      where: {
        userId,
        status: 'failed',
      },
    });
  }

  async getPendingOperationsCount(userId: string) {
    return await this.syncQueueRepository.count({
      where: {
        userId,
        status: 'pending',
      },
    });
  }

  async getFailedOperationsCount(userId: string) {
    return await this.syncQueueRepository.count({
      where: {
        userId,
        status: 'failed',
      },
    });
  }

  async getCompletedOperationsCount(userId: string) {
    return await this.syncQueueRepository.count({
      where: {
        userId,
        status: 'completed',
      },
    });
  }

  async getPendingOperations(userId: string) {
    return await this.syncQueueRepository.find({
      where: {
        userId,
        status: 'pending',
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async retryFailedOperations(userId: string) {
    const failedItems = await this.getFailedOperations(userId);
    for (const item of failedItems) {
      item.status = 'pending';
      await this.syncQueueRepository.save(item);
    }
    await this.processSyncQueue(userId);
  }

  async clearCompletedOperations(userId: string, olderThan?: Date) {
    const query = this.syncQueueRepository
      .createQueryBuilder()
      .delete()
      .from(SyncQueue)
      .where('userId = :userId', { userId })
      .andWhere('status = :status', { status: 'completed' });

    if (olderThan) {
      query.andWhere('"created_at" < :olderThan', { olderThan });
    }

    await query.execute();
  }

  private async validateMessage(messageId: string, userId: string) {
    const message = await this.messagingService.getConversation(
      userId,
      messageId,
    );
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  }

  private async validateNotification(notificationId: string, userId: string) {
    const notification = await this.notificationsService.findAll(userId, {
      page: 1,
      limit: 1,
    });
    if (
      !notification.data.length ||
      notification.data[0].id !== notificationId
    ) {
      throw new Error('Notification not found');
    }
    return notification.data[0];
  }
}

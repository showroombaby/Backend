import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncQueue } from '../entities/sync-queue.entity';
import { SyncOperation } from '../enums/sync-operation.enum';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncQueue)
    private syncQueueRepository: Repository<SyncQueue>,
  ) {}

  async queueOperation(
    userId: string,
    entityType: string,
    entityId: string,
    operation: SyncOperation,
    data: any,
  ) {
    const syncItem = this.syncQueueRepository.create({
      userId,
      entityType,
      entityId,
      operation,
      data,
      status: 'pending',
      attempts: 0,
    });

    return await this.syncQueueRepository.save(syncItem);
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
        await this.syncQueueRepository.save(item);
      } catch (error) {
        item.status = 'failed';
        item.attempts += 1;
        item.lastError = error.message;
        await this.syncQueueRepository.save(item);
      }
    }
  }

  private async processItem(item: SyncQueue) {
    switch (item.operation) {
      case SyncOperation.CREATE:
        await this.processCreate(item);
        break;
      case SyncOperation.UPDATE:
        await this.processUpdate(item);
        break;
      case SyncOperation.DELETE:
        await this.processDelete(item);
        break;
      default:
        throw new Error(`Opération non supportée: ${item.operation}`);
    }
  }

  private async processCreate(item: SyncQueue) {
    // Implémentation de la création
  }

  private async processUpdate(item: SyncQueue) {
    // Implémentation de la mise à jour
  }

  private async processDelete(item: SyncQueue) {
    // Implémentation de la suppression
  }

  async getFailedOperations(userId: string) {
    return await this.syncQueueRepository.find({
      where: {
        userId,
        status: 'failed',
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
      query.andWhere('createdAt < :olderThan', { olderThan });
    }

    await query.execute();
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OfflineController } from './controllers/offline.controller';
import { SyncQueue } from './entities/sync-queue.entity';
import { SyncService } from './services/sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncQueue]),
    MessagingModule,
    NotificationsModule,
  ],
  controllers: [OfflineController],
  providers: [SyncService],
  exports: [SyncService],
})
export class OfflineModule {}

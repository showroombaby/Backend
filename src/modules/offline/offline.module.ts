import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfflineController } from './controllers/offline.controller';
import { SyncQueue } from './entities/sync-queue.entity';
import { SyncService } from './services/sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([SyncQueue])],
  controllers: [OfflineController],
  providers: [SyncService],
  exports: [SyncService],
})
export class OfflineModule {}

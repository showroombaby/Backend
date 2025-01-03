import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { OfflineController } from './controllers/offline.controller';
import { OfflineService } from './services/offline.service';

@Module({
  imports: [CacheModule, ProductsModule, UsersModule],
  controllers: [OfflineController],
  providers: [OfflineService],
})
export class OfflineModule {}

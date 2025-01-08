import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import databaseConfig from './config/database.config';
import { validationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OfflineModule } from './modules/offline/offline.module';
import { ProductsModule } from './modules/products/products.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validationSchema,
      envFilePath: '.env',
      expandVariables: true,
      cache: true,
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 3600, // 1 heure par défaut
        max: 1000, // Nombre maximum d'éléments en cache
        isGlobal: true,
        retryStrategy: (times: number) => {
          // Stratégie de reconnexion
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        commandTimeout: 5000, // Timeout des commandes Redis
        compression: {
          threshold: 1024, // Compresser les valeurs > 1KB
        },
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    EmailModule,
    ProductsModule,
    StorageModule,
    MessagingModule,
    MonitoringModule,
    OfflineModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

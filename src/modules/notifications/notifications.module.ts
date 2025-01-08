import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { DeviceTokensController } from './controllers/device-tokens.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { DeviceTokensService } from './services/device-tokens.service';
import { NotificationsService } from './services/notifications.service';
import { PushNotificationsService } from './services/push-notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DeviceToken]),
    ConfigModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [NotificationsController, DeviceTokensController],
  providers: [
    NotificationsService,
    DeviceTokensService,
    PushNotificationsService,
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    DeviceTokensService,
    PushNotificationsService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}

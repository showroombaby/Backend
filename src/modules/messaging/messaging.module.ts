import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MessagingController } from './controllers/messaging.controller';
import { Message } from './entities/message.entity';
import { MessagingGateway } from './gateways/messaging.gateway';
import { MessagingService } from './services/messaging.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Product]),
    UsersModule,
    AuthModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}

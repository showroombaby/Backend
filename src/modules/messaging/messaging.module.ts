import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { MessagingController } from './controllers/messaging.controller';
import { Message } from './entities/message.entity';
import { MessagingGateway } from './gateways/messaging.gateway';
import { MessagingService } from './services/messaging.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Product]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '24h'),
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}

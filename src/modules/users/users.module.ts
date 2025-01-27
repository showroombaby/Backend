import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { FileService } from './services/file.service';
import { UsersService } from './services/users.service';
import { UserSubscriber } from './subscribers/user.subscriber';
import { UserRating } from './entities/user-rating.entity';
import { UserRatingsService } from './services/user-ratings.service';
import { UserRatingsController } from './controllers/user-ratings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRating])],
  providers: [UsersService, UserSubscriber, FileService, UserRatingsService],
  controllers: [UsersController, UserRatingsController],
  exports: [UsersService],
})
export class UsersModule {}

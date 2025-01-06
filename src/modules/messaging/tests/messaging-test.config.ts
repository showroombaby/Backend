import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { Message } from '../entities/message.entity';

export const messagingTestConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_TEST_DATABASE || 'showroom_test',
  entities: [Message, User, Product],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

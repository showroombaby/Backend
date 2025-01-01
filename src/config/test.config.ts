import { Category } from '@modules/categories/entities/category.entity';
import { Message } from '@modules/messaging/entities/message.entity';
import { ProductImage } from '@modules/products/entities/product-image.entity';
import { ProductView } from '@modules/products/entities/product-view.entity';
import { Product } from '@modules/products/entities/product.entity';
import { SavedFilter } from '@modules/products/entities/saved-filter.entity';
import { User } from '@modules/users/entities/user.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const testConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_TEST_DATABASE || 'showroom_test',
  entities: [
    User,
    Product,
    Category,
    SavedFilter,
    ProductImage,
    ProductView,
    Message,
  ],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

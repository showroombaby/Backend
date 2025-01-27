import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Category } from '../src/modules/categories/entities/category.entity';
import { ProductImage } from '../src/modules/products/entities/product-image.entity';
import { ProductView } from '../src/modules/products/entities/product-view.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { SavedFilter } from '../src/modules/products/entities/saved-filter.entity';
import { User } from '../src/modules/users/entities/user.entity';

export const testConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'showroom_baby_test',
  entities: [Product, ProductImage, Category, User, ProductView, SavedFilter],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

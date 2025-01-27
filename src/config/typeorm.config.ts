import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Category } from '../modules/categories/entities/category.entity';
import { ProductImage } from '../modules/products/entities/product-image.entity';
import { ProductView } from '../modules/products/entities/product-view.entity';
import { Product } from '../modules/products/entities/product.entity';
import { SavedFilter } from '../modules/products/entities/saved-filter.entity';
import { User } from '../modules/users/entities/user.entity';

config();

const options: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Product, ProductImage, Category, User, ProductView, SavedFilter],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(options);

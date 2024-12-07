import { Category } from '@/modules/products/entities/category.entity';
import { ProductImage } from '@/modules/products/entities/product-image.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { User } from '@/modules/users/entities/user.entity';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'showroom_baby',
  entities: [Category, Product, ProductImage, User],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

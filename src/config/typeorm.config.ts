import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CreateUsersTable1709000000000 } from '../migrations/1709000000000-create-users-table';
import { CreateProductsTables1710000000000 } from '../migrations/1710000000000-create-products-tables';
import { AddProductViews1710000000002 } from '../migrations/1710000000002-add-product-views';
import { AddSavedFilters1710000000003 } from '../migrations/1710000000003-add-saved-filters';
import { AddUserFields1710000000004 } from '../migrations/1710000000004-add-user-fields';
import { AddUserFields1710000000005 } from '../migrations/1710000000005-add-user-fields';
import { CreateMessagesTable1710000000005 } from '../migrations/1710000000005-create-messages-table';
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
  migrations: [
    CreateUsersTable1709000000000,
    CreateProductsTables1710000000000,
    AddProductViews1710000000002,
    AddSavedFilters1710000000003,
    AddUserFields1710000000004,
    AddUserFields1710000000005,
    CreateMessagesTable1710000000005,
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(options);

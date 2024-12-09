import { DataSourceOptions } from 'typeorm';
import { Category } from '../modules/products/entities/category.entity';
import { ProductImage } from '../modules/products/entities/product-image.entity';
import { ProductView } from '../modules/products/entities/product-view.entity';
import { Product } from '../modules/products/entities/product.entity';
import { SavedFilter } from '../modules/products/entities/saved-filter.entity';
import { User } from '../modules/users/entities/user.entity';

export const testIntegrationConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [User, Product, Category, ProductView, SavedFilter, ProductImage],
  synchronize: true,
  dropSchema: true,
  logging: false,
};

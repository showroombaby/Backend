import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { SavedFilter } from '../../modules/products/entities/saved-filter.entity';
import { ProductImage } from '../../modules/products/entities/product-image.entity';
import { ProductView } from '../../modules/products/entities/product-view.entity';
import { UsersModule } from '../../modules/users/users.module';
import { ProductsModule } from '../../modules/products/products.module';
import { CategoriesModule } from '../../modules/categories/categories.module';
import { AuthModule } from '../../modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          DATABASE_URL: ':memory:',
          JWT_SECRET: 'test-secret',
          JWT_EXPIRATION: '1h',
        }),
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        User,
        Product,
        Category,
        SavedFilter,
        ProductImage,
        ProductView,
      ],
      synchronize: true,
      dropSchema: true,
      logging: false,
      autoLoadEntities: true,
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([
      User,
      Product,
      Category,
      SavedFilter,
      ProductImage,
      ProductView,
    ]),
    UsersModule,
    ProductsModule,
    CategoriesModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
  exports: [TypeOrmModule],
})
export class TestModule {
  static forRoot() {
    return {
      module: TestModule,
      imports: [],
    };
  }
}

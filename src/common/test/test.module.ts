import { Category } from '@modules/categories/entities/category.entity';
import { Message } from '@modules/messaging/entities/message.entity';
import { ProductImage } from '@modules/products/entities/product-image.entity';
import { ProductView } from '@modules/products/entities/product-view.entity';
import { Product } from '@modules/products/entities/product.entity';
import { SavedFilter } from '@modules/products/entities/saved-filter.entity';
import { User } from '@modules/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestConfigModule } from './config.module';
import { TestDatabaseModule } from './database.module';
import { TestJwtModule } from './jwt.module';
import { TestStorageModule } from './storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'src/config/test.env',
      isGlobal: true,
    }),
    TestConfigModule,
    TestDatabaseModule,
    TestJwtModule,
    TestStorageModule,
    TypeOrmModule.forFeature([
      User,
      Product,
      Category,
      SavedFilter,
      ProductImage,
      ProductView,
      Message,
    ]),
  ],
  exports: [
    ConfigModule,
    TestConfigModule,
    TestDatabaseModule,
    TestJwtModule,
    TestStorageModule,
    TypeOrmModule,
  ],
})
export class TestModule {
  static forRoot() {
    return {
      module: TestModule,
      imports: [
        ConfigModule.forRoot({
          envFilePath: 'src/config/test.env',
          isGlobal: true,
        }),
        TestConfigModule,
        TestDatabaseModule,
        TestJwtModule,
        TestStorageModule,
        TypeOrmModule.forFeature([
          User,
          Product,
          Category,
          SavedFilter,
          ProductImage,
          ProductView,
          Message,
        ]),
      ],
    };
  }
}

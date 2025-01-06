import { Category } from '@modules/categories/entities/category.entity';
import { Message } from '@modules/messaging/entities/message.entity';
import { ProductImage } from '@modules/products/entities/product-image.entity';
import { ProductView } from '@modules/products/entities/product-view.entity';
import { Product } from '@modules/products/entities/product.entity';
import { SavedFilter } from '@modules/products/entities/saved-filter.entity';
import { User } from '@modules/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestConfigModule } from './config.module';
import { TestDatabaseModule } from './database.module';
import { TestStorageModule } from './storage.module';

export const JWT_CONFIG = {
  secret: 'test-secret',
  expiresIn: '1h',
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'src/config/test.env',
      isGlobal: true,
    }),
    JwtModule.register({
      secret: JWT_CONFIG.secret,
      signOptions: { expiresIn: JWT_CONFIG.expiresIn },
    }),
    TestConfigModule,
    TestDatabaseModule,
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
    JwtModule,
    TestConfigModule,
    TestDatabaseModule,
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
        JwtModule.register({
          secret: JWT_CONFIG.secret,
          signOptions: { expiresIn: JWT_CONFIG.expiresIn },
        }),
        TestConfigModule,
        TestDatabaseModule,
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

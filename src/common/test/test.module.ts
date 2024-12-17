import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testConfig } from '../../config/test.config';
import { EmailModule } from '../../modules/email/email.module';
import { EmailService } from '../../modules/email/services/email.service';
import { User } from '../../modules/users/entities/user.entity';
import { Product } from '../../modules/products/entities/product.entity';
import { Category } from '../../modules/products/entities/category.entity';
import { ProductImage } from '../../modules/products/entities/product-image.entity';
import { SavedFilter } from '../../modules/products/entities/saved-filter.entity';
import { ProductView } from '../../modules/products/entities/product-view.entity';

const TEST_JWT_SECRET = 'test-secret';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/config/test.env',
      load: [() => ({ JWT_SECRET: TEST_JWT_SECRET })],
    }),
    TypeOrmModule.forRoot({
      ...testConfig,
      entities: [
        User,
        Product,
        Category,
        ProductImage,
        SavedFilter,
        ProductView,
      ],
      synchronize: true,
    }),
    JwtModule.registerAsync({
      imports: [],
      useFactory: () => ({
        secret: TEST_JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
    }),
    EmailModule,
  ],
  providers: [
    {
      provide: EmailService,
      useValue: {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      },
    },
  ],
  exports: [JwtModule, EmailModule, ConfigModule, TypeOrmModule],
})
export class TestModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testConfig } from '../../config/test.config';
import { EmailModule } from '../../modules/email/email.module';
import { EmailService } from '../../modules/email/services/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/config/test.env',
    }),
    TypeOrmModule.forRoot(testConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'test-secret',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
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
  exports: [JwtModule, EmailModule],
})
export class TestModule {}

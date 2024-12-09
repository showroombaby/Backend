import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { testConfig } from '../../../config/test.config';
import { EmailModule } from '../../email/email.module';
import { EmailService } from '../../email/services/email.service';
import { User } from '../../users/entities/user.entity';
import { AuthModule } from '../auth.module';

export { TestingModule } from '@nestjs/testing';

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const createTestingModule = async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: 'src/config/test.env',
      }),
      TypeOrmModule.forRoot(testConfig),
      JwtModule.register({
        secret: 'test-secret',
        signOptions: { expiresIn: '1h' },
      }),
      AuthModule,
      EmailModule,
    ],
  })
    .overrideProvider(EmailService)
    .useValue({
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());

  return moduleRef;
};

export const cleanupDatabase = async (app: INestApplication) => {
  try {
    const userRepository = app.get(getRepositoryToken(User));
    await userRepository.query('DELETE FROM users');
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
  }
};

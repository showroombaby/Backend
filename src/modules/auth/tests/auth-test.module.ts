import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { EmailModule } from '../../email/email.module';
import { EmailService } from '../../email/services/email.service';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { UsersModule } from '../../users/users.module';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';

const JWT_SECRET = 'test-secret-key';
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

const mockConfigService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'JWT_SECRET':
        return JWT_SECRET;
      case 'JWT_EXPIRATION_TIME':
        return '24h';
      default:
        return null;
    }
  }),
} as unknown as ConfigService;

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
} as unknown as EmailService;

const mockUsersService = {
  logger: new Logger('UsersService'),
  userRepository: {} as Repository<User>,
  findById: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
  }),
  findByEmail: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
  }),
  create: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
  }),
  updateProfile: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
  }),
  findAll: jest.fn().mockResolvedValue([
    {
      id: TEST_USER_ID,
      email: 'test@example.com',
    },
  ]),
  remove: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
  }),
  changePassword: jest.fn().mockResolvedValue(true),
  verifyEmail: jest.fn().mockResolvedValue(true),
  deleteAccount: jest.fn().mockResolvedValue(true),
} as unknown as UsersService;

const mockJwtService = {
  sign: jest.fn((payload) => {
    return jwt.sign(payload, JWT_SECRET);
  }),
  verify: jest.fn().mockResolvedValue({ sub: TEST_USER_ID }),
  signAsync: jest.fn().mockResolvedValue('test-token'),
  verifyAsync: jest.fn().mockResolvedValue({ sub: TEST_USER_ID }),
  decode: jest.fn().mockReturnValue({ sub: TEST_USER_ID }),
  options: { secret: JWT_SECRET },
  logger: new Logger('JwtService'),
} as unknown as JwtService;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '24h' },
      global: true,
    }),
    UsersModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: UsersService,
      useValue: mockUsersService,
    },
    {
      provide: JwtService,
      useValue: mockJwtService,
    },
    {
      provide: ConfigService,
      useValue: mockConfigService,
    },
    {
      provide: EmailService,
      useValue: mockEmailService,
    },
    JwtStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtService,
    UsersService,
    ConfigService,
    EmailService,
    JwtStrategy,
  ],
})
export class AuthTestModule {}

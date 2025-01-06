import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { MessagingController } from '../controllers/messaging.controller';
import { Message } from '../entities/message.entity';
import { MessagingGateway } from '../gateways/messaging.gateway';
import { MessagingService } from '../services/messaging.service';

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
    TypeOrmModule.forFeature([Message, User, Product, Category]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    MessagingGateway,
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
      provide: WsJwtGuard,
      useFactory: () => new WsJwtGuard(mockJwtService, mockUsersService),
    },
    JwtStrategy,
    {
      provide: JwtAuthGuard,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [MessagingService],
})
export class MessagingTestModule {}

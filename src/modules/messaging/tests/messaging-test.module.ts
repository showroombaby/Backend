import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  findById: jest.fn().mockImplementation(async (id: string) => ({
    id,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isEmailVerified: true,
    rating: 0,
    address: {
      street: '123 Test St',
      zipCode: '75000',
      city: 'Paris',
      additionalInfo: '',
    },
  })),
  findByEmail: jest.fn().mockImplementation(async (email: string) => ({
    id: TEST_USER_ID,
    email,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isEmailVerified: true,
    rating: 0,
    address: {
      street: '123 Test St',
      zipCode: '75000',
      city: 'Paris',
      additionalInfo: '',
    },
  })),
  create: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
    username: 'testuser',
  }),
  updateProfile: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
    username: 'testuser',
  }),
  findAll: jest.fn().mockResolvedValue([
    {
      id: TEST_USER_ID,
      email: 'test@example.com',
      username: 'testuser',
    },
  ]),
  remove: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue({
    id: TEST_USER_ID,
    email: 'test@example.com',
    username: 'testuser',
  }),
  changePassword: jest.fn().mockResolvedValue(true),
  verifyEmail: jest.fn().mockResolvedValue(true),
  deleteAccount: jest.fn().mockResolvedValue(true),
} as unknown as UsersService;

const mockJwtService = {
  sign: jest.fn().mockImplementation(() => {
    return 'test.jwt.token';
  }),
  signAsync: jest.fn().mockImplementation(() => {
    return Promise.resolve('test.jwt.token');
  }),
  verify: jest.fn().mockImplementation(() => ({
    sub: TEST_USER_ID,
    email: 'test@example.com',
  })),
  verifyAsync: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      sub: TEST_USER_ID,
      email: 'test@example.com',
    });
  }),
  decode: jest.fn().mockImplementation(() => ({
    sub: TEST_USER_ID,
    email: 'test@example.com',
  })),
} as unknown as JwtService;

const mockJwtAuthGuard = {
  canActivate: jest.fn().mockImplementation((context) => {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const payload = mockJwtService.verify(token, { secret: JWT_SECRET });
        request.user = { id: payload.sub };
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }),
};

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
      provide: ConfigService,
      useValue: mockConfigService,
    },
    {
      provide: UsersService,
      useValue: mockUsersService,
    },
    {
      provide: JwtService,
      useValue: mockJwtService,
    },
    {
      provide: JwtAuthGuard,
      useValue: mockJwtAuthGuard,
    },
    JwtStrategy,
    WsJwtGuard,
  ],
  exports: [MessagingService],
})
export class MessagingTestModule {}

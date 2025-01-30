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
import * as jwt from 'jsonwebtoken';
import { getRepositoryToken } from '@nestjs/typeorm';

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
  sign: jest.fn().mockImplementation((payload, options) => {
    const secret = options?.secret || JWT_SECRET;
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }),
  signAsync: jest.fn().mockImplementation((payload, options) => {
    const secret = options?.secret || JWT_SECRET;
    return Promise.resolve(jwt.sign(payload, secret, { expiresIn: '24h' }));
  }),
  verify: jest.fn().mockImplementation((token, options) => {
    const secret = options?.secret || JWT_SECRET;
    return jwt.verify(token, secret);
  }),
  verifyAsync: jest.fn().mockImplementation((token, options) => {
    const secret = options?.secret || JWT_SECRET;
    return Promise.resolve(jwt.verify(token, secret));
  }),
  decode: jest.fn().mockImplementation((token) => {
    return jwt.decode(token);
  }),
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
    {
      provide: MessagingService,
      useFactory: (
        messageRepo: Repository<Message>,
        userRepo: Repository<User>,
        productRepo: Repository<Product>,
      ) => {
        return new MessagingService(messageRepo, userRepo, productRepo);
      },
      inject: [
        getRepositoryToken(Message),
        getRepositoryToken(User),
        getRepositoryToken(Product),
      ],
    },
    {
      provide: MessagingGateway,
      useFactory: (messagingService: MessagingService) => {
        const gateway = new MessagingGateway(messagingService);
        return gateway;
      },
      inject: [MessagingService],
    },
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
      useClass: JwtAuthGuard,
    },
    {
      provide: JwtStrategy,
      useFactory: () => {
        return new JwtStrategy(mockConfigService, mockUsersService);
      },
    },
    WsJwtGuard,
  ],
  exports: [MessagingService],
})
export class MessagingTestModule {}

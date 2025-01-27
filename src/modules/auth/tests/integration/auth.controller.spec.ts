import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { EmailService } from '../../../email/services/email.service';
import { User } from '../../../users/entities/user.entity';
import { FileService } from '../../../users/services/file.service';
import { UsersService } from '../../../users/services/users.service';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { JwtStrategy } from '../../strategies/jwt.strategy';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const JWT_SECRET = 'test-secret-key';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let moduleFixture: TestingModule;

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
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  };

  const mockJwtService = {
    sign: jest.fn(() => {
      return 'test-token';
    }),
    verify: jest.fn().mockResolvedValue({ sub: TEST_USER_ID }),
    signAsync: jest.fn().mockResolvedValue('test-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: TEST_USER_ID }),
    decode: jest.fn().mockReturnValue({ sub: TEST_USER_ID }),
  };

  const mockFileService = {
    saveAvatar: jest.fn().mockResolvedValue('avatar.jpg'),
    deleteAvatar: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypeOrmModule.forFeature([User])],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
        {
          provide: UsersService,
          useFactory: (userRepo: Repository<User>) => {
            return new UsersService(userRepo);
          },
          inject: [getRepositoryToken(User)],
        },
        JwtStrategy,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  beforeEach(async () => {
    await userRepository.delete({});
  });

  afterAll(async () => {
    if (moduleFixture) {
      await moduleFixture.close();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      username: 'testuser',
    };

    it('devrait créer un nouvel utilisateur', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'Registration successful',
      );
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', registerDto.email);

      const user = await userRepository.findOne({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user.email).toBe(registerDto.email);
    });

    it("devrait échouer si l'email existe déjà", async () => {
      await userRepository.save({
        id: TEST_USER_ID,
        ...registerDto,
        password: await bcrypt.hash(registerDto.password, 10),
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(async () => {
      await userRepository.save({
        id: TEST_USER_ID,
        ...loginDto,
        username: 'testuser',
        password: await bcrypt.hash(loginDto.password, 10),
      });
    });

    it("devrait connecter l'utilisateur avec succès", async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('access_token');
    });

    it('devrait échouer avec des identifiants invalides', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          ...loginDto,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});

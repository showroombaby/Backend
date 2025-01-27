import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersController } from '../../controllers/users.controller';
import { User } from '../../entities/user.entity';
import { UsersService } from '../../services/users.service';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    rating: 0,
    role: 'user',
    isEmailVerified: false,
    address: {
      street: '123 Test St',
      zipCode: '75000',
      city: 'Paris',
      additionalInfo: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn().mockReturnValue({ sub: mockUser.id }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    controller = moduleFixture.get<UsersController>(UsersController);
    usersService = moduleFixture.get<UsersService>(UsersService);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /users/profile', () => {
    it("devrait retourner le profil de l'utilisateur connecté", async () => {
      const result = await controller.getProfile({ user: mockUser });
      expect(result).toEqual(mockUser);
    });

    it('devrait échouer sans authentification', async () => {
      try {
        await controller.getProfile(undefined);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
      }
    });
  });
});

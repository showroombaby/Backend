import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { JwtStrategy } from '../../../auth/strategies/jwt.strategy';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { UsersService } from '../../../users/services/users.service';
import { CategoriesController } from '../../controllers/categories.controller';
import { Category } from '../../entities/category.entity';
import { CategoriesService } from '../../services/categories.service';

const JWT_SECRET = 'test-secret-key';

describe('CategoriesController (Integration)', () => {
  let app: INestApplication;
  let categoryRepository: Repository<Category>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let adminUser: User;
  let regularUser: User;

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

  const mockJwtService = {
    sign: jest.fn((payload) => {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TypeOrmModule.forFeature([Category, User]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '24h' },
        }),
      ],
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useFactory: (userRepo: Repository<User>) => {
            return new UsersService(userRepo);
          },
          inject: [getRepositoryToken(User)],
        },
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        Reflector,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = moduleFixture.get<Reflector>(Reflector);
    const guard = moduleFixture.get<JwtAuthGuard>(JwtAuthGuard);
    const rolesGuard = new RolesGuard(reflector);

    app.useGlobalGuards(guard, rolesGuard);
    await app.init();

    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Créer les utilisateurs de test
    adminUser = await userRepository.save({
      email: 'admin@example.com',
      password: 'password',
      username: 'admin',
      role: Role.ADMIN,
    });

    regularUser = await userRepository.save({
      email: 'user@example.com',
      password: 'password',
      username: 'user',
      role: Role.USER,
    });
  });

  beforeEach(async () => {
    await categoryRepository.delete({});
  });

  afterAll(async () => {
    await categoryRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('POST /categories', () => {
    it('devrait créer une nouvelle catégorie', async () => {
      const categoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };

      const token = jwtService.sign({
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      });

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: categoryDto.name,
        description: categoryDto.description,
      });
    });

    it('devrait rejeter la création par un utilisateur non-admin', async () => {
      const token = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        role: regularUser.role,
      });

      return request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Category',
          description: 'Test Description',
        })
        .expect(403);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .send({
          name: 'Test Category',
          description: 'Test Description',
        })
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    beforeEach(async () => {
      await categoryRepository.save([
        {
          name: 'Category 1',
          description: 'Description 1',
        },
        {
          name: 'Category 2',
          description: 'Description 2',
        },
      ]);
    });

    it('devrait retourner la liste des catégories', async () => {
      const token = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        role: regularUser.role,
      });

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
    });
  });

  describe('PUT /categories/:id', () => {
    let category: Category;

    beforeEach(async () => {
      category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Description',
      });
    });

    it('devrait mettre à jour une catégorie', async () => {
      const updateDto = {
        name: 'Updated Category',
        description: 'Updated Description',
      };

      const token = jwtService.sign({
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      });

      const response = await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject(updateDto);
    });

    it('devrait rejeter la mise à jour par un utilisateur non-admin', async () => {
      const token = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        role: regularUser.role,
      });

      return request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Category',
          description: 'Updated Description',
        })
        .expect(403);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .send({
          name: 'Updated Category',
          description: 'Updated Description',
        })
        .expect(401);
    });
  });

  describe('DELETE /categories/:id', () => {
    let category: Category;

    beforeEach(async () => {
      category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Description',
      });
    });

    it('devrait supprimer une catégorie', async () => {
      const token = jwtService.sign({
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      });

      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deletedCategory = await categoryRepository.findOne({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });

    it('devrait rejeter la suppression par un utilisateur non-admin', async () => {
      const token = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        role: regularUser.role,
      });

      return request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .expect(401);
    });
  });
});

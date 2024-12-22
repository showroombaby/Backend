import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { CategoriesModule } from '../../categories.module';
import { Category } from '../../entities/category.entity';
import { TestJwtModule } from '@test/test-jwt.module';
import { AuthModule } from '../../../auth/auth.module';
import * as bcrypt from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';

describe('CategoriesController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let category: Category;

  const adminUser = {
    id: '1',
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
  };

  const regularUser = {
    id: '2',
    email: 'user@example.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
    role: Role.USER,
  };

  const testCategory = {
    name: 'Test Category',
    description: 'Test Description',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        TestJwtModule,
        CategoriesModule,
        AuthModule,
        TypeOrmModule.forFeature([User, Category]),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = moduleRef.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    jwtService = moduleRef.get<JwtService>(JwtService);

    await app.init();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await userRepository.query('DELETE FROM users');
    await categoryRepository.query('DELETE FROM categories');

    // Créer l'utilisateur admin avec mot de passe hashé
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);
    const admin = await userRepository.save({
      ...adminUser,
      password: hashedAdminPassword,
    });

    // Créer l'utilisateur régulier avec mot de passe hashé
    const hashedUserPassword = await bcrypt.hash(regularUser.password, 10);
    const user = await userRepository.save({
      ...regularUser,
      password: hashedUserPassword,
    });

    // Créer une catégorie de test
    category = await categoryRepository.save(testCategory);

    // Générer les tokens
    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
    userToken = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM users');
    await categoryRepository.query('DELETE FROM categories');
    if (app) {
      await app.close();
    }
  });

  describe('POST /categories', () => {
    const newCategory = {
      name: 'New Category',
      description: 'New Description',
    };

    it('devrait créer une nouvelle catégorie', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory)
        .expect(201);

      expect(response.body).toMatchObject(newCategory);
    });

    it('devrait rejeter une catégorie avec des données invalides', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          description: 'Invalid Category',
        })
        .expect(400);

      expect(response.body.message).toContain('name should not be empty');
    });

    it('devrait rejeter la création par un utilisateur non-admin', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newCategory)
        .expect(403);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send(newCategory)
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    it('devrait retourner la liste des catégories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject({
        name: testCategory.name,
        description: testCategory.description,
      });
    });
  });

  describe('GET /categories/:id', () => {
    it('devrait retourner une catégorie spécifique', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${category.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        name: testCategory.name,
        description: testCategory.description,
      });
    });

    it('devrait retourner 404 pour une catégorie inexistante', async () => {
      await request(app.getHttpServer()).get('/categories/999').expect(404);
    });
  });

  describe('PUT /categories/:id', () => {
    const updateData = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('devrait mettre à jour une catégorie', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
    });

    it('devrait rejeter la mise à jour avec des données invalides', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          description: 'Invalid Update',
        })
        .expect(400);

      expect(response.body.message).toContain('name should not be empty');
    });

    it('devrait rejeter la mise à jour par un utilisateur non-admin', async () => {
      await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('devrait supprimer une catégorie', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Vérifier que la catégorie a été supprimée
      const deletedCategory = await categoryRepository.findOne({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });

    it('devrait rejeter la suppression par un utilisateur non-admin', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .expect(401);
    });
  });
});

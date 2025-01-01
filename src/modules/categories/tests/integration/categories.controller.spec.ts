import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { TestStorageModule } from '../../../../common/test/storage.module';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { CategoriesModule } from '../../categories.module';
import { Category } from '../../entities/category.entity';

describe('CategoriesController (Integration)', () => {
  let app: INestApplication;
  let categoryRepository: Repository<Category>;
  let userRepository: Repository<User>;
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TestJwtModule,
        TestStorageModule,
        CategoriesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    categoryRepository = moduleFixture.get('CategoryRepository');
    userRepository = moduleFixture.get('UserRepository');
    await app.init();

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

  afterAll(async () => {
    await categoryRepository.query('DELETE FROM categories');
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  describe('POST /categories', () => {
    it('devrait créer une nouvelle catégorie', async () => {
      const categoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${generateTestToken(adminUser)}`)
        .send(categoryDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: categoryDto.name,
        description: categoryDto.description,
      });
    });

    it('devrait rejeter la création par un utilisateur non-admin', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${generateTestToken(regularUser)}`)
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
      const response = await request(app.getHttpServer())
        .get('/categories')
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

      const response = await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${generateTestToken(adminUser)}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject(updateDto);
    });

    it('devrait rejeter la mise à jour par un utilisateur non-admin', () => {
      return request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${generateTestToken(regularUser)}`)
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
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${generateTestToken(adminUser)}`)
        .expect(200);

      const deletedCategory = await categoryRepository.findOne({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });

    it('devrait rejeter la suppression par un utilisateur non-admin', () => {
      return request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${generateTestToken(regularUser)}`)
        .expect(403);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .expect(401);
    });
  });
});

function generateTestToken(user: User): string {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
    }),
  ).toString('base64')}.test-signature`;
}

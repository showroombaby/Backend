import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { CategoriesModule } from '../../categories.module';
import { Category } from '../../entities/category.entity';

describe('CategoriesController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let adminToken: string;
  let userToken: string;

  const adminUser = {
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
  };

  const regularUser = {
    email: 'user@example.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
    role: Role.USER,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule, CategoriesModule],
    }).compile();

    app = moduleRef.createNestApplication();
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = moduleRef.get<Repository<Category>>(
      getRepositoryToken(Category),
    );

    await app.init();

    // Créer l'utilisateur admin
    const admin = userRepository.create(adminUser);
    await userRepository.save(admin);

    // Créer l'utilisateur régulier
    const user = userRepository.create(regularUser);
    await userRepository.save(user);

    // Obtenir les tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });
    adminToken = adminLogin.body.access_token;

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: regularUser.email,
        password: regularUser.password,
      });
    userToken = userLogin.body.access_token;
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await categoryRepository.query('DELETE FROM categories');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /categories', () => {
    const createCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
    };

    it("devrait créer une catégorie en tant qu'admin", async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createCategoryDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createCategoryDto.name,
        description: createCategoryDto.description,
      });
    });

    it('devrait rejeter une catégorie avec des données invalides', async () => {
      const invalidDto = {
        name: '', // nom vide invalide
        description: 'Test Description',
      };

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toContain('name');
    });

    it('devrait rejeter la création par un utilisateur non-admin', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createCategoryDto)
        .expect(403);
    });

    it('devrait rejeter la création sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send(createCategoryDto)
        .expect(401);
    });
  });

  describe('GET /categories', () => {
    it('devrait retourner la liste des catégories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('devrait retourner une catégorie spécifique par ID', async () => {
      // Créer une catégorie
      const category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Description',
      });

      const response = await request(app.getHttpServer())
        .get(`/categories/${category.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: category.id,
        name: category.name,
        description: category.description,
      });
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      await request(app.getHttpServer()).get('/categories/999').expect(404);
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

    it("devrait mettre à jour une catégorie en tant qu'admin", async () => {
      const updateDto = {
        name: 'Updated Category',
        description: 'Updated Description',
      };

      const response = await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject(updateDto);
    });

    it('devrait rejeter la mise à jour sans authentification', async () => {
      await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .send({
          name: 'Updated Category',
        })
        .expect(401);
    });

    it('devrait rejeter la mise à jour par un utilisateur non-admin', async () => {
      await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Category',
        })
        .expect(403);
    });

    it('devrait rejeter la mise à jour avec des données invalides', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // nom vide invalide
        })
        .expect(400);

      expect(response.body.message).toContain('name');
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

    it("devrait supprimer une catégorie en tant qu'admin", async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedCategory = await categoryRepository.findOne({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });

    it('devrait rejeter la suppression sans authentification', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .expect(401);
    });

    it('devrait rejeter la suppression par un utilisateur non-admin', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${category.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      await request(app.getHttpServer())
        .delete('/categories/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

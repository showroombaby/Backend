import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AuthModule } from '../../../auth/auth.module';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../../users.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [User],
            synchronize: true,
            logging: false,
          }),
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  }, 30000);

  beforeEach(async () => {
    await userRepository.clear();

    // Créer l'utilisateur via le endpoint d'enregistrement
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

    expect(registerResponse.status).toBe(201);

    // Récupérer l'utilisateur créé
    testUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
    });

    // Générer un token JWT pour l'utilisateur
    const payload = { sub: testUser.id, email: testUser.email };
    authToken = jwtService.sign(payload);
  });

  describe('/users/profile (GET)', () => {
    it("devrait retourner le profil de l'utilisateur connecté", () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testUser.id);
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.firstName).toBe(testUser.firstName);
          expect(res.body.lastName).toBe(testUser.lastName);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('devrait retourner 401 sans token', () => {
      return request(app.getHttpServer()).get('/users/profile').expect(401);
    });

    it('devrait retourner 401 avec un token invalide', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/users/profile (PUT)', () => {
    it('devrait mettre à jour le profil avec succès', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.email).toBe(testUser.email);

      // Vérifier en base de données
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
    });

    it('devrait échouer avec un email déjà utilisé', async () => {
      // Créer un autre utilisateur
      const otherUser = userRepository.create({
        email: 'other@example.com',
        password: 'password123',
      });
      await otherUser.hashPassword();
      await userRepository.save(otherUser);

      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'other@example.com' })
        .expect(409);
    });

    it('devrait échouer avec des données invalides', () => {
      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'J', // Trop court
          lastName: '123', // Caractères invalides
        })
        .expect(400);
    });

    it('devrait échouer avec un email invalide', () => {
      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });

    it("devrait mettre à jour l'adresse avec succès", async () => {
      const updateData = {
        address: {
          street: '123 rue de Paris',
          zipCode: '75001',
          city: 'Paris',
          additionalInfo: 'Appartement 4B',
        },
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.address).toBeDefined();
      expect(response.body.address.street).toBe(updateData.address.street);
      expect(response.body.address.city).toBe(updateData.address.city);
    });

    it('devrait échouer avec un code postal invalide', async () => {
      const updateData = {
        address: {
          street: '123 rue de Paris',
          zipCode: '7500', // Code postal trop court
          city: 'Paris',
        },
      };

      await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });

    it('devrait échouer avec une ville manquante', async () => {
      const updateData = {
        address: {
          street: '123 rue de Paris',
          zipCode: '75001',
          // city manquante
        },
      };

      await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('/users/profile (DELETE)', () => {
    it('devrait supprimer le compte avec succès', async () => {
      await request(app.getHttpServer())
        .delete('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que l'utilisateur n'existe plus
      const deletedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('devrait retourner 401 sans token', () => {
      return request(app.getHttpServer()).delete('/users/profile').expect(401);
    });
  });

  describe('/users/change-password (POST)', () => {
    it('devrait changer le mot de passe avec succès', async () => {
      const changePasswordDto = {
        currentPassword: 'password123',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordDto)
        .expect(200);

      // Vérifier que le nouveau mot de passe fonctionne
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: changePasswordDto.newPassword,
        });

      expect(loginResponse.status).toBe(201);
      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('devrait échouer avec un mot de passe actuel incorrect', () => {
      return request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('devrait échouer si les nouveaux mots de passe ne correspondent pas', () => {
      return request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
        })
        .expect(401);
    });

    it('devrait échouer avec un nouveau mot de passe invalide', () => {
      return request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400);
    });
  });

  describe('/users/avatar', () => {
    // Créer un petit buffer PNG valide
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    it('devrait uploader un avatar avec succès', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, 'test-image.png')
        .expect(201);

      expect(response.body).toHaveProperty('avatar');
      expect(response.body.avatar).toMatch(/^[a-zA-Z0-9-]+\.png$/);

      // Vérifier que l'utilisateur a été mis à jour
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.avatar).toBe(response.body.avatar);
    });

    it("devrait supprimer l'avatar avec succès", async () => {
      // D'abord uploader un avatar
      await request(app.getHttpServer())
        .post('/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, 'test-image.png');

      // Ensuite le supprimer
      await request(app.getHttpServer())
        .delete('/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que l'avatar a été supprimé
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.avatar).toBeNull();
    });

    it('devrait échouer sans fichier', () => {
      return request(app.getHttpServer())
        .post('/users/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .post('/users/avatar')
        .attach('avatar', testImageBuffer, 'test-image.png')
        .expect(401);
    });
  });

  afterAll(async () => {
    // Nettoyer le dossier d'upload
    const uploadsDir = path.join(process.cwd(), 'uploads/avatars');
    try {
      await fs.rm(uploadsDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Erreur lors du nettoyage du dossier uploads:', error);
    }

    await app.close();
  });
});

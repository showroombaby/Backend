import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import databaseConfig from '../../../../config/database.config';
import { User } from '../../../users/entities/user.entity';
import { UsersModule } from '../../../users/users.module';
import { AuthModule } from '../../auth.module';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../../email/services/email.service';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let emailService: EmailService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
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
    })
      .overrideProvider(EmailService)
      .useValue({
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
    emailService = moduleFixture.get<EmailService>(EmailService);
    await app.init();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('/auth/register (POST)', () => {
    it('should register successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.message).toBe('Registration successful');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(async () => {
      // Créer l'utilisateur de test
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      console.log('Register response:', registerResponse.body);
      expect(registerResponse.status).toBe(201);

      // Vérifier que l'utilisateur est créé avec le bon mot de passe
      const user = await userRepository.findOne({
        where: { email: testUser.email },
        select: ['id', 'email', 'password'],
      });
      console.log('User in DB:', {
        id: user.id,
        email: user.email,
        hashedPassword: user.password,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
    });

    it('should login successfully', async () => {
      // Tentative de connexion
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      console.log('Login attempt with:', {
        email: testUser.email,
        password: testUser.password,
      });

      if (loginResponse.status !== 201) {
        console.log('Login failed. Response:', loginResponse.body);

        // Vérifier l'état de l'utilisateur dans la base
        const userAfterLoginAttempt = await userRepository.findOne({
          where: { email: testUser.email },
          select: ['id', 'email', 'password'],
        });
        console.log('User state after failed login:', userAfterLoginAttempt);
      }

      expect(loginResponse.status).toBe(201);
      expect(loginResponse.body).toHaveProperty('access_token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user.email).toBe(testUser.email);
      expect(loginResponse.body.message).toBe('Login successful');
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/auth/request-password-reset (POST)', () => {
    it('devrait envoyer un email de réinitialisation avec succès', async () => {
      // Créer d'abord un utilisateur
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Le mock du service d'email est déjà configuré dans beforeAll
      const response = await request(app.getHttpServer())
        .post('/auth/request-password-reset')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('devrait retourner 404 pour un email inexistant', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    let resetToken: string;
    let testUser: User;

    beforeEach(async () => {
      testUser = await userRepository.save(
        userRepository.create({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
      resetToken = jwtService.sign({ sub: testUser.id }, { expiresIn: '1h' });
    });

    it('devrait réinitialiser le mot de passe avec succès', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);

      // Vérifier que le mot de passe a été mis à jour
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser).toBeDefined();
    });

    it('devrait échouer avec un token invalide', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('devrait échouer avec un mot de passe invalide', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
        })
        .expect(400);
    });
  });

  afterAll(async () => {
    await userRepository.clear();
    await app.close();
  });
});

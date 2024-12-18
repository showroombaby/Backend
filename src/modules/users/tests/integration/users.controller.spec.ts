import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { AuthModule } from '../../../auth/auth.module';
import { EmailModule } from '../../../email/email.module';
import { EmailService } from '../../../email/services/email.service';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../../users.module';
import { TestJwtModule } from '@test/test-jwt.module';
import { Role } from '../../enums/role.enum';
import * as bcrypt from 'bcrypt';
import { ValidationPipe } from '@nestjs/common';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let authToken: string;
  let user: User;

  const userFixture = {
    id: '1',
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        TestJwtModule,
        AuthModule,
        EmailModule,
        UsersModule,
        TypeOrmModule.forFeature([User]),
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await userRepository.query('DELETE FROM users');

    // Créer l'utilisateur de test avec mot de passe hashé
    const hashedPassword = await bcrypt.hash(userFixture.password, 10);
    user = userRepository.create({
      ...userFixture,
      password: hashedPassword,
    });
    await userRepository.save(user);

    // Générer le token
    authToken = jwtService.sign({
      sub: userFixture.id,
      email: userFixture.email,
      role: userFixture.role,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /users/profile', () => {
    it("devrait retourner le profil de l'utilisateur connecté", async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: userFixture.email,
        firstName: userFixture.firstName,
        lastName: userFixture.lastName,
      });
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer()).get('/users/profile').expect(401);
    });
  });

  describe('PUT /users/profile', () => {
    const updateProfileDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('devrait mettre à jour le profil utilisateur', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateProfileDto)
        .expect(200);

      expect(response.body).toMatchObject(updateProfileDto);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .send(updateProfileDto)
        .expect(401);
    });
  });

  describe('POST /users/change-password', () => {
    const changePasswordDto = {
      currentPassword: userFixture.password,
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    };

    it('devrait changer le mot de passe avec succès', async () => {
      // Créer l'utilisateur et générer le token
      const hashedPassword = await bcrypt.hash(userFixture.password, 10);
      user = await userRepository.save({
        ...userFixture,
        password: hashedPassword,
      });

      // Générer un nouveau token avec le bon format
      authToken = jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: userFixture.password,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(201);
    });

    it('devrait échouer avec un mot de passe actuel incorrect', async () => {
      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(400);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/users/change-password')
        .send(changePasswordDto)
        .expect(401);
    });
  });

  describe('DELETE /users/account', () => {
    it('devrait supprimer le compte utilisateur', async () => {
      await request(app.getHttpServer())
        .delete('/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que le compte a été supprimé
      const deletedUser = await userRepository.findOne({
        where: { email: userFixture.email },
      });
      expect(deletedUser).toBeNull();
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer()).delete('/users/account').expect(401);
    });
  });
});

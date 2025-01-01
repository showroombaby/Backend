import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { User } from '../../../users/entities/user.entity';
import { AuthModule } from '../../auth.module';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TestJwtModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get('UserRepository');
    await app.init();
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM users');
    await app.close();
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

      expect(response.body).toHaveProperty('accessToken');

      const user = await userRepository.findOne({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user.email).toBe(registerDto.email);
    });

    it("devrait échouer si l'email existe déjà", async () => {
      await userRepository.save({
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

      expect(response.body).toHaveProperty('accessToken');
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

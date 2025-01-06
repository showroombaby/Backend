import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Category } from '../../../categories/entities/category.entity';
import { Product } from '../../../products/entities/product.entity';
import { ProductCondition } from '../../../products/enums/product-condition.enum';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { MessagingTestModule } from '../messaging-test.module';

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('MessagingController (Integration)', () => {
  let app: INestApplication;
  let messageRepository: Repository<Message>;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let jwtService: JwtService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestDatabaseModule, MessagingTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(new JwtAuthGuard());
    await app.init();

    messageRepository = moduleFixture.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  beforeEach(async () => {
    await messageRepository.delete({});
    await userRepository.delete({});
    await productRepository.delete({});
    await categoryRepository.delete({});
  });

  afterAll(async () => {
    if (moduleFixture) {
      await moduleFixture.close();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /messages', () => {
    it('should create a new message', async () => {
      const user = await userRepository.save({
        id: TEST_USER_ID,
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      });

      const category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Category Description',
      });

      const product = await productRepository.save({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        sellerId: user.id,
        categoryId: category.id,
        condition: ProductCondition.NEW,
      });

      const token = jwtService.sign({ sub: user.id });

      const createMessageDto = {
        recipientId: user.id,
        content: 'Test message',
        productId: product.id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${token}`)
        .send(createMessageDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(createMessageDto.content);
      expect(response.body.recipientId).toBe(createMessageDto.recipientId);
      expect(response.body.productId).toBe(createMessageDto.productId);
    });
  });
});

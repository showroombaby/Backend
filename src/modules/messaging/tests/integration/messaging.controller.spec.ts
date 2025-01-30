import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DeepPartial, Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { Category } from '../../../categories/entities/category.entity';
import { Product } from '../../../products/entities/product.entity';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { MessagingTestModule } from '../messaging-test.module';

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

    // Configuration du JwtService avec une clé secrète pour les tests
    const jwtConfig = moduleFixture.get<JwtService>(JwtService);
    Object.defineProperty(jwtConfig, 'secretKey', { value: 'test-secret-key' });
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
      const category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Category Description',
      } as DeepPartial<Category>);

      const sender = await userRepository.save({
        email: 'sender@example.com',
        password: 'password',
        username: 'sender',
        firstName: 'Test',
        lastName: 'Sender',
        role: 'user',
        isEmailVerified: false,
        rating: 0,
        address: {
          street: '123 Test St',
          zipCode: '75000',
          city: 'Paris',
          additionalInfo: '',
        },
      } as DeepPartial<User>);

      const recipient = await userRepository.save({
        email: 'recipient@example.com',
        password: 'password',
        username: 'recipient',
        firstName: 'Test',
        lastName: 'Recipient',
        role: 'user',
        isEmailVerified: false,
        rating: 0,
        address: {
          street: '456 Test St',
          zipCode: '75000',
          city: 'Paris',
          additionalInfo: '',
        },
      } as DeepPartial<User>);

      const product = await productRepository.save({
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        condition: 'new',
        status: 'draft',
        seller: sender,
        category: category,
        viewCount: 0,
        views: [],
      } as DeepPartial<Product>);

      // Vérifions que le produit est bien créé avec ses relations
      const savedProduct = await productRepository.findOne({
        where: { id: product.id },
        relations: ['seller', 'category'],
      });

      expect(savedProduct).toBeDefined();
      expect(savedProduct.seller.id).toBe(sender.id);
      expect(savedProduct.category.id).toBe(category.id);

      const token = jwtService.sign(
        { sub: sender.id, email: sender.email },
        { secret: 'test-secret-key' },
      );

      const createMessageDto = {
        recipientId: recipient.id,
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

      const savedMessage = await messageRepository.findOne({
        where: { id: response.body.id },
        relations: ['sender', 'recipient', 'product'],
      });
      expect(savedMessage).toBeDefined();
      expect(savedMessage.senderId).toBe(sender.id);
      expect(savedMessage.recipientId).toBe(recipient.id);
      expect(savedMessage.productId).toBe(product.id);
    });
  });
});

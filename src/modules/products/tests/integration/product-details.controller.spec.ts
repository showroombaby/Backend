import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { ProductsService } from '../../services/products.service';
import { ProductsController } from '../../controllers/products.controller';
import { CategoriesService } from '../../../categories/services/categories.service';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductFavoritesService } from '../../services/product-favorites.service';

describe('Product Details (e2e)', () => {
  let app: INestApplication;
  let productsService: ProductsService;

  const mockProduct = {
    id: '123',
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    condition: 'new',
    status: 'published',
    images: [{ url: 'test-image.jpg' }],
    seller: {
      id: 'seller123',
      username: 'Test Seller',
      avatarUrl: 'avatar.jpg',
      name: 'Test Seller',
      email: 'seller@example.com',
      rating: 4.5,
      products: [],
      createdAt: new Date(),
    },
    category: {
      id: 'cat123',
      name: 'Test Category',
    },
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSimilarProducts = [
    {
      id: '456',
      title: 'Similar Product',
      price: 89.99,
      images: [{ url: 'similar-image.jpg' }],
      seller: {
        id: 'seller456',
        username: 'Another Seller',
        avatarUrl: 'another-avatar.jpg',
        name: 'Another Seller',
        email: 'another@example.com',
        rating: 4.0,
      },
    },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn().mockImplementation((options) => {
              if (options.where.id === 'nonexistent') {
                return null;
              }
              return mockProduct;
            }),
            save: jest.fn().mockResolvedValue({ ...mockProduct, viewCount: 1 }),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockSimilarProducts),
            })),
          },
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: {},
        },
        {
          provide: CategoriesService,
          useValue: {},
        },
        {
          provide: ProductImagesService,
          useValue: {},
        },
        {
          provide: ProductFavoritesService,
          useValue: {
            isFavorite: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    productsService = moduleFixture.get<ProductsService>(ProductsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /products/:id', () => {
    it('should return detailed product information', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/123')
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockProduct.id,
        title: mockProduct.title,
        description: mockProduct.description,
        price: mockProduct.price,
        condition: mockProduct.condition,
        status: mockProduct.status,
        images: mockProduct.images.map(img => img.url),
        seller: {
          id: mockProduct.seller.id,
          username: mockProduct.seller.username,
          avatarUrl: mockProduct.seller.avatarUrl,
          name: mockProduct.seller.name,
          email: mockProduct.seller.email,
          rating: mockProduct.seller.rating,
        },
        category: {
          id: mockProduct.category.id,
          name: mockProduct.category.name,
        },
        isFavorite: false,
      });
    });

    it('should increment view count when viewing product details', async () => {
      const initialViewCount = mockProduct.viewCount;
      const response = await request(app.getHttpServer())
        .get('/products/123')
        .expect(200);

      expect(response.body.viewCount).toBe(initialViewCount + 1);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/products/nonexistent')
        .expect(404);
    });
  });

  describe('GET /products/:id/similar', () => {
    it('should return similar products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/123/similar')
        .expect(200);

      expect(response.body).toHaveLength(mockSimilarProducts.length);
      expect(response.body[0]).toMatchObject({
        id: mockSimilarProducts[0].id,
        title: mockSimilarProducts[0].title,
        price: mockSimilarProducts[0].price,
        images: mockSimilarProducts[0].images,
      });
    });
  });
}); 
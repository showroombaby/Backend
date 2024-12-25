import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductFavorite } from '../../entities/product-favorite.entity';
import { Product } from '../../entities/product.entity';
import { FavoritesController } from '../../controllers/favorites.controller';
import { ProductFavoritesService } from '../../services/product-favorites.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

describe('Favorites (e2e)', () => {
  let app: INestApplication;
  let favoritesService: ProductFavoritesService;

  const mockUserId = 'user123';
  const mockProductId = 'product123';

  const mockFavorite = {
    id: 'fav123',
    userId: mockUserId,
    productId: mockProductId,
    createdAt: new Date(),
    product: {
      id: mockProductId,
      title: 'Test Product',
      price: 99.99,
      images: [{ url: 'test-image.jpg' }],
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        ProductFavoritesService,
        {
          provide: getRepositoryToken(ProductFavorite),
          useValue: {
            create: jest.fn().mockReturnValue(mockFavorite),
            save: jest.fn().mockResolvedValue(mockFavorite),
            findOne: jest.fn().mockResolvedValue(mockFavorite),
            find: jest.fn().mockResolvedValue([mockFavorite]),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockFavorite.product),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    favoritesService = moduleFixture.get<ProductFavoritesService>(ProductFavoritesService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /favorites/:productId', () => {
    it('should add product to favorites', async () => {
      await request(app.getHttpServer())
        .post(`/favorites/${mockProductId}`)
        .set('user-id', mockUserId)
        .expect(201);
    });

    it('should return 404 when product does not exist', async () => {
      jest.spyOn(favoritesService, 'addToFavorites').mockRejectedValue(new NotFoundException('Product not found'));

      await request(app.getHttpServer())
        .post('/favorites/nonexistent')
        .set('user-id', mockUserId)
        .expect(404);
    });
  });

  describe('DELETE /favorites/:productId', () => {
    it('should remove product from favorites', async () => {
      await request(app.getHttpServer())
        .delete(`/favorites/${mockProductId}`)
        .set('user-id', mockUserId)
        .expect(200);
    });

    it('should return 404 when favorite does not exist', async () => {
      jest.spyOn(favoritesService, 'removeFromFavorites').mockRejectedValue(new NotFoundException('Favorite not found'));

      await request(app.getHttpServer())
        .delete('/favorites/nonexistent')
        .set('user-id', mockUserId)
        .expect(404);
    });
  });

  describe('GET /favorites', () => {
    it('should return user favorites', async () => {
      const response = await request(app.getHttpServer())
        .get('/favorites')
        .set('user-id', mockUserId)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: mockFavorite.id,
        product: {
          id: mockFavorite.product.id,
          title: mockFavorite.product.title,
          price: mockFavorite.product.price,
          images: mockFavorite.product.images,
        },
      });
    });
  });
}); 
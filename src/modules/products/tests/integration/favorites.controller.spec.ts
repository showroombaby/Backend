import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ConflictException } from '@nestjs/common';
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
  let favoriteRepository;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProductId = '123e4567-e89b-12d3-a456-426614174001';
  const mockFavoriteId = '123e4567-e89b-12d3-a456-426614174002';
  const nonexistentId = '123e4567-e89b-12d3-a456-426614174999';

  const mockFavorite = {
    id: mockFavoriteId,
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
            findOne: jest.fn().mockImplementation(({ where }) => {
              // Pour le test d'ajout, simuler que le favori n'existe pas encore
              if (where.userId === mockUserId && where.productId === mockProductId && !where.id) {
                return Promise.resolve(null);
              }
              return Promise.resolve(mockFavorite);
            }),
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
    favoriteRepository = moduleFixture.get(getRepositoryToken(ProductFavorite));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /favorites/:productId', () => {
    it('should add product to favorites', async () => {
      // S'assurer que findOne retourne null pour simuler que le favori n'existe pas
      favoriteRepository.findOne.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post(`/favorites/${mockProductId}`)
        .set('user-id', mockUserId)
        .expect(201);
    });

    it('should return 404 when product does not exist', async () => {
      jest.spyOn(favoritesService, 'addToFavorites').mockRejectedValue(new NotFoundException('Product not found'));

      await request(app.getHttpServer())
        .post(`/favorites/${nonexistentId}`)
        .set('user-id', mockUserId)
        .expect(404);
    });

    it('should return 409 when product is already in favorites', async () => {
      // S'assurer que findOne retourne un favori existant
      favoriteRepository.findOne.mockResolvedValueOnce(mockFavorite);

      await request(app.getHttpServer())
        .post(`/favorites/${mockProductId}`)
        .set('user-id', mockUserId)
        .expect(409);
    });
  });

  describe('DELETE /favorites/:productId', () => {
    it('should remove product from favorites', async () => {
      favoriteRepository.findOne.mockResolvedValueOnce(mockFavorite);

      await request(app.getHttpServer())
        .delete(`/favorites/${mockProductId}`)
        .set('user-id', mockUserId)
        .expect(204);
    });

    it('should return 404 when favorite does not exist', async () => {
      favoriteRepository.findOne.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .delete(`/favorites/${nonexistentId}`)
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
        userId: mockFavorite.userId,
        productId: mockFavorite.productId,
        product: {
          id: mockFavorite.product.id,
          title: mockFavorite.product.title,
          price: mockFavorite.product.price,
          images: mockFavorite.product.images,
        },
      });
    });
  });

  describe('GET /favorites/:id', () => {
    it('should return a specific favorite', async () => {
      const response = await request(app.getHttpServer())
        .get(`/favorites/${mockFavoriteId}`)
        .set('user-id', mockUserId)
        .expect(200);

      expect(response.body).toMatchObject({
        id: mockFavorite.id,
        userId: mockFavorite.userId,
        productId: mockFavorite.productId,
        product: {
          id: mockFavorite.product.id,
          title: mockFavorite.product.title,
          price: mockFavorite.product.price,
          images: mockFavorite.product.images,
        },
      });
    });

    it('should return 404 when favorite does not exist', async () => {
      favoriteRepository.findOne.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get(`/favorites/${nonexistentId}`)
        .set('user-id', mockUserId)
        .expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/favorites/invalid-uuid')
        .set('user-id', mockUserId)
        .expect(400);
    });
  });
}); 
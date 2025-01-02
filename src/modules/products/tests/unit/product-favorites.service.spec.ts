import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductFavoritesService } from '../../services/product-favorites.service';
import { ProductFavorite } from '../../entities/product-favorite.entity';
import { Product } from '../../entities/product.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ProductFavoritesService', () => {
  let service: ProductFavoritesService;
  let favoriteRepository: Repository<ProductFavorite>;
  let productRepository: Repository<Product>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProductId = '123e4567-e89b-12d3-a456-426614174001';
  const mockFavoriteId = '123e4567-e89b-12d3-a456-426614174002';

  const mockProduct = {
    id: mockProductId,
    title: 'Test Product',
    price: 99.99,
    images: [{ url: 'test-image.jpg' }],
  };

  const mockFavorite = {
    id: mockFavoriteId,
    userId: mockUserId,
    productId: mockProductId,
    createdAt: new Date(),
    product: mockProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            findOne: jest.fn().mockResolvedValue(mockProduct),
          },
        },
      ],
    }).compile();

    service = module.get<ProductFavoritesService>(ProductFavoritesService);
    favoriteRepository = module.get<Repository<ProductFavorite>>(
      getRepositoryToken(ProductFavorite),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  describe('addToFavorites', () => {
    it('should add a product to favorites', async () => {
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValueOnce(null);
      
      await service.addToFavorites(mockUserId, mockProductId);

      expect(favoriteRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        productId: mockProductId,
      });
      expect(favoriteRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.addToFavorites(mockUserId, mockProductId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when favorite already exists', async () => {
      await expect(service.addToFavorites(mockUserId, mockProductId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove a product from favorites', async () => {
      await service.removeFromFavorites(mockUserId, mockProductId);

      expect(favoriteRepository.remove).toHaveBeenCalledWith(mockFavorite);
    });

    it('should throw NotFoundException when favorite does not exist', async () => {
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.removeFromFavorites(mockUserId, mockProductId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isFavorite', () => {
    it('should return true when product is in favorites', async () => {
      const result = await service.isFavorite(mockUserId, mockProductId);

      expect(result).toBe(true);
    });

    it('should return false when product is not in favorites', async () => {
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValueOnce(null);

      const result = await service.isFavorite(mockUserId, mockProductId);

      expect(result).toBe(false);
    });
  });

  describe('getFavorite', () => {
    it('should return a specific favorite', async () => {
      const result = await service.getFavorite(mockFavoriteId, mockUserId);

      expect(result).toEqual({
        id: mockFavorite.id,
        userId: mockFavorite.userId,
        productId: mockFavorite.productId,
        createdAt: mockFavorite.createdAt,
        product: {
          id: mockProduct.id,
          title: mockProduct.title,
          price: mockProduct.price,
          images: mockProduct.images,
        },
      });
    });

    it('should return null when favorite does not exist', async () => {
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValueOnce(null);

      const result = await service.getFavorite(mockFavoriteId, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getUserFavorites', () => {
    it('should return all favorites for a user', async () => {
      const result = await service.getUserFavorites(mockUserId);

      expect(result).toEqual([
        {
          id: mockFavorite.id,
          userId: mockFavorite.userId,
          productId: mockFavorite.productId,
          createdAt: mockFavorite.createdAt,
          product: {
            id: mockProduct.id,
            title: mockProduct.title,
            price: mockProduct.price,
            images: mockProduct.images,
          },
        },
      ]);
    });

    it('should return empty array when user has no favorites', async () => {
      jest.spyOn(favoriteRepository, 'find').mockResolvedValueOnce([]);

      const result = await service.getUserFavorites(mockUserId);

      expect(result).toEqual([]);
    });
  });
}); 
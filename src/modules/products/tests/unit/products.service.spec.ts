import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { ProductSortBy } from '../../dto/search-products.dto';
import { Category } from '../../entities/category.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductsService } from '../../services/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let productImagesService: ProductImagesService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
  } as User;

  const mockCategory: Category = {
    id: '1',
    name: 'Poussettes',
  } as Category;

  const mockProduct: Product = {
    id: '1',
    title: 'Poussette Yoyo',
    description: 'Poussette en excellent état',
    price: 299.99,
    status: ProductStatus.PUBLISHED,
    seller: mockUser,
    category: mockCategory,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((product) =>
              Promise.resolve({
                id: '1',
                ...product,
              }),
            ),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOneOrFail: jest.fn().mockResolvedValue(mockCategory),
          },
        },
        {
          provide: ProductImagesService,
          useValue: {
            uploadImages: jest
              .fn()
              .mockResolvedValue([
                'http://example.com/image1.jpg',
                'http://example.com/image2.jpg',
              ]),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    productImagesService =
      module.get<ProductImagesService>(ProductImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with images successfully', async () => {
      const createProductDto = {
        title: 'Poussette Yoyo',
        description: 'Poussette en excellent état',
        price: 299.99,
        categoryId: '1',
      };

      const mockFiles = [
        { buffer: Buffer.from('fake-image-1') },
        { buffer: Buffer.from('fake-image-2') },
      ] as Express.Multer.File[];

      const result = await service.create(
        createProductDto,
        mockFiles,
        mockUser,
      );

      expect(categoryRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: createProductDto.categoryId },
      });

      expect(productImagesService.uploadImages).toHaveBeenCalledWith(mockFiles);

      expect(productRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        seller: mockUser,
        category: mockCategory,
        images: expect.arrayContaining([
          expect.objectContaining({
            url: expect.any(String),
            filename: expect.any(String),
          }),
        ]),
      });

      expect(result).toMatchObject({
        id: expect.any(String),
        title: createProductDto.title,
        description: createProductDto.description,
        price: createProductDto.price,
      });
    });

    it('should throw an error if category is not found', async () => {
      const createProductDto = {
        title: 'Poussette Yoyo',
        description: 'Poussette en excellent état',
        price: 299.99,
        categoryId: 'invalid-id',
      };

      jest
        .spyOn(categoryRepository, 'findOneOrFail')
        .mockRejectedValue(new Error());

      await expect(
        service.create(createProductDto, [], mockUser),
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should search products with filters', async () => {
      const searchDto = {
        search: 'poussette',
        categoryId: '1',
        minPrice: 100,
        maxPrice: 500,
        sortBy: ProductSortBy.PRICE_DESC,
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(searchDto);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.status = :status',
        { status: ProductStatus.PUBLISHED },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.title ILIKE :search OR product.description ILIKE :search)',
        { search: '%poussette%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: '1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price >= :minPrice',
        { minPrice: 100 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price <= :maxPrice',
        { maxPrice: 500 },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.price',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        items: [mockProduct],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      });
    });

    it('should return empty results when no products match', async () => {
      const searchDto = {
        search: 'nonexistent',
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest
        .spyOn(productRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(searchDto);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      });
    });
  });
});

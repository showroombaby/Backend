import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../users/entities/user.entity';
import { SavedFiltersController } from '../../controllers/saved-filters.controller';
import { CreateSavedFilterDto } from '../../dto/create-saved-filter.dto';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { SavedFiltersService } from '../../services/saved-filters.service';

describe('SavedFiltersController (Integration)', () => {
  let app: INestApplication;
  let controller: SavedFiltersController;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
  } as User;

  const mockSavedFilter = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Filter',
    filters: {
      minPrice: 100,
      maxPrice: 1000,
      categoryId: '123e4567-e89b-12d3-a456-426614174002',
      condition: ProductCondition.NEW,
    },
    userId: mockUser.id,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SavedFiltersController],
      providers: [
        {
          provide: SavedFiltersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockSavedFilter),
            findAll: jest.fn().mockResolvedValue([mockSavedFilter]),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(SavedFilter),
          useValue: {
            find: jest.fn().mockResolvedValue([mockSavedFilter]),
            findOne: jest.fn().mockResolvedValue(mockSavedFilter),
            create: jest.fn().mockReturnValue(mockSavedFilter),
            save: jest.fn().mockResolvedValue(mockSavedFilter),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn().mockReturnValue({ sub: mockUser.id }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    controller = moduleFixture.get<SavedFiltersController>(
      SavedFiltersController,
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('devrait créer un nouveau filtre sauvegardé', async () => {
    const createFilterDto: CreateSavedFilterDto = {
      name: 'Test Filter',
      filters: {
        minPrice: 100,
        maxPrice: 1000,
        categoryId: '123e4567-e89b-12d3-a456-426614174002',
        condition: ProductCondition.NEW,
      },
    };

    const result = await controller.create(createFilterDto, mockUser);
    expect(result).toEqual(mockSavedFilter);
  });

  it("devrait retourner les filtres sauvegardés de l'utilisateur", async () => {
    const result = await controller.findAll(mockUser);
    expect(result).toEqual([mockSavedFilter]);
  });

  it('devrait supprimer un filtre sauvegardé', async () => {
    const result = await controller.remove(mockSavedFilter.id, mockUser);
    expect(result).toBeUndefined();
  });

  it('devrait échouer sans authentification', async () => {
    const createFilterDto: CreateSavedFilterDto = {
      name: 'Test Filter',
      filters: {
        minPrice: 100,
        maxPrice: 1000,
        categoryId: '123e4567-e89b-12d3-a456-426614174002',
        condition: ProductCondition.NEW,
      },
    };

    try {
      await controller.create(createFilterDto, null);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
    }
  });
});

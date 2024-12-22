import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../users/enums/role.enum';
import { CreateSavedFilterDto } from '../../dto/create-saved-filter.dto';
import { UpdateSavedFilterDto } from '../../dto/update-saved-filter.dto';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { SavedFiltersService } from '../../services/saved-filters.service';

describe('SavedFiltersService', () => {
  let service: SavedFiltersService;
  let repository: Repository<SavedFilter>;

  // Fixtures
  const userFixture = {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    password: 'hashedPassword123!',
    avatar: null,
    isEmailVerified: false,
    address: null,
    products: [],
    views: [],
    savedFilters: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
  };

  const savedFilterFixture: SavedFilter = {
    id: '1',
    name: 'Test Filter',
    filters: {
      minPrice: 50,
      maxPrice: 150,
      condition: ProductCondition.LIKE_NEW,
      categoryId: '1',
    },
    user: userFixture,
    userId: userFixture.id,
  };

  // Mock Repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedFiltersService,
        {
          provide: getRepositoryToken(SavedFilter),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SavedFiltersService>(SavedFiltersService);
    repository = module.get<Repository<SavedFilter>>(
      getRepositoryToken(SavedFilter),
    );
  });

  describe('create', () => {
    const createDto: CreateSavedFilterDto = {
      name: 'Test Filter',
      filters: {
        minPrice: 50,
        maxPrice: 150,
        condition: ProductCondition.LIKE_NEW,
        categoryId: '1',
      },
    };

    it('devrait créer un nouveau filtre sauvegardé avec succès', async () => {
      // Arrange
      mockRepository.create.mockReturnValue(savedFilterFixture);
      mockRepository.save.mockResolvedValue(savedFilterFixture);

      // Act
      const result = await service.create({
        ...createDto,
        userId: userFixture.id,
      });

      // Assert
      expect(result).toEqual(savedFilterFixture);
      expect(repository.create).toHaveBeenCalledWith({
        name: createDto.name,
        filters: createDto.filters,
        userId: userFixture.id,
      });
      expect(repository.save).toHaveBeenCalledWith(savedFilterFixture);
    });

    it('devrait gérer les erreurs de base de données lors de la création', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockRepository.save.mockRejectedValue(dbError);
      mockRepository.create.mockReturnValue(savedFilterFixture);

      // Act & Assert
      await expect(
        service.create({
          name: createDto.name,
          filters: createDto.filters,
          userId: userFixture.id,
        }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('findAll', () => {
    it("devrait retourner tous les filtres sauvegardés d'un utilisateur", async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([savedFilterFixture]);

      // Act
      const result = await service.findAll(userFixture.id);

      // Assert
      expect(result).toEqual([savedFilterFixture]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: userFixture.id },
      });
    });

    it("devrait retourner un tableau vide si aucun filtre n'existe", async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll(userFixture.id);

      // Assert
      expect(result).toEqual([]);
    });

    it('devrait gérer les erreurs de base de données', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockRepository.find.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findAll(userFixture.id)).rejects.toThrow(dbError);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un filtre sauvegardé par ID', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(savedFilterFixture);

      // Act
      const result = await service.findOne('1', userFixture.id);

      // Assert
      expect(result).toEqual(savedFilterFixture);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: userFixture.id },
      });
    });

    it("devrait lever une NotFoundException si le filtre n'existe pas", async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('999', userFixture.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateSavedFilterDto = {
      name: 'Updated Filter',
      filters: {
        minPrice: 100,
        maxPrice: 200,
        condition: ProductCondition.LIKE_NEW,
        categoryId: '2',
      },
    };

    it('devrait mettre à jour un filtre sauvegardé existant', async () => {
      // Arrange
      const updatedFilter = { ...savedFilterFixture, ...updateDto };
      mockRepository.findOne.mockResolvedValue(savedFilterFixture);
      mockRepository.save.mockResolvedValue(updatedFilter);

      // Act
      const result = await service.update('1', updateDto, userFixture.id);

      // Assert
      expect(result).toEqual(updatedFilter);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: userFixture.id },
      });
      expect(repository.save).toHaveBeenCalledWith({
        ...savedFilterFixture,
        ...updateDto,
      });
    });

    it("devrait lever une NotFoundException si le filtre n'existe pas", async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('999', updateDto, userFixture.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait gérer les erreurs de base de données lors de la mise à jour', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockRepository.findOne.mockResolvedValue(savedFilterFixture);
      mockRepository.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.update('1', updateDto, userFixture.id),
      ).rejects.toThrow(dbError);
    });
  });

  describe('remove', () => {
    it('devrait supprimer un filtre sauvegardé existant', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(savedFilterFixture);
      mockRepository.remove.mockResolvedValue(savedFilterFixture);

      // Act
      await service.remove('1', userFixture.id);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: userFixture.id },
      });
      expect(repository.remove).toHaveBeenCalledWith(savedFilterFixture);
    });

    it("devrait lever une NotFoundException si le filtre n'existe pas", async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('999', userFixture.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait gérer les erreurs de base de données lors de la suppression', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockRepository.findOne.mockResolvedValue(savedFilterFixture);
      mockRepository.remove.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.remove('1', userFixture.id)).rejects.toThrow(
        dbError,
      );
    });
  });
});

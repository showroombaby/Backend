import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CategoriesService } from '../../services/categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const nonExistentUUID = '123e4567-e89b-12d3-a456-426614174999';

  const mockCategory: Partial<Category> = {
    id: validUUID,
    name: 'Test Category',
    description: 'Test Description',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  describe('create', () => {
    const createCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
    };

    it('devrait créer une nouvelle catégorie', async () => {
      mockRepository.create.mockReturnValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto);

      expect(result).toEqual(mockCategory);
      expect(repository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les catégories', async () => {
      mockRepository.find.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result).toEqual([mockCategory]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devrait retourner une catégorie par son ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(validUUID);

      expect(result).toEqual(mockCategory);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: validUUID },
      });
    });

    it("devrait lever une exception si la catégorie n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(nonExistentUUID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateCategoryDto = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('devrait mettre à jour une catégorie', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue({
        ...mockCategory,
        ...updateCategoryDto,
      });

      const result = await service.update(validUUID, updateCategoryDto);

      expect(result).toEqual({
        ...mockCategory,
        ...updateCategoryDto,
      });
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: validUUID },
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it("devrait lever une exception si la catégorie n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(nonExistentUUID, updateCategoryDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une catégorie', async () => {
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(validUUID);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: validUUID },
      });
      expect(repository.delete).toHaveBeenCalledWith(validUUID);
    });

    it("devrait lever une exception si la catégorie n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(nonExistentUUID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

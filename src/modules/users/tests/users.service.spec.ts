import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../enums/role.enum';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: Partial<User> = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    avatar: null,
    isEmailVerified: false,
    address: null,
    products: [],
    views: [],
    savedFilters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findById', () => {
    it('devrait retourner un utilisateur par son ID', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('devrait lever une NotFoundException si aucun utilisateur trouvé', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    };

    it('devrait changer le mot de passe avec succès', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(true),
      });
      mockRepository.save.mockResolvedValue(mockUser);

      // Act
      await service.changePassword('1', changePasswordDto);

      // Assert
      expect(repository.save).toHaveBeenCalled();
    });

    it('devrait lever une BadRequestException si le mot de passe actuel est incorrect', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(false),
      });

      // Act & Assert
      await expect(
        service.changePassword('1', {
          ...changePasswordDto,
          currentPassword: 'wrongPassword',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait lever une NotFoundException si l'utilisateur n'existe pas", async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changePassword('999', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

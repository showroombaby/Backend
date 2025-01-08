import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('devrait changer le mot de passe avec succès', async () => {
      // Arrange
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedOldPassword',
      };

      mockRepository.findOne.mockResolvedValue(mockUserWithPassword);
      mockRepository.save.mockImplementation((user) => Promise.resolve(user));

      // Mock bcrypt
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedNewPassword'));

      // Act
      await service.changePassword('1', changePasswordDto);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: ['id', 'password'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        'hashedOldPassword',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        10,
      );
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockUserWithPassword,
        password: 'hashedNewPassword',
      });
    });

    it('devrait lever une BadRequestException si le mot de passe actuel est incorrect', async () => {
      // Arrange
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedOldPassword',
      };
      mockRepository.findOne.mockResolvedValue(mockUserWithPassword);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(
        service.changePassword('1', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        'hashedOldPassword',
      );
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

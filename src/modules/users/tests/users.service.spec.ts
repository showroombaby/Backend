import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('devrait retourner un utilisateur par son ID', async () => {
      const mockUser = new User();
      mockUser.id = '123';
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('123');
      expect(result).toBe(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it("devrait lever une exception si l'utilisateur n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('devrait retourner un utilisateur par son email', async () => {
      const mockUser = new User();
      mockUser.email = 'test@example.com';
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result).toBe(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it("devrait retourner null si l'email n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('devrait mettre à jour le profil avec succès', async () => {
      const mockUser = new User();
      mockUser.id = '123';
      mockUser.email = 'old@example.com';

      const updateDto = {
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.findOne.mockResolvedValueOnce(null); // Pas de conflit d'email
      mockRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('123', updateDto);

      expect(result.email).toBe(updateDto.email);
      expect(result.firstName).toBe(updateDto.firstName);
      expect(result.lastName).toBe(updateDto.lastName);
    });

    it("devrait lever une exception si l'email est déjà utilisé", async () => {
      const mockUser = new User();
      mockUser.id = '123';
      mockUser.email = 'old@example.com';

      const existingUser = new User();
      existingUser.id = '456';
      existingUser.email = 'new@example.com';

      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('123', { email: 'new@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it("devrait mettre à jour l'adresse avec succès", async () => {
      const mockUser = new User();
      mockUser.id = '123';
      const updateDto = {
        address: {
          street: '123 rue de Paris',
          zipCode: '75001',
          city: 'Paris',
          additionalInfo: 'Appartement 4B',
        },
      };

      mockRepository.findOne.mockResolvedValueOnce(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('123', updateDto);

      expect(result.address).toEqual(updateDto.address);
    });
  });

  describe('deleteAccount', () => {
    it('devrait supprimer le compte avec succès', async () => {
      const mockUser = new User();
      mockUser.id = '123';
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      await service.deleteAccount('123');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it("devrait lever une exception si le compte n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

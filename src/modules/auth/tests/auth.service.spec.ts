import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: Partial<UsersService>;

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a user', async () => {
      const createdUser = {
        id: '1',
        email: registerDto.email,
        password: 'hashedPassword',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        hashPassword: jest.fn(),
        validatePassword: jest.fn(),
      } as User;

      (mockUsersService.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({
        user: {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
        },
        message: 'Registration successful',
      });
    });

    it('should throw ConflictException when email exists', async () => {
      (mockUsersService.create as jest.Mock).mockRejectedValue(
        new ConflictException(),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should throw BadRequestException on other errors', async () => {
      (mockUsersService.create as jest.Mock).mockRejectedValue(new Error());

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });
  });
});

import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: Partial<UsersService>;
  let mockJwtService: Partial<JwtService>;

  beforeEach(async () => {
    mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('test.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
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
      } as unknown as User;

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

  describe('login', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockUser = {
      id: '1',
      email: loginDto.email,
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      validatePassword: jest
        .fn()
        .mockImplementation(() => Promise.resolve(true)),
      hashPassword: jest.fn(),
    } as unknown as User;

    it('should successfully login a user', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockUser.validatePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
        access_token: 'test.jwt.token',
        message: 'Login successful',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (mockUsersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockUser.validatePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
    });
  });
});

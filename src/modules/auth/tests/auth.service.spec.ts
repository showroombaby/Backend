import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../../email/services/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updatePassword: jest.fn(),
    } as any;

    mockJwtService = {
      sign: jest.fn().mockReturnValue('test.jwt.token'),
      verify: jest.fn(),
    } as any;

    mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
    } as any;

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
        {
          provide: EmailService,
          useValue: mockEmailService,
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
      rememberMe: false,
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
      validatePassword: jest.fn().mockResolvedValue(true),
      hashPassword: jest.fn(),
    } as unknown as User;

    it('should successfully login a user with normal expiration', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test.jwt.token');

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'test.jwt.token',
        message: 'Login successful',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { expiresIn: '24h' },
      );
    });

    it('should successfully login a user with extended expiration when rememberMe is true', async () => {
      const loginDtoWithRemember = { ...loginDto, rememberMe: true };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test.jwt.token');

      const result = await service.login(loginDtoWithRemember);

      expect(result.access_token).toBe('test.jwt.token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { expiresIn: '30d' },
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });
  });

  describe('requestPasswordReset', () => {
    const email = 'test@test.com';
    const mockUser = {
      id: '1',
      email: email,
    } as User;

    it('devrait envoyer un email de réinitialisation', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await service.requestPasswordReset(email);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id },
        { expiresIn: '1h' },
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it("devrait lever une exception si l'utilisateur n'existe pas", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.requestPasswordReset(email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resetPassword', () => {
    it('devrait réinitialiser le mot de passe avec succès', async () => {
      const userId = '1';
      const newPassword = 'newPassword123';
      const token = 'validToken';

      mockJwtService.verify.mockReturnValue({ sub: userId });
      mockUsersService.updatePassword.mockResolvedValue(undefined);

      await service.resetPassword({ token, newPassword });

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        userId,
        newPassword,
      );
    });
  });
});

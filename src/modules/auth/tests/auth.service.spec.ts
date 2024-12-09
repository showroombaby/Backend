import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../email/services/email.service';
import { Role } from '../../users/enums/role.enum';
import { UsersService } from '../../users/services/users.service';
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    validatePassword: jest.fn().mockResolvedValue(true),
  };

  const mockUsersService = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockUser),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
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
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const result = await service.register(registerDto);

      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
      expect(result.message).toBe('Registration successful');
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(mockUser);
    });

    it("devrait échouer si l'email existe déjà", async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
    });

    it('devrait connecter un utilisateur avec succès', async () => {
      const result = await service.login(loginDto);

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.message).toBe('Login successful');
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: '1d' },
      );
    });

    it('devrait échouer avec des identifiants invalides', async () => {
      mockUser.validatePassword.mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it("devrait échouer si l'utilisateur n'existe pas", async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it("devrait gérer l'option rememberMe", async () => {
      const loginDtoWithRememberMe = { ...loginDto, rememberMe: true };

      const result = await service.login(loginDtoWithRememberMe);

      expect(result.access_token).toBe('mock.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: '30d' },
      );
    });
  });
});

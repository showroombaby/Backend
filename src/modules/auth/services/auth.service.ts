import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../email/services/email.service';
import { FileService } from '../../users/services/file.service';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly fileService: FileService,
  ) {}

  async register(registerDto: RegisterDto, avatar?: Express.Multer.File) {
    try {
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      const user = await this.usersService.create(registerDto);

      if (avatar) {
        const filename = await this.fileService.saveAvatar(avatar, user.id);
        user.avatar = filename;
        user.avatarUrl = `/uploads/avatars/${filename}`;
        await this.usersService.updateProfile(user.id, {
          avatar: user.avatar,
          avatarUrl: user.avatarUrl,
        });
      }

      // Temporairement désactivé pour faciliter les tests
      // await this.emailService.sendVerificationEmail(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
          avatarUrl: user.avatarUrl,
        },
        message: 'Registration successful',
      };
    } catch (error) {
      this.logger.error("Erreur lors de l'inscription:", error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await user.validatePassword(loginDto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const expiresIn = loginDto.rememberMe ? '30d' : '1d';

      return {
        access_token: this.jwtService.sign(payload, { expiresIn }),
        message: 'Login successful',
      };
    } catch (error) {
      this.logger.error('Erreur de connexion:', error);
      throw error;
    }
  }
}

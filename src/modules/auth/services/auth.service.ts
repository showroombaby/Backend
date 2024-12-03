import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { IAuthResponse, ILoginResponse } from '../interfaces/auth.interface';
import { EmailService } from '../../email/services/email.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly JWT_EXPIRATION_NORMAL = '24h';
  private readonly JWT_EXPIRATION_REMEMBER = '30d';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    try {
      const user = await this.usersService.create(registerDto);
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        message: 'Registration successful',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<ILoginResponse> {
    try {
      this.logger.debug(`Tentative de connexion pour ${loginDto.email}`);

      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        this.logger.debug(`Utilisateur non trouvé: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug('Validation du mot de passe');
      const isPasswordValid = await user.validatePassword(loginDto.password);
      this.logger.debug(`Résultat de la validation: ${isPasswordValid}`);

      if (!isPasswordValid) {
        this.logger.debug('Mot de passe invalide');
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user.id, email: user.email };
      const expiresIn = loginDto.rememberMe
        ? this.JWT_EXPIRATION_REMEMBER
        : this.JWT_EXPIRATION_NORMAL;

      const access_token = this.jwtService.sign(payload, { expiresIn });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        access_token,
        message: 'Login successful',
      };
    } catch (error) {
      this.logger.error('Erreur de connexion:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.debug(`Utilisateur non trouvé pour l'email: ${email}`);
      throw new NotFoundException('User not found');
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );
    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;
    let userId: string;

    try {
      const payload = this.jwtService.verify(token);
      userId = payload.sub;
    } catch (error) {
      this.logger.error('Token de réinitialisation invalide ou expiré');
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.usersService.updatePassword(userId, newPassword);
  }
}

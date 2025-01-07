import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RegisterDto } from '../../auth/dto/register.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';
import { Role } from '../enums/role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    try {
      const user = this.userRepository.create({
        ...registerDto,
        role: Role.USER,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error("Erreur lors de la création de l'utilisateur:", error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error('Erreur lors de la recherche par email:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error('Erreur lors de la recherche par ID:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Mettre à jour uniquement les champs fournis
      Object.assign(user, updateProfileDto);

      // Sauvegarder les modifications
      const updatedUser = await this.userRepository.save(user);

      // Retourner l'utilisateur mis à jour sans le mot de passe
      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Vérifier que le nouveau mot de passe et la confirmation correspondent
      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new BadRequestException(
          'New password and confirmation do not match',
        );
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );

      // Mettre à jour le mot de passe
      user.password = hashedPassword;
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      user.isEmailVerified = true;
      await this.userRepository.save(user);
    } catch (error) {
      this.logger.error("Erreur lors de la vérification de l'email:", error);
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      await this.userRepository.remove(user);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du compte:', error);
      throw error;
    }
  }
}

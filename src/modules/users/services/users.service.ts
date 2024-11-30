import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from '../../auth/dto/register.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    this.logger.debug(
      `Création d'un utilisateur avec email: ${registerDto.email}`,
    );

    const existingUser = await this.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create(registerDto);
    const savedUser = await this.userRepository.save(user);
    this.logger.debug(`Utilisateur créé avec ID: ${savedUser.id}`);

    return savedUser;
  }

  async findById(id: string): Promise<User> {
    this.logger.debug(`Recherche de l'utilisateur avec ID: ${id}`);
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.debug(`Utilisateur non trouvé avec ID: ${id}`);
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Recherche de l'utilisateur avec email: ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      this.logger.debug(`Utilisateur trouvé avec email: ${email}`);
    } else {
      this.logger.debug(`Utilisateur non trouvé avec email: ${email}`);
    }
    return user;
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findById(id);

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateProfileDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateProfileDto);
    return this.userRepository.save(user);
  }

  async deleteAccount(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }
}

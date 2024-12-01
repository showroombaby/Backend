import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil récupéré avec succès',
    type: User,
  })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    this.logger.debug(`Récupération du profil pour l'utilisateur ${user.id}`);
    return user;
  }

  @Put('profile')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil mis à jour avec succès',
    type: User,
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    this.logger.debug(`Mise à jour du profil pour l'utilisateur ${user.id}`);
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Compte supprimé avec succès',
  })
  async deleteAccount(@CurrentUser() user: User): Promise<void> {
    this.logger.debug(`Suppression du compte pour l'utilisateur ${user.id}`);
    await this.usersService.deleteAccount(user.id);
  }
}

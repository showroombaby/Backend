import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';
import { FileService } from '../services/file.service';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly fileService: FileService,
  ) {}

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

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Avatar mis à jour avec succès',
    type: User,
  })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    this.logger.debug(`Upload d'avatar pour l'utilisateur ${user.id}`);

    // Supprimer l'ancien avatar s'il existe
    if (user.avatar) {
      await this.fileService.deleteAvatar(user.avatar);
    }

    // Sauvegarder le nouvel avatar
    const filename = await this.fileService.saveAvatar(file, user.id);

    // Mettre à jour l'utilisateur avec le nouveau nom de fichier
    return this.usersService.updateProfile(user.id, { avatar: filename });
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Avatar supprimé avec succès',
  })
  async deleteAvatar(@CurrentUser() user: User): Promise<void> {
    this.logger.debug(`Suppression de l'avatar pour l'utilisateur ${user.id}`);

    if (user.avatar) {
      await this.fileService.deleteAvatar(user.avatar);
      await this.usersService.updateProfile(user.id, { avatar: null });
    }
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mot de passe modifié avec succès',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Mot de passe actuel incorrect',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    this.logger.debug(
      `Modification du mot de passe pour l'utilisateur ${user.id}`,
    );
    await this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Compte supprimé avec succès',
  })
  async deleteAccount(@CurrentUser() user: User): Promise<void> {
    this.logger.debug(`Suppression du compte pour l'utilisateur ${user.id}`);

    // Supprimer l'avatar s'il existe
    if (user.avatar) {
      await this.fileService.deleteAvatar(user.avatar);
    }

    await this.usersService.deleteAccount(user.id);
  }
}

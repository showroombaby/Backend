import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Put('profile')
  @ApiOperation({ summary: "Mettre à jour le profil de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour avec succès',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe changé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou ancien mot de passe incorrect',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Delete('account')
  @ApiOperation({ summary: 'Supprimer le compte utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Compte supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Account deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async deleteAccount(@Req() req: any) {
    await this.usersService.deleteAccount(req.user.id);
    return { message: 'Account deleted successfully' };
  }
}

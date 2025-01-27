import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateRatingDto } from '../dto/create-rating.dto';
import { UserRatingsService } from '../services/user-ratings.service';
import { UserRating } from '../entities/user-rating.entity';

@ApiTags('user-ratings')
@Controller('user-ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserRatingsController {
  constructor(private readonly userRatingsService: UserRatingsService) {}

  @Post()
  @ApiOperation({ summary: 'Noter un utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Note créée avec succès',
    type: UserRating,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 409, description: 'Note déjà existante' })
  async createRating(
    @Req() req: any,
    @Body() createRatingDto: CreateRatingDto,
  ): Promise<UserRating> {
    return this.userRatingsService.createRating(req.user.id, createRatingDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Récupérer les notes d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Notes récupérées avec succès',
    type: [UserRating],
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserRatings(@Param('userId') userId: string): Promise<UserRating[]> {
    return this.userRatingsService.getUserRatings(userId);
  }
}

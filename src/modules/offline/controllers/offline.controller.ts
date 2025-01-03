import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { OfflineService } from '../services/offline.service';

@ApiTags('offline')
@Controller('offline')
@UseGuards(JwtAuthGuard)
export class OfflineController {
  constructor(private readonly offlineService: OfflineService) {}

  @Get('sync')
  @ApiOperation({ summary: 'Synchroniser les données pour le mode hors-ligne' })
  @ApiResponse({
    status: 200,
    description: 'Données synchronisées avec succès',
  })
  async syncOfflineData(@GetUser() user: User) {
    return this.offlineService.getOfflineData(user.id);
  }

  @Get('clear')
  @ApiOperation({ summary: 'Effacer les données hors-ligne' })
  @ApiResponse({
    status: 200,
    description: 'Données hors-ligne effacées avec succès',
  })
  async clearOfflineData(@GetUser() user: User) {
    return this.offlineService.clearOfflineData(user.id);
  }
}

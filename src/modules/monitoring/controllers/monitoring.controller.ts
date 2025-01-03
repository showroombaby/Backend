import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MonitoringService } from '../services/monitoring.service';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @ApiOperation({ summary: "Vérifier la santé de l'application" })
  @ApiResponse({
    status: 200,
    description: "Retourne les métriques de santé de l'application",
  })
  async checkHealth() {
    return this.monitoringService.checkHealth();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Obtenir les métriques de l'application" })
  @ApiResponse({
    status: 200,
    description: "Retourne les métriques détaillées de l'application",
  })
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }
}

import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../users/enums/role.enum';

@ApiTags('monitoring')
@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MetricsController extends PrometheusController {
  @Get()
  @ApiOperation({ summary: 'Récupérer les métriques Prometheus' })
  @ApiResponse({
    status: 200,
    description: 'Métriques au format Prometheus',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé - Réservé aux administrateurs',
  })
  async getMetrics(@Res() response: Response) {
    return super.index(response);
  }
}

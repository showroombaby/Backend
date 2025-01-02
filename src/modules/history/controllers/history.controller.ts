import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Param,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HistoryService } from '../services/history.service';
import { History, ActionType } from '../entities/history.entity';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../users/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { parse } from 'json2csv';

@ApiTags('history')
@Controller('history')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'historique avec filtres et pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des entrées d\'historique récupérée avec succès',
    type: [History],
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'actionType', required: false, enum: ActionType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('actionType') actionType?: ActionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.historyService.findAll({
      userId,
      entityType,
      actionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Exporter l\'historique au format CSV' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historique exporté avec succès',
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'actionType', required: false, enum: ActionType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async export(
    @Res() res: Response,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('actionType') actionType?: ActionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { items } = await this.historyService.findAll({
      userId,
      entityType,
      actionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 1000, // Limite pour l'export
    });

    const fields = [
      'id',
      'userId',
      'actionType',
      'entityId',
      'entityType',
      'details',
      'ipAddress',
      'userAgent',
      'createdAt',
    ];

    const csv = parse(items, { fields });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=history.csv');
    return res.send(csv);
  }

  @Get('user')
  @ApiOperation({ summary: 'Récupérer l\'historique de l\'utilisateur connecté' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historique de l\'utilisateur récupéré avec succès',
    type: [History],
  })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'actionType', required: false, enum: ActionType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findUserHistory(
    @CurrentUser('id') userId: string,
    @Query('entityType') entityType?: string,
    @Query('actionType') actionType?: ActionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.historyService.findByUser(userId, {
      entityType,
      actionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Récupérer une entrée d\'historique par ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entrée d\'historique trouvée',
    type: History,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entrée d\'historique non trouvée',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.historyService.findOne(id);
  }

  @Get('entity/:entityId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Récupérer l\'historique d\'une entité' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historique de l\'entité récupéré avec succès',
    type: [History],
  })
  @ApiQuery({ name: 'entityType', required: true, type: String })
  async findEntityHistory(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('entityType') entityType: string,
  ) {
    return this.historyService.findByEntity(entityId, entityType);
  }
} 
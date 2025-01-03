import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QueueOperationDto } from '../dto/queue-operation.dto';
import { SyncService } from '../services/sync.service';

@ApiTags('offline')
@UseGuards(JwtAuthGuard)
@Controller('offline')
export class OfflineController {
  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Ajouter une opération à la file de synchronisation',
  })
  @ApiResponse({
    status: 201,
    description: "L'opération a été ajoutée à la file de synchronisation",
  })
  async queueOperation(@Body() operationDto: QueueOperationDto, @Req() req) {
    return await this.syncService.queueOperation(
      req.user.id,
      operationDto.entityType,
      operationDto.entityId,
      operationDto.operation,
      operationDto.data,
    );
  }

  @Post('sync/process')
  @ApiOperation({ summary: 'Traiter la file de synchronisation' })
  @ApiResponse({
    status: 200,
    description: 'La file de synchronisation a été traitée',
  })
  async processSyncQueue(@Req() req) {
    await this.syncService.processSyncQueue(req.user.id);
    return { message: 'File de synchronisation traitée' };
  }

  @Get('sync/failed')
  @ApiOperation({ summary: 'Obtenir les opérations échouées' })
  @ApiResponse({
    status: 200,
    description: 'Liste des opérations échouées',
  })
  async getFailedOperations(@Req() req) {
    return await this.syncService.getFailedOperations(req.user.id);
  }

  @Post('sync/retry')
  @ApiOperation({ summary: 'Réessayer les opérations échouées' })
  @ApiResponse({
    status: 200,
    description: 'Les opérations échouées ont été réessayées',
  })
  async retryFailedOperations(@Req() req) {
    await this.syncService.retryFailedOperations(req.user.id);
    return { message: 'Opérations échouées réessayées' };
  }

  @Post('sync/clear')
  @ApiOperation({ summary: 'Nettoyer les opérations terminées' })
  @ApiResponse({
    status: 200,
    description: 'Les opérations terminées ont été nettoyées',
  })
  async clearCompletedOperations(
    @Req() req,
    @Query('olderThan') olderThan?: string,
  ) {
    await this.syncService.clearCompletedOperations(
      req.user.id,
      olderThan ? new Date(olderThan) : undefined,
    );
    return { message: 'Opérations terminées nettoyées' };
  }
}

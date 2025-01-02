import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MessageHistoryService } from '../services/message-history.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { MessageAction } from '../entities/message-history.entity';
import { Parser } from 'json2csv';

@ApiTags('Message History')
@Controller('history/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageHistoryController {
  constructor(private readonly messageHistoryService: MessageHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get message history with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated message history' })
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: MessageAction,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.messageHistoryService.findAll({
      userId,
      action,
      startDate,
      endDate,
      limit: +limit,
      offset: +offset,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export message history to CSV' })
  @ApiResponse({ status: 200, description: 'Returns CSV file' })
  async export(
    @Res() res: Response,
    @GetUser() user: User,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    const history = await this.messageHistoryService.findByUser(user.id, {
      startDate,
      endDate,
      limit: 1000, // Limite raisonnable pour l'export
    });

    const fields = ['id', 'senderId', 'receiverId', 'messageId', 'action', 'content', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(history.items);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('message-history.csv');
    return res.send(csv);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user message history' })
  @ApiResponse({ status: 200, description: 'Returns user message history' })
  async findUserHistory(
    @GetUser() user: User,
    @Query('action') action?: MessageAction,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.messageHistoryService.findByUser(user.id, {
      action,
      startDate,
      endDate,
      limit: +limit,
      offset: +offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message history by ID' })
  @ApiResponse({ status: 200, description: 'Returns message history entry' })
  @ApiResponse({ status: 404, description: 'Message history not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    try {
      return await this.messageHistoryService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Message history with ID ${id} not found`);
    }
  }
} 
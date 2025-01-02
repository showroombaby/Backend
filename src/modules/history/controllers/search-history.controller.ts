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
import { SearchHistoryService } from '../services/search-history.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { Parser } from 'json2csv';

@ApiTags('Search History')
@Controller('history/searches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get search history with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated search history' })
  async findAll(
    @Query('userId') userId?: string,
    @Query('category') category?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.searchHistoryService.findAll({
      userId,
      category,
      searchTerm,
      startDate,
      endDate,
      limit: +limit,
      offset: +offset,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export search history to CSV' })
  @ApiResponse({ status: 200, description: 'Returns CSV file' })
  async export(
    @Res() res: Response,
    @GetUser() user: User,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    const history = await this.searchHistoryService.findByUser(user.id, {
      startDate,
      endDate,
      limit: 1000, // Limite raisonnable pour l'export
    });

    const fields = ['id', 'userId', 'searchTerm', 'category', 'filters', 'resultsCount', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(history.items);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('search-history.csv');
    return res.send(csv);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular searches' })
  @ApiResponse({ status: 200, description: 'Returns popular searches' })
  async findPopularSearches(
    @Query('category') category?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('limit') limit = 10,
  ) {
    return this.searchHistoryService.findPopularSearches({
      category,
      startDate,
      endDate,
      limit: +limit,
    });
  }

  @Get('user')
  @ApiOperation({ summary: 'Get current user search history' })
  @ApiResponse({ status: 200, description: 'Returns user search history' })
  async findUserHistory(
    @GetUser() user: User,
    @Query('category') category?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.searchHistoryService.findByUser(user.id, {
      category,
      searchTerm,
      startDate,
      endDate,
      limit: +limit,
      offset: +offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get search history by ID' })
  @ApiResponse({ status: 200, description: 'Returns search history entry' })
  @ApiResponse({ status: 404, description: 'Search history not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    try {
      return await this.searchHistoryService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Search history with ID ${id} not found`);
    }
  }
} 
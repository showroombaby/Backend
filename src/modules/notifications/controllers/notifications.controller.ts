import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../services/notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'The notification has been created.',
  })
  create(@Body() createNotificationDto: CreateNotificationDto, @Req() req) {
    createNotificationDto.userId = req.user.id;
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, description: 'Return all notifications.' })
  findAll(@Query() paginationDto: PaginationDto, @Req() req) {
    return this.notificationsService.findAll(req.user.id, paginationDto);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({ status: 200, description: 'Return unread notifications.' })
  findUnread(@Req() req) {
    return this.notificationsService.findUnread(req.user.id);
  }

  @Get('count/unread')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Return unread notifications count.',
  })
  getUnreadCount(@Req() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get notifications by type' })
  @ApiResponse({
    status: 200,
    description: 'Return notifications of specified type.',
  })
  findByType(@Param('type') type: NotificationType, @Req() req) {
    return this.notificationsService.findByType(req.user.id, type);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been marked as read.',
  })
  markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('read/all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications have been marked as read.',
  })
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive notification' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been archived.',
  })
  archive(@Param('id') id: string, @Req() req) {
    return this.notificationsService.archive(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been deleted.',
  })
  delete(@Param('id') id: string, @Req() req) {
    return this.notificationsService.delete(id, req.user.id);
  }
}

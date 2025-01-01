import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { SearchMessagesDto } from '../dto/search-messages.dto';
import { MessagingGateway } from '../gateways/messaging.gateway';
import {
  ApiArchiveConversation,
  ApiArchiveMessage,
  ApiCreateMessage,
  ApiGetArchivedMessages,
  ApiGetConversation,
  ApiGetConversations,
  ApiMarkMessageAsRead,
  ApiSearchMessages,
  ApiUnarchiveConversation,
  ApiUnarchiveMessage,
} from '../messaging.controller.swagger';
import { MessagingService } from '../services/messaging.service';

@ApiTags('messaging')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  @Post()
  @ApiCreateMessage()
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    const message = await this.messagingService.createMessage(
      user.id,
      createMessageDto,
    );

    if (this.messagingGateway.isUserOnline(createMessageDto.recipientId)) {
      this.messagingGateway.server
        .to(`user_${createMessageDto.recipientId}`)
        .emit('newMessage', message);
    }

    return message;
  }

  @Get('conversations')
  @ApiGetConversations()
  async getConversations(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagingService.getUserConversations(user.id, pagination);
  }

  @Get('conversations/archived')
  @ApiGetConversations()
  async getArchivedConversations(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagingService.getArchivedConversations(user.id, pagination);
  }

  @Get('conversation/:userId')
  @ApiGetConversation()
  async getConversation(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    const messages = await this.messagingService.getConversation(
      user.id,
      otherUserId,
      pagination,
    );
    await this.messagingService.markConversationAsRead(user.id, otherUserId);
    return messages;
  }

  @Post(':messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiMarkMessageAsRead()
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
  ) {
    const message = await this.messagingService.markMessageAsRead(
      messageId,
      user.id,
    );

    if (this.messagingGateway.isUserOnline(message.senderId)) {
      this.messagingGateway.server
        .to(`user_${message.senderId}`)
        .emit('messageRead', { messageId: message.id });
    }

    return message;
  }

  @Post('conversation/:userId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiArchiveConversation()
  async archiveConversation(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: User,
  ) {
    await this.messagingService.archiveConversation(user.id, otherUserId);
    return { message: 'Conversation archivée avec succès' };
  }

  @Post('conversation/:userId/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiUnarchiveConversation()
  async unarchiveConversation(
    @Param('userId') otherUserId: string,
    @CurrentUser() user: User,
  ) {
    await this.messagingService.unarchiveConversation(user.id, otherUserId);
    return { message: 'Conversation désarchivée avec succès' };
  }

  @Get('search')
  @ApiSearchMessages()
  async searchMessages(
    @Query() searchDto: SearchMessagesDto,
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagingService.searchMessages(user.id, searchDto, pagination);
  }

  @Post(':messageId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiArchiveMessage()
  async archiveMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
  ) {
    const message = await this.messagingService.archiveMessage(
      messageId,
      user.id,
    );

    if (this.messagingGateway.isUserOnline(message.recipientId)) {
      this.messagingGateway.server
        .to(`user_${message.recipientId}`)
        .emit('messageArchived', {
          messageId: message.id,
          archivedBySender: message.archivedBySender,
          archivedByRecipient: message.archivedByRecipient,
        });
    }

    return message;
  }

  @Post(':messageId/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiUnarchiveMessage()
  async unarchiveMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
  ) {
    const message = await this.messagingService.unarchiveMessage(
      messageId,
      user.id,
    );

    if (this.messagingGateway.isUserOnline(message.recipientId)) {
      this.messagingGateway.server
        .to(`user_${message.recipientId}`)
        .emit('messageUnarchived', {
          messageId: message.id,
          archivedBySender: message.archivedBySender,
          archivedByRecipient: message.archivedByRecipient,
        });
    }

    return message;
  }

  @Get('archived')
  @ApiGetArchivedMessages()
  async getArchivedMessages(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagingService.getArchivedMessages(user.id, pagination);
  }
}

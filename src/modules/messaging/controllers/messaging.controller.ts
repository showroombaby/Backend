import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { MessagingService } from '../services/messaging.service';
import { CreateMessageDto, MessageResponseDto, ConversationDto } from '../dto/message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  async sendMessage(
    @Req() req: { headers: { 'user-id': string } },
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const userId = req.headers['user-id'];
    return this.messagingService.createMessage(userId, createMessageDto);
  }

  @Get('conversations')
  async getConversations(
    @Req() req: { headers: { 'user-id': string } },
  ): Promise<ConversationDto[]> {
    const userId = req.headers['user-id'];
    return this.messagingService.getConversations(userId);
  }

  @Get(':userId')
  async getConversation(
    @Req() req: { headers: { 'user-id': string } },
    @Param('userId') otherUserId: string,
  ): Promise<MessageResponseDto[]> {
    const userId = req.headers['user-id'];
    return this.messagingService.getConversation(userId, otherUserId);
  }
} 
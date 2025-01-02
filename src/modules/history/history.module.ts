import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageHistory } from './entities/message-history.entity';
import { SearchHistory } from './entities/search-history.entity';
import { History } from './entities/history.entity';
import { MessageHistoryService } from './services/message-history.service';
import { SearchHistoryService } from './services/search-history.service';
import { HistoryService } from './services/history.service';
import { MessageHistoryController } from './controllers/message-history.controller';
import { SearchHistoryController } from './controllers/search-history.controller';
import { HistoryController } from './controllers/history.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageHistory, SearchHistory, History]),
  ],
  controllers: [MessageHistoryController, SearchHistoryController, HistoryController],
  providers: [MessageHistoryService, SearchHistoryService, HistoryService],
  exports: [MessageHistoryService, SearchHistoryService, HistoryService],
})
export class HistoryModule {} 
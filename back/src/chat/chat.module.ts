import { Module } from '@nestjs/common';
import { MatchingModule } from '../matching/matching.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { InjectionGuard } from './guards/injection.guard';
import { OpenAiChatClient } from './openai-chat.client';
import { ToolsService } from './tools/tools.service';

@Module({
  imports: [MatchingModule],
  controllers: [ChatController],
  providers: [ChatService, InjectionGuard, OpenAiChatClient, ToolsService],
})
export class ChatModule {}

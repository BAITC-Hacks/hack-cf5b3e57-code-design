import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService, ChatStreamEvent } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('session')
  createSession(@Body() dto: CreateSessionDto) {
    return this.chat.createSession(dto);
  }

  @Post(':sessionId/message')
  @HttpCode(200)
  @Sse()
  sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ): Observable<ChatStreamEvent> {
    return new Observable((subscriber) => {
      void (async () => {
        try {
          for await (const event of this.chat.streamMessage(
            sessionId,
            dto.content,
          )) {
            subscriber.next(event);
          }
        } catch (error) {
          subscriber.next({
            type: 'error',
            data: { code: 'internal', message: (error as Error).message },
          });
        } finally {
          subscriber.complete();
        }
      })();
    });
  }

  @Get(':sessionId')
  getHistory(@Param('sessionId') sessionId: string) {
    return this.chat.getHistory(sessionId);
  }
}

import {
  Body,
  Controller,
  Post,
  Query,
  Res,
  Sse,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchingService } from './matching.service';
import type { MatchResponse } from './types';

@Controller('match')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Post()
  async run(@Body() dto: MatchRequestDto): Promise<MatchResponse> {
    return this.matching.run(dto);
  }

  /**
   * SSE-стрим: события пайплайна по мере готовности.
   *
   * Nest поддерживает `@Sse` с Observable из объектов `MessageEvent`.
   * Мы отдаём `type` в поле `type`, а полезную нагрузку — в `data`.
   */
  @Sse('stream')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, transformOptions: { enableImplicitConversion: true } }))
  stream(@Query() dto: MatchRequestDto): Observable<{ type: string; data: unknown }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const ev of this.matching.stream(dto)) {
            switch (ev.type) {
              case 'criteria':
                subscriber.next({ type: 'criteria', data: { criteria: ev.criteria } });
                break;
              case 'filter_step':
                subscriber.next({ type: 'filter_step', data: ev.step });
                break;
              case 'ranked':
                subscriber.next({ type: 'ranked', data: { ids: ev.ids } });
                break;
              case 'card':
                subscriber.next({ type: 'card', data: ev.card });
                break;
              case 'critic':
                subscriber.next({ type: 'critic', data: { ok: ev.ok, problems: ev.problems } });
                break;
              case 'done':
                subscriber.next({ type: 'done', data: ev.response });
                subscriber.complete();
                return;
            }
          }
          subscriber.complete();
        } catch (e) {
          subscriber.next({
            type: 'error',
            data: { code: 'pipeline_error', message: (e as Error).message },
          });
          subscriber.complete();
        }
      })();
    });
  }
}

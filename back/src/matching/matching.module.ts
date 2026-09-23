import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExplainerService } from './explainer.service';
import { FilterService } from './filter.service';
import { LLM_CLIENT, LlmClient } from './llm/llm-client';
import { MockLlmClient } from './llm/mock-llm.client';
import { NvidiaLlmClient } from './llm/nvidia-llm.client';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { RankingService } from './ranking.service';

/**
 * LlmClient выбирается один раз при старте приложения:
 * - MOCK=1 или пустой NVIDIA_API_KEY → детерминированный MockLlmClient (без сети).
 * - иначе NvidiaLlmClient, который внутри себя падает в mock при таймауте / ошибке.
 *
 * Так гарантируем, что пайплайн всегда доедет до `done`, даже если LLM недоступен.
 */
const llmProvider = {
  provide: LLM_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): LlmClient => {
    const logger = new Logger('LlmProvider');
    const mockForced = config.get<string>('MOCK') === '1';
    const key = config.get<string>('NVIDIA_API_KEY') ?? '';
    if (mockForced || key.trim() === '') {
      logger.log(
        `MOCK mode active (${mockForced ? 'MOCK=1' : 'NVIDIA_API_KEY empty'}) — no external LLM calls`,
      );
      return new MockLlmClient();
    }
    const baseURL = config.get<string>('NVIDIA_BASE_URL');
    const model = config.get<string>('MODEL_MAIN');
    logger.log(`NVIDIA LLM enabled (model=${model ?? 'default'})`);
    return new NvidiaLlmClient(key, baseURL, model);
  },
};

@Module({
  controllers: [MatchingController],
  providers: [
    FilterService,
    RankingService,
    ExplainerService,
    MatchingService,
    llmProvider,
  ],
  exports: [MatchingService],
})
export class MatchingModule {}

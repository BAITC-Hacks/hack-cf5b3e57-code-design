import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExplainerService } from './explainer.service';
import { FilterService } from './filter.service';
import { LLM_CLIENT, LlmClient } from './llm/llm-client';
import { MockLlmClient } from './llm/mock-llm.client';
import { OpenAiLlmClient } from './llm/openai-llm.client';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { RankingService } from './ranking.service';

/**
 * LlmClient выбирается один раз при старте приложения:
 * - MOCK=1 or no OPENAI_API_KEY → deterministic offline client.
 * - Otherwise the OpenAI client falls back to MOCK on an individual failure.
 *
 * Так гарантируем, что пайплайн всегда доедет до `done`, даже если LLM недоступен.
 */
const llmProvider = {
  provide: LLM_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): LlmClient => {
    const logger = new Logger('LlmProvider');
    const mockForced = config.get<string>('MOCK') === '1';
    const openaiKey = (config.get<string>('OPENAI_API_KEY') ?? '').trim();
    if (mockForced || !openaiKey) {
      logger.log(
        `MOCK mode active (${mockForced ? 'MOCK=1' : 'no API key'}) — no external LLM calls`,
      );
      return new MockLlmClient();
    }
    const configuredModel = config.get<string>('MODEL_MAIN')?.trim();
    const model = configuredModel || 'gpt-4o-mini';
    logger.log(`OpenAI enabled (model=${model})`);
    return new OpenAiLlmClient(openaiKey, model);
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

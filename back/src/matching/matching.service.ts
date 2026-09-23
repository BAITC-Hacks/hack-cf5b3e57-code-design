import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { ExplainerService } from './explainer.service';
import { FilterService } from './filter.service';
import type { LlmClient } from './llm/llm-client';
import { LLM_CLIENT } from './llm/llm-client';
import { RankingService } from './ranking.service';
import type { FunnelStep, MatchCard, MatchResponse } from './types';

/**
 * Событие пайплайна для SSE-стрима. Используется MatchingController — он
 * подписывается на этот AsyncIterable и просто перекодирует под контракт.
 */
export type PipelineEvent =
  | { type: 'criteria'; criteria: string[] }
  | { type: 'filter_step'; step: FunnelStep }
  | { type: 'ranked'; ids: string[] }
  | { type: 'card'; card: MatchCard }
  | { type: 'critic'; ok: boolean; problems: { id: string; problem: string }[] }
  | { type: 'done'; response: MatchResponse };

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filter: FilterService,
    private readonly ranking: RankingService,
    private readonly explainer: ExplainerService,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  /** Синхронный вариант — для `POST /api/v1/match`. */
  async run(req: MatchRequestDto): Promise<MatchResponse> {
    let response: MatchResponse | null = null;
    for await (const ev of this.stream(req)) {
      if (ev.type === 'done') response = ev.response;
    }
    if (!response) throw new Error('pipeline finished without done event');
    return response;
  }

  /** SSE-вариант: генерирует события по мере готовности. */
  async *stream(req: MatchRequestDto): AsyncGenerator<PipelineEvent> {
    // 1. Критерии от LLM (можно параллельно с фильтром, но лучше сначала —
    // чтобы UI показал «на что смотреть» раньше, чем начнёт крутить воронку).
    const criteria = await this.llm.criteria({
      request: {
        city: req.city,
        date: req.date,
        eventType: req.eventType,
        category: req.category,
        budgetKzt: req.budgetKzt,
        durationHours: req.durationHours,
        language: req.language,
      },
      poolSize: 0,
    });
    yield { type: 'criteria', criteria };

    // 2. Фильтр — детерминированный, шаги эмитим по одному.
    const filtered = await this.filter.run(req);
    for (const step of filtered.funnel) {
      yield { type: 'filter_step', step: step };
    }

    // 3. Классификация исхода.
    const outcome = this.classify(filtered.funnel);
    if (outcome !== 'found') {
      const response: MatchResponse = {
        outcome,
        criteria,
        cards: [],
        funnel: filtered.funnel,
        summary: this.summaryEmpty(outcome, filtered.funnel, req),
      };
      yield { type: 'done', response };
      return;
    }

    // 4. Ранжирование.
    const orderedIds = await this.ranking.rank(filtered.survivors, req);
    yield { type: 'ranked', ids: orderedIds };

    // 5. Объяснения (топ-3).
    const cards = await this.explainer.build(orderedIds, req, criteria);
    for (const card of cards) yield { type: 'card', card };

    // 6. Критик — по объяснениям карточек.
    const criticOut = await this.llm.critic(
      cards.map((c) => ({ id: c.id, reason: c.reason })),
    );
    yield { type: 'critic', ok: criticOut.ok, problems: criticOut.problems };

    // 7. Финал.
    const response: MatchResponse = {
      outcome: 'found',
      criteria,
      cards,
      funnel: filtered.funnel,
      summary: this.summaryFound(cards.length, filtered),
    };
    yield { type: 'done', response };
  }

  private classify(funnel: FunnelStep[]): MatchResponse['outcome'] {
    const cityStep = funnel.find((s) => s.step === 'city');
    const catStep = funnel.find((s) => s.step === 'category');
    if (cityStep && catStep && cityStep.after > 0 && catStep.after === 0) {
      return 'no_category_in_city';
    }
    const last = funnel[funnel.length - 1];
    if (!last || last.after === 0) return 'all_filtered_out';
    return 'found';
  }

  private summaryFound(
    shown: number,
    filtered: { survivors: string[]; funnel: FunnelStep[] },
  ): string {
    const total = filtered.survivors.length;
    const reduced = filtered.funnel[0]?.before ?? total;
    if (shown === 3 && total > 3) {
      return `Показаны 3 из ${total} подходящих. Всего в каталоге ${reduced}.`;
    }
    return `Показаны все ${shown} подходящих (из ${reduced} в каталоге).`;
  }

  private summaryEmpty(
    outcome: 'no_category_in_city' | 'all_filtered_out',
    funnel: FunnelStep[],
    req: MatchRequestDto,
  ): string {
    if (outcome === 'no_category_in_city') {
      return `В городе «${req.city}» нет подрядчиков категории «${req.category}».`;
    }
    // соберём человекочитаемую сводку причин
    const causes = funnel
      .filter((s) => s.after < s.before)
      .map((s) => `${s.step}: -${s.before - s.after} (${s.removedReason})`);
    const inCity = funnel.find((s) => s.step === 'city')?.after ?? 0;
    return `Кандидаты есть (в ${req.city} — ${inCity}), но ни один не проходит: ${causes.join('; ')}.`;
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  categoryGenPl,
  categoryPlural,
  cityGen,
  cityLoc,
  eventAcc,
  humanDate,
  money,
  otherCities,
} from './copy/nouns';
import { summarizeCauses } from './copy/reasons';
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
        summary: await this.summaryEmpty(outcome, filtered.funnel, req),
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
      summary: this.summaryFound(cards.length, filtered, req),
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
    req: MatchRequestDto,
  ): string {
    const suitable = filtered.survivors.length;
    const inCategory =
      filtered.funnel.find((step) => step.step === 'category')?.after ??
      suitable;
    const removed = inCategory - suitable;

    if (shown === 3 && removed > 0) {
      return `Подобрали 3 из ${suitable} подходящих ${categoryPlural(req.category, suitable)}. Остальные ${removed} ${cityLoc(req.city)}: ${summarizeCauses(filtered.funnel, req)}.`;
    }
    if (shown < 3 && removed > 0) {
      return `Подходят ${suitable} из ${inCategory}: ${summarizeCauses(filtered.funnel, req)}.`;
    }
    if (shown === 3 && suitable > 3) {
      return `Подобрали 3 из ${suitable} подходящих ${categoryPlural(req.category, suitable)}.`;
    }
    return `Во всём каталоге ${cityGen(req.city)}: ${inCategory} ${categoryPlural(req.category, inCategory)}. Показываем всех, кто подходит.`;
  }

  private async summaryEmpty(
    outcome: 'no_category_in_city' | 'all_filtered_out',
    funnel: FunnelStep[],
    req: MatchRequestDto,
  ): Promise<string> {
    if (outcome === 'no_category_in_city') {
      const alternatives = await Promise.all(
        otherCities(req.city).map(async (city) => ({
          city,
          count: await this.prisma.contractor.count({
            where: { city, categories: { has: req.category } },
          }),
        })),
      );
      const available = alternatives.filter(({ count }) => count > 0);
      if (available.length === 0) {
        return `В каталоге пока нет ${categoryGenPl(req.category)}.`;
      }
      const elsewhere = available
        .map(({ city, count }) => `Есть ${cityLoc(city)}: ${count}.`)
        .join(' ');
      return `В ${cityLoc(req.city).replace(/^\u0432\s+/u, '')} нет ${categoryGenPl(req.category)} в каталоге. ${elsewhere}`;
    }

    const candidates = await this.prisma.contractor.findMany({
      where: { city: req.city, categories: { has: req.category } },
      select: {
        busyDates: true,
        eventFormats: true,
        priceFromKzt: true,
        languages: true,
        maxHours: true,
      },
    });
    const independentFunnel = this.independentCauseFunnel(candidates, req);
    const causes = summarizeCauses(independentFunnel, req);
    const hint = await this.relaxationHint(req);
    return `В ${cityLoc(req.city).replace(/^\u0432\s+/u, '')} ${candidates.length} ${categoryPlural(req.category, candidates.length)}, но никто не подходит: ${causes}.${hint ? ` ${hint}` : ''}`;
  }

  /** Для пустого исхода каждое условие считаем независимо, а не каскадом. */
  private independentCauseFunnel(
    candidates: {
      busyDates: string[];
      eventFormats: string[];
      priceFromKzt: number;
      languages: string[];
      maxHours: number | null;
    }[],
    req: MatchRequestDto,
  ): FunnelStep[] {
    const total = candidates.length;
    const step = (
      name: FunnelStep['step'],
      rejected: (candidate: (typeof candidates)[number]) => boolean,
    ): FunnelStep => {
      const removed = candidates.filter(rejected).length;
      return {
        step: name,
        before: total,
        after: total - removed,
        removedReason: '',
      };
    };

    const result = [
      step('date', (c) => c.busyDates.includes(req.date)),
      step('format', (c) => !c.eventFormats.includes(req.eventType)),
      step('budget', (c) => c.priceFromKzt > req.budgetKzt),
    ];
    if (req.language) {
      result.push(
        step('language', (c) => !c.languages.includes(req.language!)),
      );
    }
    if (req.durationHours) {
      result.push(
        step(
          'hours',
          (c) => c.maxHours !== null && c.maxHours < req.durationHours!,
        ),
      );
    }
    return result;
  }

  private filtersExcept(
    req: MatchRequestDto,
    except: 'date' | 'budget' | 'format',
  ): Prisma.ContractorWhereInput {
    const clauses: Prisma.ContractorWhereInput[] = [
      { city: req.city },
      { categories: { has: req.category } },
    ];
    if (except !== 'date')
      clauses.push({ NOT: { busyDates: { has: req.date } } });
    if (except !== 'format')
      clauses.push({ eventFormats: { has: req.eventType } });
    if (except !== 'budget')
      clauses.push({ priceFromKzt: { lte: req.budgetKzt } });
    if (req.language) clauses.push({ languages: { has: req.language } });
    if (req.durationHours) {
      clauses.push({
        OR: [{ maxHours: null }, { maxHours: { gte: req.durationHours } }],
      });
    }
    return { AND: clauses };
  }

  private async relaxationHint(req: MatchRequestDto): Promise<string | null> {
    const withoutDate = await this.prisma.contractor.findMany({
      where: this.filtersExcept(req, 'date'),
      select: { busyDates: true },
    });
    if (withoutDate.length > 0) {
      const start = new Date(`${req.date}T00:00:00.000Z`);
      for (let days = 1; days <= 366; days += 1) {
        const next = new Date(start);
        next.setUTCDate(start.getUTCDate() + days);
        const iso = next.toISOString().slice(0, 10);
        if (
          withoutDate.some((candidate) => !candidate.busyDates.includes(iso))
        ) {
          return `Ближайшая дата, когда свободен хотя бы один: ${humanDate(iso)}.`;
        }
      }
    }

    const withoutBudget = await this.prisma.contractor.findFirst({
      where: this.filtersExcept(req, 'budget'),
      orderBy: { priceFromKzt: 'asc' },
      select: { priceFromKzt: true },
    });
    if (withoutBudget) {
      return `Самый доступный — от ${money(withoutBudget.priceFromKzt)}.`;
    }

    const withoutFormat = await this.prisma.contractor.findMany({
      where: this.filtersExcept(req, 'format'),
      select: { eventFormats: true },
    });
    if (withoutFormat.length > 0) {
      const formats = [
        ...new Set(withoutFormat.flatMap((c) => c.eventFormats)),
      ];
      return `Они работают с: ${formats.map(eventAcc).join(', ')}.`;
    }
    return null;
  }
}

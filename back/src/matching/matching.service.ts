import { Injectable, Logger } from '@nestjs/common';
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
import { criteriaFor, eventLabel } from './criteria';
import { MatchRequestDto } from './dto/match-request.dto';
import { ExplainerService } from './explainer.service';
import { FilterService } from './filter.service';
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
    // Same deterministic dimensions drive visible criteria, ranking and
    // candidate evidence. This stage needs no network call.
    const criteria = criteriaFor(req).map((item) => item.label);
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
    const { cards, critic, omittedForEvidence } = await this.explainer.build(
      orderedIds,
      req,
      criteria,
    );
    for (const card of cards) yield { type: 'card', card };

    // No provisional card is ever emitted: every visible card has already
    // passed the fact-grounded critic/retry/fallback path.
    yield { type: 'critic', ok: critic.ok, problems: critic.problems };

    // 7. Финал.
    const response: MatchResponse = {
      outcome: 'found',
      criteria,
      cards,
      funnel: filtered.funnel,
      summary: this.summaryFound(cards.length, filtered, req, omittedForEvidence),
    };
    yield { type: 'done', response };
  }

  private classify(funnel: FunnelStep[]): MatchResponse['outcome'] {
    const catStep = funnel.find((s) => s.step === 'category');
    // A city with no profiles also has no profiles in the requested category.
    // Calling that "all filtered out" would incorrectly imply candidates existed.
    if (catStep?.after === 0) {
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
    omittedForEvidence = 0,
  ): string {
    const suitable = filtered.survivors.length;
    const inCategory =
      filtered.funnel.find((step) => step.step === 'category')?.after ??
      suitable;
    const removed = inCategory - suitable;

    if (req.locale === 'en' || req.locale === 'kk') {
      const causes = this.localizedCauses(filtered.funnel, req);
      if (req.locale === 'en') {
        const base = `Found ${suitable} matching contractors in ${req.city}; showing ${shown}.`;
        const filteredNote = removed > 0 ? ` ${removed} did not pass: ${causes}.` : '';
        const evidenceNote = omittedForEvidence > 0
          ? ` ${omittedForEvidence} omitted because their available facts do not distinguish them.`
          : '';
        return `${base}${filteredNote}${evidenceNote}`;
      }
      const base = `${req.city}: ${suitable} сәйкес мердігер табылды; ${shown} көрсетілді.`;
      const filteredNote = removed > 0 ? ` ${removed} сүзгіден өтпеді: ${causes}.` : '';
      const evidenceNote = omittedForEvidence > 0
        ? ` ${omittedForEvidence} мердігердің деректері оларды айыруға жетпегендіктен көрсетілмеді.`
        : '';
      return `${base}${filteredNote}${evidenceNote}`;
    }

    if (omittedForEvidence > 0) {
      return `По фильтрам подходят ${suitable} ${categoryPlural(req.category, suitable)}. Показываем ${shown}: для ${omittedForEvidence} не нашлось достаточно отличительных подтверждённых фактов.`;
    }

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
        if (req.locale === 'en') return `No ${req.category} profiles in the catalog yet.`;
        if (req.locale === 'kk') return `Каталогта әзірге ${req.category} санаты жоқ.`;
        return `В каталоге пока нет ${categoryGenPl(req.category)}.`;
      }
      if (req.locale === 'en') {
        const elsewhere = available.map(({ city, count }) => `${city}: ${count}`).join('; ');
        return `No ${req.category} profiles in ${req.city}. Other cities: ${elsewhere}.`;
      }
      if (req.locale === 'kk') {
        const elsewhere = available.map(({ city, count }) => `${city}: ${count}`).join('; ');
        return `${req.city} қаласында ${req.category} санаты жоқ. Басқа қалалар: ${elsewhere}.`;
      }
      const elsewhere = available
        .map(({ city, count }) => `Есть ${cityLoc(city)}: ${count}.`)
        .join(' ');
      return `В ${cityLoc(req.city).replace(/^\u0432\s+/u, '')} нет ${categoryGenPl(req.category)} в каталоге. ${elsewhere}`;
    }

    const inCategory =
      funnel.find((step) => step.step === 'category')?.after ?? 0;
    if (req.locale === 'en') {
      return `${inCategory} ${req.category} profiles in ${req.city}, but none meets all requirements: ${this.localizedCauses(funnel, req)}.`;
    }
    if (req.locale === 'kk') {
      return `${req.city} қаласында ${inCategory} ${req.category} бар, бірақ ешқайсысы барлық шартқа сай емес: ${this.localizedCauses(funnel, req)}.`;
    }
    // The same sequential funnel drives the outcome and the explanation.
    // Counting each condition independently double-counts a busy contractor
    // as both unavailable and over budget, making the totals misleading.
    const causes = summarizeCauses(funnel, req);
    const hint = await this.relaxationHint(req);
    return `В ${cityLoc(req.city).replace(/^\u0432\s+/u, '')} ${inCategory} ${categoryPlural(req.category, inCategory)}, но никто не подходит: ${causes}.${hint ? ` ${hint}` : ''}`;
  }

  private localizedCauses(funnel: FunnelStep[], req: MatchRequestDto): string {
    const english = req.locale === 'en';
    const phrases: string[] = [];
    for (const step of funnel) {
      const count = step.before - step.after;
      if (count <= 0) continue;
      switch (step.step) {
        case 'date':
          phrases.push(english
            ? `${count} booked on ${req.date}`
            : `${count} мердігер ${req.date} күні бос емес`);
          break;
        case 'format':
          phrases.push(english
            ? `${count} do not accept ${eventLabel(req.eventType, 'en')}`
            : `${count} мердігер ${eventLabel(req.eventType, 'kk')} форматын алмайды`);
          break;
        case 'budget':
          phrases.push(english
            ? `${count} exceed ${money(req.budgetKzt)}`
            : `${count} мердігердің бағасы ${money(req.budgetKzt)}-ден жоғары`);
          break;
        case 'language':
          if (req.language) phrases.push(english
            ? `${count} do not offer ${req.language}`
            : `${count} мердігер ${req.language} тілінде жұмыс істемейді`);
          break;
        case 'hours':
          if (req.durationHours) phrases.push(english
            ? `${count} offer fewer than ${req.durationHours} hours`
            : `${count} мердігер ${req.durationHours} сағаттан аз жұмыс істейді`);
          break;
        case 'city':
        case 'category':
          break;
      }
    }
    return phrases.join(', ')
      || (english ? 'no profile passes the combined filters' : 'бірде-бір профиль барлық сүзгіден өтпейді');
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

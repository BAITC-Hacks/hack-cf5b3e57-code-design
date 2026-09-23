import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MatchRequestDto } from './dto/match-request.dto';
import type { LlmClient } from './llm/llm-client';
import { LLM_CLIENT } from './llm/llm-client';
import { CardFact, FactKey, MatchCard } from './types';
import { humanDate, languageLoc, money } from './copy/nouns';

export interface Differentiator {
  text: string;
  factKey: FactKey;
  priority: number;
  toString(): string;
}

@Injectable()
export class ExplainerService {
  private readonly logger = new Logger(ExplainerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  /**
   * Строит до 3 карточек: тянет данные, считает differentiators (что отличает
   * ЭТОГО от других в топе), генерит объяснение через LLM с кэшем, склеивает
   * в MatchCard с проверенными фактами.
   */
  async build(
    orderedIds: string[],
    req: MatchRequestDto,
    criteria: string[],
  ): Promise<MatchCard[]> {
    const top = orderedIds.slice(0, 3);
    if (top.length === 0) return [];

    const rows = await this.prisma.contractor.findMany({
      where: { id: { in: top } },
      include: { enrichment: true },
    });
    // сохраняем порядок из ranking
    rows.sort((a, b) => top.indexOf(a.id) - top.indexOf(b.id));

    const requestHash = this.hashRequest(req);
    const cached = await this.prisma.explanationCache.findMany({
      where: { requestHash, contractorId: { in: top } },
    });
    const cacheById = new Map(cached.map((c) => [c.contractorId, c]));

    const cards: MatchCard[] = [];

    for (const c of rows) {
      const others = rows.filter((r) => r.id !== c.id);
      const differentiators = this.diff(c, others, req);

      let reason: string;
      let factsUsed: string[];
      const hit = cacheById.get(c.id);
      if (hit) {
        reason = hit.reason;
        factsUsed = hit.factsUsed as string[];
      } else {
        const out = await this.llm.explain({
          criteria,
          request: req,
          candidate: {
            id: c.id,
            anonName: c.anonName,
            priceFromKzt: c.priceFromKzt,
            languages: c.languages,
            eventFormats: c.eventFormats,
            maxHours: c.maxHours,
            description: c.description,
            signals: c.enrichment?.signals ?? [],
            specialization: c.enrichment?.specialization ?? null,
          },
          // llm-client.ts остаётся общим контрактом. Объекты имеют toString(),
          // поэтому OpenAI-адаптер тоже получает читаемый текст через join().
          differentiators: differentiators as unknown as string[],
        });
        reason = out.reason;
        factsUsed = out.factsUsed;
        try {
          await this.prisma.explanationCache.create({
            data: {
              requestHash,
              contractorId: c.id,
              reason,
              factsUsed,
            },
          });
        } catch (e) {
          this.logger.warn(
            `cache write failed for ${c.id}: ${(e as Error).message}`,
          );
        }
      }

      cards.push({
        id: c.id,
        anonName: c.anonName,
        category: req.category,
        city: c.city,
        priceFromKzt: c.priceFromKzt,
        reason,
        factsUsed: this.materializeFacts(factsUsed, c, req),
        flags: {
          synthetic: c.synthetic,
          priceImputed: c.priceImputed,
          cityImputed: c.cityImputed,
        },
      });
    }

    return cards;
  }

  private hashRequest(req: MatchRequestDto): string {
    const norm = JSON.stringify({
      city: req.city,
      date: req.date,
      eventType: req.eventType,
      category: req.category,
      budgetKzt: req.budgetKzt,
      durationHours: req.durationHours ?? null,
      language: req.language ?? null,
    });
    return createHash('sha256').update(norm).digest('hex').slice(0, 32);
  }

  /**
   * Что отличает ЭТОГО кандидата от других двух в топе. Только сравнимые
   * атомарные факты, без общих слов.
   */
  private diff(
    me: {
      anonName: string;
      priceFromKzt: number;
      languages: string[];
      eventFormats: string[];
      maxHours: number | null;
      enrichment: { signals: string[]; specialization: string | null } | null;
    },
    others: {
      anonName: string;
      priceFromKzt: number;
      languages: string[];
      eventFormats: string[];
      maxHours: number | null;
      enrichment: { signals: string[]; specialization: string | null } | null;
    }[],
    req: MatchRequestDto,
  ): Differentiator[] {
    const out: Differentiator[] = [];
    const add = (text: string, factKey: FactKey, priority: number) => {
      out.push({ text, factKey, priority, toString: () => text });
    };

    // 1. Уникальный язык в топе.
    for (const language of ['казахский', 'английский']) {
      if (
        me.languages.includes(language) &&
        others.every((o) => !o.languages.includes(language))
      ) {
        add(
          `Единственный из свободных ${humanDate(req.date)}, кто ведёт на ${languageLoc(language)}`,
          'language',
          1,
        );
      }
    }

    // 2. Не берёт свадьбы/тои, в отличие от остальных.
    const businessRequest = ['корпоратив', 'конференция'].includes(
      req.eventType,
    );
    const takesWeddingOrToi = (formats: string[]) =>
      formats.includes('свадьба') || formats.includes('той');
    if (
      businessRequest &&
      !takesWeddingOrToi(me.eventFormats) &&
      others.every((o) => takesWeddingOrToi(o.eventFormats))
    ) {
      add(
        `Ведёт только ${me.eventFormats.join(', ')}, без свадеб`,
        'format',
        2,
      );
    }

    // 3. Самый узкий набор форматов.
    if (
      me.eventFormats.length <= 2 &&
      me.eventFormats.includes(req.eventType) &&
      others.every((o) => me.eventFormats.length < o.eventFormats.length)
    ) {
      add(
        `${req.eventType} — основной профиль: берёт только ${me.eventFormats.join(', ')}`,
        'format',
        3,
      );
    }

    // 4–5. Отличия по часам.
    const limitedOthers = others
      .map((o) => o.maxHours)
      .filter((hours): hours is number => hours !== null);
    if (
      me.maxHours !== null &&
      limitedOthers.length === others.length &&
      limitedOthers.length > 0 &&
      limitedOthers.every((hours) => me.maxHours! > hours)
    ) {
      const nearestLimit = Math.max(...limitedOthers);
      add(
        `Может быть на площадке до ${me.maxHours} ч — на ${me.maxHours - nearestLimit} ч дольше остальных`,
        'hours',
        4,
      );
    }
    if (
      me.maxHours === null &&
      others.length > 0 &&
      others.every((o) => o.maxHours !== null)
    ) {
      add('Работа не привязана к часам на площадке', 'hours', 5);
    }

    // 6–7. Отличия от бюджета.
    const uniquelyCheapest =
      others.length > 0 &&
      others.every((o) => me.priceFromKzt < o.priceFromKzt);
    if (uniquelyCheapest && me.priceFromKzt <= req.budgetKzt * 0.6) {
      const remaining = req.budgetKzt - me.priceFromKzt;
      if (me.priceFromKzt <= req.budgetKzt * 0.5) {
        add(
          `Вдвое дешевле бюджета — остаётся ${money(remaining)}`,
          'budget',
          6,
        );
      } else {
        const percent = Math.round((1 - me.priceFromKzt / req.budgetKzt) * 100);
        add(
          `На ${percent}% дешевле бюджета — остаётся ${money(remaining)}`,
          'budget',
          6,
        );
      }
    }
    if (me.priceFromKzt === req.budgetKzt) {
      add('Цена ровно в ваш бюджет', 'budget', 7);
    }

    // 8. Уникальные сигналы из обогащения.
    for (const signal of me.enrichment?.signals ?? []) {
      if (
        others.every((o) => !(o.enrichment?.signals ?? []).includes(signal))
      ) {
        add(`${signal} — со слов подрядчика`, 'signal', 8);
      }
    }

    // 9. Позиция по цене в топе есть всегда.
    const byPrice = [me, ...others].sort(
      (a, b) =>
        a.priceFromKzt - b.priceFromKzt || a.anonName.localeCompare(b.anonName),
    );
    const pricePosition = byPrice.indexOf(me);
    if (pricePosition === 0) {
      add('Самый доступный из троих', 'budget', 9);
    } else if (pricePosition === byPrice.length - 1) {
      add('Самый дорогой из троих, но в бюджете', 'budget', 9);
    } else {
      const pricier = byPrice[pricePosition + 1];
      add(
        `Средний по цене: на ${money(pricier.priceFromKzt - me.priceFromKzt)} дешевле ${pricier.anonName}`,
        'budget',
        9,
      );
    }

    // 10. Число языков — безусловный fallback.
    add(
      `Работает на ${me.languages.length} языках: ${me.languages.join(', ')}`,
      'language',
      10,
    );

    return out.sort((a, b) => a.priority - b.priority);
  }

  private materializeFacts(
    keys: string[],
    c: {
      priceFromKzt: number;
      languages: string[];
      eventFormats: string[];
      maxHours: number | null;
    },
    req: MatchRequestDto,
  ): CardFact[] {
    const facts: CardFact[] = [];
    const uniq = new Set(
      keys.filter((k): k is FactKey =>
        [
          'budget',
          'format',
          'language',
          'hours',
          'date',
          'signal',
          'description',
        ].includes(k),
      ) as FactKey[],
    );
    uniq.add('date');

    for (const k of uniq) {
      switch (k) {
        case 'budget':
          facts.push({
            key: 'budget',
            label: `цена от ${c.priceFromKzt.toLocaleString('ru-RU')} ₸ ≤ бюджета ${req.budgetKzt.toLocaleString('ru-RU')} ₸`,
            verified: c.priceFromKzt <= req.budgetKzt,
          });
          break;
        case 'format':
          facts.push({
            key: 'format',
            label: `«${req.eventType}» в перечне форматов`,
            verified: c.eventFormats.includes(req.eventType),
          });
          break;
        case 'language':
          facts.push({
            key: 'language',
            label: req.language
              ? `работает на «${req.language}»`
              : `работает на ${c.languages.length} языках: ${c.languages.join(', ')}`,
            verified: req.language ? c.languages.includes(req.language) : true,
          });
          break;
        case 'hours':
          facts.push({
            key: 'hours',
            label:
              c.maxHours === null
                ? 'работа не привязана к часам на площадке'
                : `берёт до ${c.maxHours} ч${req.durationHours ? ` ≥ ${req.durationHours} ч` : ''}`,
            verified: req.durationHours
              ? c.maxHours === null || c.maxHours >= req.durationHours
              : true,
          });
          break;
        case 'date':
          facts.push({
            key: 'date',
            label: `Свободен ${humanDate(req.date)}`,
            verified: true,
          });
          break;
        case 'signal':
        case 'description':
          // Эти факты приходят из enrichment/описания и по построению
          // не могут быть проверены таблично — помечаем как «со слов».
          facts.push({
            key: k,
            label: 'из описания подрядчика',
            verified: false,
          });
          break;
      }
    }

    return facts;
  }
}

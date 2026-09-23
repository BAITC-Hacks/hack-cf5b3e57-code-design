import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { LLM_CLIENT, LlmClient } from './llm/llm-client';
import { CardFact, FactKey, MatchCard } from './types';

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
      const differentiators = this.diff(c, others);

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
          differentiators,
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
          this.logger.warn(`cache write failed for ${c.id}: ${(e as Error).message}`);
        }
      }

      cards.push({
        id: c.id,
        anonName: c.anonName,
        // Отдаём первую подходящую категорию (обычно у подрядчика одна ключевая).
        category: c.categories[0],
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
      priceFromKzt: number;
      languages: string[];
      maxHours: number | null;
      enrichment: { signals: string[]; specialization: string | null } | null;
    },
    others: {
      priceFromKzt: number;
      languages: string[];
      maxHours: number | null;
      enrichment: { signals: string[]; specialization: string | null } | null;
    }[],
  ): string[] {
    const out: string[] = [];

    if (others.length > 0 && others.every((o) => me.priceFromKzt < o.priceFromKzt)) {
      out.push('самая низкая цена в подборке');
    }

    const myLangs = new Set(me.languages);
    for (const l of ['казахский', 'английский']) {
      if (myLangs.has(l) && others.every((o) => !o.languages.includes(l))) {
        out.push(`единственный, кто работает на «${l}»`);
      }
    }

    if (me.maxHours === null && others.some((o) => o.maxHours !== null)) {
      out.push('нет ограничения по часам');
    }

    const mySignals = new Set(me.enrichment?.signals ?? []);
    for (const s of mySignals) {
      if (others.every((o) => !(o.enrichment?.signals ?? []).includes(s))) {
        out.push(s);
      }
    }

    if (me.enrichment?.specialization && others.every((o) => o.enrichment?.specialization !== me.enrichment?.specialization)) {
      out.push(`специализация: ${me.enrichment.specialization}`);
    }

    return out.slice(0, 3);
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
    const uniq = new Set(keys.filter((k): k is FactKey =>
      ['budget', 'format', 'language', 'hours', 'signal', 'description'].includes(k),
    ) as FactKey[]);

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
          if (req.language) {
            facts.push({
              key: 'language',
              label: `работает на «${req.language}»`,
              verified: c.languages.includes(req.language),
            });
          }
          break;
        case 'hours':
          if (req.durationHours) {
            const ok = c.maxHours === null || c.maxHours >= req.durationHours;
            facts.push({
              key: 'hours',
              label: c.maxHours === null
                ? 'длительность не ограничена'
                : `берёт до ${c.maxHours} ч ≥ ${req.durationHours} ч`,
              verified: ok,
            });
          }
          break;
        case 'signal':
        case 'description':
          // Эти факты приходят из enrichment/описания и по построению
          // не могут быть проверены таблично — помечаем как «со слов».
          facts.push({ key: k, label: 'из описания подрядчика', verified: false });
          break;
      }
    }

    return facts;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { eventAcc, humanDate, languageLoc } from './copy/nouns';
import { MatchRequestDto } from './dto/match-request.dto';
import { FilterResult, FunnelStep } from './types';

/**
 * Детерминированный фильтр: город → категория → дата → формат → бюджет → язык → часы.
 * Возвращает id прошедших + пошаговую воронку с причинами отсева.
 * Порядок шагов важен: он определяет, какую причину показать в UI/summary.
 */
@Injectable()
export class FilterService {
  constructor(private readonly prisma: PrismaService) {}

  async run(req: MatchRequestDto): Promise<FilterResult> {
    const all = await this.prisma.contractor.findMany({
      select: {
        id: true,
        city: true,
        categories: true,
        eventFormats: true,
        languages: true,
        priceFromKzt: true,
        busyDates: true,
        maxHours: true,
      },
    });

    let pool = all.map((c) => c.id);
    const total = pool.length;
    const funnel: FunnelStep[] = [];
    const byId = new Map(all.map((c) => [c.id, c]));

    const step = (
      name: FunnelStep['step'],
      keep: (id: string) => boolean,
      reason: string,
    ) => {
      const before = pool.length;
      pool = pool.filter(keep);
      funnel.push({
        step: name,
        before,
        after: pool.length,
        removedReason: reason,
      });
    };

    step('city', (id) => byId.get(id)!.city === req.city, 'в другом городе');
    step(
      'category',
      (id) => byId.get(id)!.categories.includes(req.category),
      'другая категория',
    );
    step(
      'date',
      (id) => !byId.get(id)!.busyDates.includes(req.date),
      `занят ${humanDate(req.date)}`,
    );
    step(
      'format',
      (id) => byId.get(id)!.eventFormats.includes(req.eventType),
      `не берёт ${eventAcc(req.eventType)}`,
    );
    step(
      'budget',
      (id) => byId.get(id)!.priceFromKzt <= req.budgetKzt,
      'дороже бюджета',
    );

    if (req.language) {
      step(
        'language',
        (id) => byId.get(id)!.languages.includes(req.language!),
        `не работает на ${languageLoc(req.language)}`,
      );
    }

    if (req.durationHours) {
      step(
        'hours',
        (id) => {
          const h = byId.get(id)!.maxHours;
          return h === null || h >= req.durationHours!;
        },
        `меньше ${req.durationHours} ч на площадке`,
      );
    }

    return { survivors: pool, funnel, totalBeforeAny: total };
  }
}

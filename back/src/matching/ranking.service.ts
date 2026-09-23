import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  criteriaFor,
  hasConcreteProfileSignal,
  mentionsRequestedEvent,
} from './criteria';
import { MatchRequestDto } from './dto/match-request.dto';

/**
 * Детерминированное ранжирование. Порядок факторов и веса зафиксированы,
 * ничьи ломаются по id — тот же вход даёт тот же порядок при каждом запуске.
 */
@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async rank(ids: string[], req: MatchRequestDto): Promise<string[]> {
    if (ids.length <= 1) return [...ids];

    const rows = await this.prisma.contractor.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        priceFromKzt: true,
        languages: true,
        maxHours: true,
        eventFormats: true,
        description: true,
      },
    });

    const criteria = criteriaFor(req);
    const scored = rows.map((c) => {
      const budgetHeadroom =
        Math.max(0, req.budgetKzt - c.priceFromKzt) / req.budgetKzt;
      const formatFocus = 1 / Math.max(1, c.eventFormats.length);
      const languageFit = req.language
        ? Number(c.languages.includes(req.language))
        : Math.min(1, c.languages.length / 3);
      // A missing hours limit is unknown, not proof of unlimited availability.
      const hoursFit = c.maxHours === null
        ? 0.5
        : req.durationHours
          ? Math.min(1, Math.max(0, (c.maxHours - req.durationHours) / 8))
          : Math.min(1, c.maxHours / 12);
      const descriptionFit = mentionsRequestedEvent(c.description, req.eventType)
        ? 1
        : hasConcreteProfileSignal(c.description) ? 0.5 : 0;
      const factors = {
        budget: budgetHeadroom,
        format: formatFocus,
        language: languageFit,
        hours: hoursFit,
        description: descriptionFit,
      };
      // The three dimensions displayed to the customer are the dimensions
      // that control the ranking. Price and format remain small tie-breakers.
      const score = criteria.reduce(
        (total, criterion, index) =>
          total + (3 - index) * factors[criterion.key],
        0.25 * budgetHeadroom + 0.25 * formatFocus,
      );

      return { id: c.id, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

    return scored.map((s) => s.id);
  }
}

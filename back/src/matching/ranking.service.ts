import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
      },
    });

    const scored = rows.map((c) => {
      let score = 0;

      // 1. Запас по бюджету: чем ниже цена «от» к бюджету — тем лучше, но
      // экстремально дешёвый (демпинг) не должен обгонять обычного за счёт
      // одного этого фактора → нормируем в [0..1] и берём с весом 3.
      const budgetHeadroom =
        Math.max(0, req.budgetKzt - c.priceFromKzt) / req.budgetKzt;
      score += 3 * budgetHeadroom;

      // 2. Явное совпадение по языку (когда язык задан): +2.
      if (req.language && c.languages.includes(req.language)) score += 2;

      // 3. Формат в event_formats — уже гарантирован фильтром, но подрядчик,
      // у которого этот формат один из немногих (специализация), — приоритетнее.
      if (c.eventFormats.includes(req.eventType)) {
        score += 1;
        if (c.eventFormats.length <= 2) score += 0.5;
      }

      // 4. Запас по часам, если задана длительность.
      if (req.durationHours && c.maxHours !== null) {
        const headroom = (c.maxHours - req.durationHours) / req.durationHours;
        score += Math.min(1, Math.max(0, headroom));
      }

      return { id: c.id, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

    return scored.map((s) => s.id);
  }
}

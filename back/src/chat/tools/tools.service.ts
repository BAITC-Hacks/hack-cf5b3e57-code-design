import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchRequestDto } from '../../matching/dto/match-request.dto';
import { MatchingService } from '../../matching/matching.service';
import type { MatchResponse } from '../../matching/types';
import { cityLoc, money } from '../../matching/copy/nouns';
import { PrismaService } from '../../prisma/prisma.service';

export type ChatToolName =
  'search_contractors' | 'estimate_bundle_minimum' | 'build_event_bundle';

const BUDGET_SHARES: Record<string, Record<string, number>> = {
  свадьба: {
    'Банкетный зал': 0.4,
    Ведущий: 0.15,
    Декоратор: 0.15,
    Фотограф: 0.05,
    Видеограф: 0.05,
    Флорист: 0.05,
    'Ведущий церемонии': 0.05,
    'Лайв-бэнд': 0.1,
  },
  той: {
    'Банкетный зал': 0.45,
    Ведущий: 0.15,
    'Национальный ансамбль': 0.15,
    Декоратор: 0.1,
    Флорист: 0.05,
    'Танцевальный коллектив': 0.1,
  },
  корпоратив: {
    'Банкетный зал': 0.4,
    Ведущий: 0.15,
    Фотограф: 0.1,
    'Лайв-бэнд': 0.15,
    Видеограф: 0.1,
    'Шоу-программа': 0.1,
  },
  конференция: {
    'Банкетный зал': 0.5,
    Ведущий: 0.2,
    Фотограф: 0.15,
    Видеограф: 0.15,
  },
  юбилей: {
    'Банкетный зал': 0.4,
    Ведущий: 0.2,
    Фотограф: 0.1,
    'Лайв-бэнд': 0.1,
    Декоратор: 0.1,
    Флорист: 0.1,
  },
  'день рождения': {
    'Банкетный зал': 0.35,
    Ведущий: 0.2,
    Фотограф: 0.1,
    'Лайв-бэнд': 0.1,
    Декоратор: 0.15,
    Флорист: 0.1,
  },
};

interface SearchContractorsArgs {
  city: string;
  date: string;
  eventType: string;
  category: string;
  budgetKzt: number;
  durationHours?: number;
  language?: string;
  locale?: 'ru' | 'kk' | 'en';
}

interface BuildEventBundleArgs {
  city: string;
  date: string;
  eventType: string;
  totalBudgetKzt: number;
  requiredCategories: string[];
  recommendedCategories?: string[];
  language?: string;
  locale?: 'ru' | 'kk' | 'en';
}

interface EstimateBundleMinimumArgs {
  city: string;
  date?: string;
  eventType: string;
  requiredCategories: string[];
  language?: string;
}

export interface BundleMinimumEstimate {
  totalMinKzt: number;
  totalMedianKzt: number;
  breakdown: {
    category: string;
    minKzt: number;
    medianKzt: number;
    count: number;
  }[];
}

export interface BundleItem {
  category: string;
  allocatedBudgetKzt: number;
  match: MatchResponse;
}

export interface EventBundle {
  city: string;
  date: string;
  eventType: string;
  totalBudgetKzt: number;
  required: BundleItem[];
  recommended: BundleItem[];
  summary: string;
}

@Injectable()
export class ToolsService {
  constructor(
    private readonly matching: MatchingService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    name: ChatToolName,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    if (name === 'search_contractors') {
      return this.searchContractors(this.asSearchArgs(args));
    }
    if (name === 'estimate_bundle_minimum') {
      return this.estimateBundleMinimum(this.asEstimateArgs(args));
    }
    if (name === 'build_event_bundle') {
      return this.buildEventBundle(this.asBundleArgs(args));
    }
    throw new BadRequestException(`Unknown chat tool: ${String(name)}`);
  }

  async searchContractors(args: SearchContractorsArgs): Promise<MatchResponse> {
    return this.matching.run(this.toMatchRequest(args));
  }

  async estimateBundleMinimum(
    args: EstimateBundleMinimumArgs,
  ): Promise<BundleMinimumEstimate> {
    const categories = this.uniqueCategories(args.requiredCategories);
    if (categories.length === 0) {
      throw new BadRequestException('At least one required category is needed');
    }
    const breakdown = await Promise.all(
      categories.map(async (category) => {
        const prices = await this.prisma.contractor.findMany({
          where: {
            city: args.city,
            categories: { has: category },
            eventFormats: { has: args.eventType },
            ...(args.date ? { NOT: { busyDates: { has: args.date } } } : {}),
            ...(args.language
              ? { languages: { has: args.language.trim().toLowerCase() } }
              : {}),
          },
          select: { priceFromKzt: true },
          orderBy: { priceFromKzt: 'asc' },
        });
        const count = prices.length;
        const minKzt = prices[0]?.priceFromKzt ?? 0;
        const medianKzt = count
          ? Math.ceil(
              (prices[Math.floor((count - 1) / 2)].priceFromKzt +
                prices[Math.floor(count / 2)].priceFromKzt) /
                2,
            )
          : 0;
        return { category, minKzt, medianKzt, count };
      }),
    );

    return {
      totalMinKzt: breakdown.reduce((total, item) => total + item.minKzt, 0),
      totalMedianKzt: breakdown.reduce(
        (total, item) => total + item.medianKzt,
        0,
      ),
      breakdown,
    };
  }

  async buildEventBundle(args: BuildEventBundleArgs): Promise<EventBundle> {
    const requiredCategories = this.uniqueCategories(args.requiredCategories);
    const requiredSet = new Set(requiredCategories);
    const recommendedCategories = this.uniqueCategories(
      args.recommendedCategories ?? [],
    ).filter((category) => !requiredSet.has(category));
    const estimate = await this.estimateBundleMinimum({
      city: args.city,
      date: args.date,
      eventType: args.eventType,
      requiredCategories,
      language: args.language,
    });
    const totalBudgetKzt = Math.floor(args.totalBudgetKzt);

    if (estimate.totalMinKzt > totalBudgetKzt) {
      return {
        city: args.city,
        date: args.date,
        eventType: args.eventType,
        totalBudgetKzt,
        required: [],
        recommended: [],
        summary: `На полный пакет ${this.eventGenitive(args.eventType)} ${cityLoc(args.city)} нужен минимум ${money(estimate.totalMinKzt)}, ваш бюджет ${money(totalBudgetKzt)}. Уберите категорию или поднимите бюджет.`,
      };
    }

    const shares = BUDGET_SHARES[args.eventType] ?? {};
    const requiredWeights = this.categoryWeights(requiredCategories, shares);
    const requiredShare = requiredWeights.reduce(
      (sum, weight) => sum + weight,
      0,
    );
    const recommendedShare = recommendedCategories.length
      ? Math.min(Math.max(1 - requiredShare, 0), 0.3)
      : 0;
    const recommendedBudget = Math.min(
      Math.floor(totalBudgetKzt * recommendedShare),
      totalBudgetKzt - estimate.totalMinKzt,
    );
    const requiredBudget = totalBudgetKzt - recommendedBudget;
    const requiredAllocations = this.allocateBudget(
      requiredBudget,
      requiredWeights,
      estimate.breakdown.map((item) => item.minKzt),
    );
    const recommendedMinimums = await Promise.all(
      recommendedCategories.map(async (category) => {
        if (recommendedBudget === 0) return 0;
        const available = await this.prisma.contractor.findMany({
          where: {
            city: args.city,
            categories: { has: category },
            eventFormats: { has: args.eventType },
            NOT: { busyDates: { has: args.date } },
            ...(args.language
              ? { languages: { has: args.language.trim().toLowerCase() } }
              : {}),
          },
          select: { priceFromKzt: true },
          orderBy: { priceFromKzt: 'asc' },
          take: 1,
        });
        return available[0]?.priceFromKzt ?? 0;
      }),
    );
    const affordableRecommendedMinimums =
      recommendedMinimums.reduce((total, price) => total + price, 0) <=
      recommendedBudget
        ? recommendedMinimums
        : undefined;
    const recommendedAllocations = this.allocateBudget(
      recommendedBudget,
      this.categoryWeights(recommendedCategories, shares),
      affordableRecommendedMinimums,
    );

    const makeItem = async (
      category: string,
      allocatedBudgetKzt: number,
    ): Promise<BundleItem> => ({
      category,
      allocatedBudgetKzt,
      match: await this.matching.run(
        this.toMatchRequest({
          city: args.city,
          date: args.date,
          eventType: args.eventType,
          category,
          budgetKzt: allocatedBudgetKzt,
          language: args.language,
          locale: args.locale,
        }),
      ),
    });

    const [required, recommended] = await Promise.all([
      Promise.all(
        requiredCategories.map((category, index) =>
          makeItem(category, requiredAllocations[index]),
        ),
      ),
      Promise.all(
        recommendedCategories.map((category, index) =>
          recommendedAllocations[index] > 0
            ? makeItem(category, recommendedAllocations[index])
            : Promise.resolve({
                category,
                allocatedBudgetKzt: 0,
                match: {
                  outcome: 'all_filtered_out' as const,
                  criteria: [],
                  cards: [],
                  funnel: [],
                  summary: 'На дополнительную категорию не осталось бюджета.',
                },
              }),
        ),
      ),
    ]);
    return {
      city: args.city,
      date: args.date,
      eventType: args.eventType,
      totalBudgetKzt,
      required,
      recommended,
      summary: this.bundleSummary(args.city, required, recommended),
    };
  }

  private bundleSummary(
    city: string,
    required: BundleItem[],
    recommended: BundleItem[],
  ): string {
    const foundRequired = required.filter(
      (item) => item.match.cards.length > 0,
    );
    const foundRecommended = recommended.filter(
      (item) => item.match.cards.length > 0,
    );
    const missing = [...required, ...recommended].filter(
      (item) => item.match.cards.length === 0,
    );
    const coverage = `Найдены варианты для ${foundRequired.length} из ${required.length} обязательных и ${foundRecommended.length} из ${recommended.length} дополнительных категорий.`;
    if (missing.length === 0) return `${coverage} Детали — в карточках ниже.`;

    const reasons = missing.map((item) => {
      const category = item.category;
      if (item.allocatedBudgetKzt === 0) {
        return `${category} — на категорию не осталось бюджета`;
      }
      if (item.match.outcome === 'no_category_in_city') {
        return `${category} — нет в каталоге города`;
      }
      const steps = item.match.funnel;
      const firstEmpty = steps.find(
        (step) => step.before > 0 && step.after === 0,
      );
      const reason: Record<string, string> = {
        date: 'заняты на эту дату',
        format: 'не берут этот формат',
        budget: 'дороже выделенного бюджета',
        language: 'не работают на нужном языке',
        hours: 'не подходят по длительности',
      };
      return `${category} — ${reason[firstEmpty?.step ?? ''] ?? 'не подошли по условиям'}`;
    });
    const missingRequired = required.some(
      (item) => item.match.cards.length === 0,
    );
    const next = missingRequired
      ? `Чтобы закрыть обязательные категории, рассмотрите другой город или измените дату и состав пакета.`
      : `Для дополнительных категорий можно изменить дату или условия.`;
    return `${coverage} Не найдены ${cityLoc(city)}: ${reasons.join('; ')}. ${next}`;
  }

  private categoryWeights(
    categories: string[],
    shares: Record<string, number>,
  ): number[] {
    if (categories.length === 0) return [];
    const knownSum = categories.reduce(
      (sum, category) => sum + (shares[category] ?? 0),
      0,
    );
    const unknownCount = categories.filter(
      (category) => shares[category] === undefined,
    ).length;
    const remainingShare = Math.max(1 - knownSum, 0);
    const fallback = unknownCount
      ? remainingShare > 0
        ? remainingShare / unknownCount
        : (knownSum || 1) / categories.length
      : 0;
    return categories.map((category) => shares[category] ?? fallback);
  }

  private allocateBudget(
    total: number,
    weights: number[],
    minimums: number[] = weights.map(() => 0),
  ): number[] {
    if (weights.length === 0) return [];

    const allocations = weights.map(() => 0);
    const pending = new Set(weights.map((_, index) => index));
    let remaining = total;

    while (pending.size > 0) {
      const totalWeight = [...pending].reduce(
        (sum, index) => sum + weights[index],
        0,
      );
      const belowMinimum = [...pending].filter(
        (index) => (remaining * weights[index]) / totalWeight < minimums[index],
      );
      if (belowMinimum.length === 0) break;

      for (const index of belowMinimum) {
        allocations[index] = minimums[index];
        remaining -= minimums[index];
        pending.delete(index);
      }
    }

    if (pending.size > 0) {
      const totalWeight = [...pending].reduce(
        (sum, index) => sum + weights[index],
        0,
      );
      const fractions = [...pending].map((index) => ({
        index,
        exact: (remaining * weights[index]) / totalWeight,
      }));
      for (const { index, exact } of fractions) {
        allocations[index] = Math.floor(exact);
      }
      let leftover = total - allocations.reduce((sum, value) => sum + value, 0);
      fractions.sort(
        (left, right) =>
          right.exact -
            Math.floor(right.exact) -
            (left.exact - Math.floor(left.exact)) || left.index - right.index,
      );
      for (const { index } of fractions) {
        if (leftover-- <= 0) break;
        allocations[index] += 1;
      }
    }

    return allocations;
  }

  private uniqueCategories(categories: string[]): string[] {
    return [
      ...new Set(categories.map((category) => category.trim()).filter(Boolean)),
    ];
  }

  private eventGenitive(eventType: string): string {
    const forms: Record<string, string> = {
      свадьба: 'свадьбы',
      той: 'тоя',
      корпоратив: 'корпоратива',
      конференция: 'конференции',
      юбилей: 'юбилея',
      'день рождения': 'дня рождения',
    };
    return forms[eventType] ?? eventType;
  }

  private toMatchRequest(args: SearchContractorsArgs): MatchRequestDto {
    return {
      city: args.city,
      date: args.date,
      eventType: args.eventType,
      category: args.category,
      budgetKzt: Math.max(1, Math.floor(args.budgetKzt)),
      durationHours: args.durationHours,
      language: args.language?.trim().toLowerCase(),
      locale: args.locale,
    };
  }

  private asSearchArgs(args: Record<string, unknown>): SearchContractorsArgs {
    return {
      city: this.stringArg(args, 'city'),
      date: this.stringArg(args, 'date'),
      eventType: this.stringArg(args, 'eventType'),
      category: this.stringArg(args, 'category'),
      budgetKzt: this.numberArg(args, 'budgetKzt'),
      durationHours:
        typeof args.durationHours === 'number' ? args.durationHours : undefined,
      language: typeof args.language === 'string' ? args.language : undefined,
      locale: this.localeArg(args),
    };
  }

  private asBundleArgs(args: Record<string, unknown>): BuildEventBundleArgs {
    return {
      city: this.stringArg(args, 'city'),
      date: this.stringArg(args, 'date'),
      eventType: this.stringArg(args, 'eventType'),
      totalBudgetKzt: this.numberArg(args, 'totalBudgetKzt'),
      requiredCategories: this.stringArrayArg(args, 'requiredCategories'),
      recommendedCategories: Array.isArray(args.recommendedCategories)
        ? args.recommendedCategories.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      language: typeof args.language === 'string' ? args.language : undefined,
      locale: this.localeArg(args),
    };
  }

  private asEstimateArgs(
    args: Record<string, unknown>,
  ): EstimateBundleMinimumArgs {
    return {
      city: this.stringArg(args, 'city'),
      date: typeof args.date === 'string' ? args.date : undefined,
      eventType: this.stringArg(args, 'eventType'),
      requiredCategories: this.stringArrayArg(args, 'requiredCategories'),
      language: typeof args.language === 'string' ? args.language : undefined,
    };
  }

  private stringArg(args: Record<string, unknown>, key: string): string {
    const value = args[key];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException(
        `Tool argument ${key} must be a non-empty string`,
      );
    }
    return value;
  }

  private numberArg(args: Record<string, unknown>, key: string): number {
    const value = args[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(
        `Tool argument ${key} must be a positive number`,
      );
    }
    return value;
  }

  private stringArrayArg(args: Record<string, unknown>, key: string): string[] {
    const value = args[key];
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== 'string')
    ) {
      throw new BadRequestException(
        `Tool argument ${key} must be a string array`,
      );
    }
    return value as string[];
  }

  private localeArg(
    args: Record<string, unknown>,
  ): 'ru' | 'kk' | 'en' | undefined {
    return args.locale === 'ru' || args.locale === 'kk' || args.locale === 'en'
      ? args.locale
      : undefined;
  }
}

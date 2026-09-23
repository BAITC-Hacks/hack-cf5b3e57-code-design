import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchRequestDto } from '../../matching/dto/match-request.dto';
import { MatchingService } from '../../matching/matching.service';
import type { MatchResponse } from '../../matching/types';

export type ChatToolName = 'search_contractors' | 'build_event_bundle';

interface SearchContractorsArgs {
  city: string;
  date: string;
  eventType: string;
  category: string;
  budgetKzt: number;
  durationHours?: number;
  language?: string;
}

interface BuildEventBundleArgs {
  city: string;
  date: string;
  eventType: string;
  totalBudgetKzt: number;
  requiredCategories: string[];
  recommendedCategories?: string[];
  language?: string;
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
  constructor(private readonly matching: MatchingService) {}

  async execute(
    name: ChatToolName,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    if (name === 'search_contractors') {
      return this.searchContractors(this.asSearchArgs(args));
    }
    if (name === 'build_event_bundle') {
      return this.buildEventBundle(this.asBundleArgs(args));
    }
    throw new BadRequestException(`Unknown chat tool: ${String(name)}`);
  }

  async searchContractors(args: SearchContractorsArgs): Promise<MatchResponse> {
    return this.matching.run(this.toMatchRequest(args));
  }

  async buildEventBundle(args: BuildEventBundleArgs): Promise<EventBundle> {
    const recommendedCategories = args.recommendedCategories ?? [];
    const requiredBudget = args.requiredCategories.length
      ? Math.floor((args.totalBudgetKzt * 0.7) / args.requiredCategories.length)
      : 0;
    const recommendedBudget = recommendedCategories.length
      ? Math.floor((args.totalBudgetKzt * 0.3) / recommendedCategories.length)
      : 0;

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
        }),
      ),
    });

    const [required, recommended] = await Promise.all([
      Promise.all(
        args.requiredCategories.map((category) =>
          makeItem(category, requiredBudget),
        ),
      ),
      Promise.all(
        recommendedCategories.map((category) =>
          makeItem(category, recommendedBudget),
        ),
      ),
    ]);
    const found = [...required, ...recommended].filter(
      (item) => item.match.cards.length > 0,
    ).length;
    const total = required.length + recommended.length;

    return {
      city: args.city,
      date: args.date,
      eventType: args.eventType,
      totalBudgetKzt: args.totalBudgetKzt,
      required,
      recommended,
      summary: `Найдены варианты для ${found} из ${total} категорий. Бюджет распределён: 70% на обязательные и 30% на рекомендуемые категории.`,
    };
  }

  private toMatchRequest(args: SearchContractorsArgs): MatchRequestDto {
    return {
      city: args.city,
      date: args.date,
      eventType: args.eventType,
      category: args.category,
      budgetKzt: Math.max(1, Math.floor(args.budgetKzt)),
      durationHours: args.durationHours,
      language: args.language,
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
}

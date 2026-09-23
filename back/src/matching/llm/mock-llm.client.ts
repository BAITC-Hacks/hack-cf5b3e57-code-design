import { Injectable } from '@nestjs/common';
import {
  CriteriaInput,
  ExplainInput,
  ExplainOutput,
  LlmClient,
} from './llm-client';
import type { Differentiator } from '../explainer.service';
import { money } from '../copy/nouns';

/**
 * MOCK-провайдер: работает без сети и ключа, детерминирован по построению.
 * Формирует объяснение из ФАКТОВ пайплайна — не пытается имитировать LLM,
 * а сжимает уже проверенные признаки в человеческую строку.
 */
@Injectable()
export class MockLlmClient implements LlmClient {
  async criteria(input: CriteriaInput): Promise<string[]> {
    const { request } = input;
    const c: string[] = [];
    c.push(`формат «${request.eventType}» в перечне подрядчика`);
    c.push(`свободен на ${request.date} и цена в бюджете`);
    if (request.language) c.push(`работает на «${request.language}»`);
    if (request.durationHours)
      c.push(`тянет минимум ${request.durationHours} ч`);
    return c.slice(0, 3);
  }

  async explain(input: ExplainInput): Promise<ExplainOutput> {
    const { candidate, request, differentiators } = input;
    const diffs = differentiators as unknown as Differentiator[];
    const first = diffs[0];
    const second = diffs[1];

    const sentence = (value: string): string => {
      const clean = value
        .trim()
        .replace(/;/g, ',')
        .replace(/[.!?]+$/g, '');
      return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}.`;
    };

    const fallback = `${money(candidate.priceFromKzt)} — в бюджете, остаётся ${money(request.budgetKzt - candidate.priceFromKzt)}`;
    const reason = [
      sentence(first.text),
      sentence(second?.text ?? fallback),
    ].join(' ');
    const factsUsed = [first.factKey, second?.factKey ?? 'budget'];

    return {
      reason,
      factsUsed: [...new Set(factsUsed)],
    };
  }

  async critic(): Promise<{
    ok: boolean;
    problems: { id: string; problem: string }[];
  }> {
    return { ok: true, problems: [] };
  }
}

import { Injectable } from '@nestjs/common';
import {
  CriteriaInput,
  ExplainInput,
  ExplainOutput,
  LlmClient,
} from './llm-client';

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
    if (request.durationHours) c.push(`тянет минимум ${request.durationHours} ч`);
    return c.slice(0, 3);
  }

  async explain(input: ExplainInput): Promise<ExplainOutput> {
    const { candidate, request, differentiators } = input;
    const facts: string[] = [];
    const parts: string[] = [];

    if (candidate.priceFromKzt <= request.budgetKzt) {
      const headroomPct = Math.round(
        ((request.budgetKzt - candidate.priceFromKzt) / request.budgetKzt) * 100,
      );
      parts.push(
        `цена от ${candidate.priceFromKzt.toLocaleString('ru-RU')} ₸ — в бюджете (запас ${headroomPct}%)`,
      );
      facts.push('budget');
    }

    if (request.language && candidate.languages.includes(request.language)) {
      parts.push(`ведёт на «${request.language}»`);
      facts.push('language');
    }

    if (candidate.eventFormats.includes(request.eventType)) {
      parts.push(`явно берёт формат «${request.eventType}»`);
      facts.push('format');
    }

    if (
      request.durationHours &&
      (candidate.maxHours === null || candidate.maxHours >= request.durationHours)
    ) {
      parts.push(
        candidate.maxHours === null
          ? 'длительность не ограничена'
          : `берёт до ${candidate.maxHours} ч`,
      );
      facts.push('hours');
    }

    if (differentiators.length > 0) {
      parts.push(`отличается от других в подборке: ${differentiators.slice(0, 2).join(', ')}`);
      facts.push('signal');
    }

    const reason = parts.slice(0, 3).join('; ') + '.';
    return { reason, factsUsed: facts };
  }

  async critic(): Promise<{ ok: boolean; problems: { id: string; problem: string }[] }> {
    return { ok: true, problems: [] };
  }
}

import { Injectable } from '@nestjs/common';
import {
  CriteriaInput,
  ExplainInput,
  ExplainOutput,
  LlmClient,
} from './llm-client';
import type { CardFact } from '../types';

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
    return { selectedId: input.options[0]?.id ?? '' };
  }

  async critic(
    reasons: { id: string; reason: string; facts: CardFact[] }[],
  ): Promise<{
    ok: boolean;
    problems: { id: string; problem: string }[];
  }> {
    const seen = new Set<string>();
    const problems: { id: string; problem: string }[] = [];
    for (const item of reasons) {
      const text = item.reason.toLocaleLowerCase('ru-RU');
      if (seen.has(text)) problems.push({ id: item.id, problem: 'interchangeable' });
      seen.add(text);
      if (!item.facts.some((fact) => fact.verified)) {
        problems.push({ id: item.id, problem: 'no_verified_facts' });
      }
    }
    return { ok: problems.length === 0, problems };
  }
}

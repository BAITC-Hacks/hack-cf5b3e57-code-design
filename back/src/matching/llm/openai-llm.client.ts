import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  CriteriaInput,
  ExplainInput,
  ExplainOutput,
  LlmClient,
} from './llm-client';
import { MockLlmClient } from './mock-llm.client';
import type { CardFact } from '../types';

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * OpenAI-клиент для этапов пайплайна (criteria / explain / critic).
 * Один провайдер — на объяснения формы `/match` и на чат-ассистента.
 * При таймауте или ошибке падает на MockLlmClient, чтобы пайплайн всегда
 * доехал до `done` — критично для DoD хакатона.
 */
@Injectable()
export class OpenAiLlmClient implements LlmClient {
  private readonly logger = new Logger(OpenAiLlmClient.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly fallback = new MockLlmClient();

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    // There can be two critic passes and one explanation retry. A short,
    // non-retrying call preserves the end-to-end demo latency budget.
    this.client = new OpenAI({ apiKey, timeout: 1_800, maxRetries: 0 });
    this.model = model;
  }

  async criteria(input: CriteriaInput): Promise<string[]> {
    const sys = `Ты помощник по подбору event-подрядчиков. Верни 2–3 коротких критерия ("на что смотреть"), под этот тип подрядчика и мероприятие. По-русски, 3–6 слов на пункт, без общих фраз и маркеров.
Отдавай ТОЛЬКО JSON: {"criteria":["...","..."]}`;
    try {
      const raw = await this.chatJson(sys, JSON.stringify(input));
      const arr = Array.isArray(raw?.criteria)
        ? (raw.criteria as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      if (arr.length === 0) throw new Error('empty criteria');
      return arr.slice(0, 3);
    } catch (e) {
      this.logger.warn(`criteria fallback: ${(e as Error).message}`);
      return this.fallback.criteria(input);
    }
  }

  async explain(input: ExplainInput): Promise<ExplainOutput> {
    const sys = `Выбери ОДИН наиболее убедительный и индивидуальный факт для первого предложения карточки. Второе предложение про дату и цену добавит сервер. Ты можешь только выбрать id из options, не писать свой текст. Приоритет: критерии заказа, отличие от других показанных, конкретика. Если есть feedback, не повторяй проблемный вариант. Верни только JSON {"selectedId":"id"}.`;
    const user = JSON.stringify({
      request: input.request,
      criteria: input.criteria,
      candidate: {
        id: input.candidate.id,
        description: input.candidate.description.slice(0, 500),
      },
      options: input.options,
      feedback: input.feedback ?? [],
    });
    try {
      const raw = await this.chatJson(sys, user);
      const selectedId = typeof raw?.selectedId === 'string' ? raw.selectedId : '';
      if (!input.options.some((option) => option.id === selectedId)) {
        throw new Error('unsupported evidence selection');
      }
      return { selectedId };
    } catch (e) {
      this.logger.warn(`explain fallback for ${input.candidate.id}: ${(e as Error).message}`);
      return this.fallback.explain(input);
    }
  }

  async critic(
    reasons: { id: string; reason: string; facts: CardFact[] }[],
  ): Promise<{ ok: boolean; problems: { id: string; problem: string }[] }> {
    if (reasons.length < 2) return { ok: true, problems: [] };
    const sys = `Ты придирчивый редактор. Сравни объяснения без имён. Найди шаблонные или взаимозаменяемые первые предложения, отсутствие конкретного факта, неподтверждённые утверждения. Факты с verified=false — только слова из анкеты, они должны быть явно атрибутированы. Верни ТОЛЬКО JSON: {"ok":boolean,"problems":[{"id":"...","problem":"generic|interchangeable|unsupported|no_facts"}]}`;
    try {
      const raw = await this.chatJson(sys, JSON.stringify(reasons));
      const ok = raw?.ok === true;
      const problems = Array.isArray(raw?.problems)
        ? (raw.problems as unknown[]).flatMap((p): { id: string; problem: string }[] => {
            if (typeof p !== 'object' || p === null) return [];
            const rec = p as Record<string, unknown>;
            const id = typeof rec.id === 'string' ? rec.id : null;
            const problem = typeof rec.problem === 'string' ? rec.problem : null;
            return id && problem ? [{ id, problem }] : [];
          })
        : [];
      return { ok, problems };
    } catch (e) {
      this.logger.warn(`critic fallback: ${(e as Error).message}`);
      return this.fallback.critic(reasons);
    }
  }

  private async chatJson(sys: string, user: string): Promise<Record<string, unknown>> {
    // gpt-5 не даёт менять temperature (только default 1). Не проставляем
    // явно — на gpt-4o-mini и т.п. это тоже нормально.
    const res = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('empty completion');
    return JSON.parse(text) as Record<string, unknown>;
  }

}

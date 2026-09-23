import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  CriteriaInput,
  ExplainInput,
  ExplainOutput,
  LlmClient,
} from './llm-client';
import { MockLlmClient } from './mock-llm.client';

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct';

/**
 * Реальный клиент через NVIDIA NIM (OpenAI-совместимый endpoint).
 * Единственная точка сетевых вызовов: короткий таймаут, один ретрай, а при
 * любой ошибке — падение обратно на MOCK, чтобы пайплайн доехал до `done`.
 */
@Injectable()
export class NvidiaLlmClient implements LlmClient {
  private readonly logger = new Logger(NvidiaLlmClient.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly fallback = new MockLlmClient();

  constructor(
    apiKey: string,
    baseURL = DEFAULT_BASE_URL,
    model = DEFAULT_MODEL,
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: 12_000,
      maxRetries: 1,
    });
    this.model = model;
  }

  async criteria(input: CriteriaInput): Promise<string[]> {
    const language = this.responseLanguage(input.request.locale);
    const sys = `Ты помощник по подбору event-подрядчиков. На вход — параметры запроса.
Верни 2–3 коротких КРИТЕРИЯ, на что смотреть при выборе именно этого типа подрядчика.
Пиши на языке: ${language}. Каждый критерий 3–6 слов, без общих фраз, без ведущих цифр/маркеров.
Отдавай ТОЛЬКО JSON вида {"criteria":["...","..."]}`;
    const user = JSON.stringify(input);
    try {
      const raw = await this.chatJson(sys, user);
      const arr = Array.isArray(raw?.criteria)
        ? (raw.criteria as unknown[]).filter(
            (x): x is string => typeof x === 'string',
          )
        : [];
      if (arr.length === 0) throw new Error('empty criteria');
      return arr.slice(0, 3);
    } catch (e) {
      this.logger.warn(`criteria fallback: ${(e as Error).message}`);
      return this.fallback.criteria(input);
    }
  }

  async explain(input: ExplainInput): Promise<ExplainOutput> {
    const facts = this.factsSummary(input);
    const language = this.responseLanguage(input.request.locale);
    const sys = `Ты объясняешь заказчику, ПОЧЕМУ именно этот подрядчик попал в подборку.
Правила:
- Используй ТОЛЬКО факты из блока «Проверенные факты». Не выдумывай цифры, языки, форматы.
- Если сослался на "со слов подрядчика" — так и напиши, серым тоном ("из описания подрядчика: ...").
- 1–2 предложения, максимум 240 знаков.
- Обязательно используй ≥2 разных факта.
- Никаких общих фраз "отличный выбор", "прекрасно подойдёт", "лучший для вашего мероприятия".
- Если есть «отличается от других: ...» — упомяни одно отличие.
- Пиши на языке: ${language}.
- Отдавай ТОЛЬКО JSON: {"reason":"...","factsUsed":["budget","language","format","hours","signal","description"]}. Оставь в factsUsed только реально использованные ключи.`;
    const user = `Проверенные факты:\n${facts}\n\nЗапрос:\n${JSON.stringify(input.request)}\n\nОтличается от других:\n${input.differentiators.join('; ') || '—'}\n\nОписание подрядчика (со слов):\n${input.candidate.description.slice(0, 800)}`;
    try {
      const raw = await this.chatJson(sys, user);
      const reason = typeof raw?.reason === 'string' ? raw.reason.trim() : '';
      const factsUsed = Array.isArray(raw?.factsUsed)
        ? (raw.factsUsed as unknown[]).filter(
            (x): x is string => typeof x === 'string',
          )
        : [];
      if (!reason) throw new Error('empty reason');
      return { reason, factsUsed };
    } catch (e) {
      this.logger.warn(
        `explain fallback for ${input.candidate.id}: ${(e as Error).message}`,
      );
      return this.fallback.explain(input);
    }
  }

  async critic(
    reasons: { id: string; reason: string }[],
  ): Promise<{ ok: boolean; problems: { id: string; problem: string }[] }> {
    if (reasons.length < 2) return { ok: true, problems: [] };
    const sys = `Ты придирчивый редактор. На вход — объяснения нескольких карточек для одного запроса.
Найди проблемы:
- общие фразы ("отличный выбор", "лучший", "прекрасно подойдёт", "идеально") — flag as "generic";
- взаимозаменяемость: если стереть имена, две карточки не различить — flag as "interchangeable" (укажи id обоих);
- отсутствие конкретики: нет ни одной цифры, языка, часа, формата — flag as "no_facts".
Отдавай ТОЛЬКО JSON: {"ok":boolean,"problems":[{"id":"...","problem":"..."}]}`;
    const user = JSON.stringify(reasons);
    try {
      const raw = await this.chatJson(sys, user);
      const ok = typeof raw?.ok === 'boolean' ? raw.ok : true;
      const problems = Array.isArray(raw?.problems)
        ? (raw.problems as unknown[]).flatMap(
            (p): { id: string; problem: string }[] => {
              if (typeof p !== 'object' || p === null) return [];
              const rec = p as Record<string, unknown>;
              const id = typeof rec.id === 'string' ? rec.id : null;
              const problem =
                typeof rec.problem === 'string' ? rec.problem : null;
              return id && problem ? [{ id, problem }] : [];
            },
          )
        : [];
      return { ok, problems };
    } catch (e) {
      this.logger.warn(`critic fallback: ${(e as Error).message}`);
      return { ok: true, problems: [] };
    }
  }

  private async chatJson(
    sys: string,
    user: string,
  ): Promise<Record<string, unknown>> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
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

  private factsSummary(input: ExplainInput): string {
    const { candidate, request } = input;
    const lines: string[] = [];
    lines.push(
      `- цена «от» ${candidate.priceFromKzt.toLocaleString('ru-RU')} ₸, бюджет заказчика ${request.budgetKzt.toLocaleString('ru-RU')} ₸`,
    );
    lines.push(`- языки подрядчика: ${candidate.languages.join(', ') || '—'}`);
    if (request.language)
      lines.push(`- заказчику важен язык: ${request.language}`);
    lines.push(
      `- берёт форматы: ${candidate.eventFormats.join(', ') || '—'}, запрошен: ${request.eventType}`,
    );
    lines.push(
      `- максимум на площадке: ${candidate.maxHours ?? 'не ограничено'} ч${request.durationHours ? `, нужно ${request.durationHours} ч` : ''}`,
    );
    if (candidate.specialization)
      lines.push(
        `- специализация (из офлайн-обогащения): ${candidate.specialization}`,
      );
    if (candidate.signals.length)
      lines.push(`- проверяемые признаки: ${candidate.signals.join(', ')}`);
    return lines.join('\n');
  }

  private responseLanguage(locale: 'ru' | 'kk' | 'en' | undefined): string {
    if (locale === 'kk') return 'казахский';
    if (locale === 'en') return 'английский';
    return 'русский';
  }
}

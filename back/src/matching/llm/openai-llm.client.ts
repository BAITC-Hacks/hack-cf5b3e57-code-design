import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  CriteriaInput,
  ExplainInput,
  ExplainOutput,
  LlmClient,
} from './llm-client';
import { MockLlmClient } from './mock-llm.client';

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
    this.client = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
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
    const facts = this.factsSummary(input);
    const sys = `Ты объясняешь заказчику, ПОЧЕМУ именно этот подрядчик попал в подборку.
Правила:
- Используй ТОЛЬКО факты из блока «Проверенные факты». Не выдумывай цифры, языки, форматы.
- 1–2 предложения, максимум 240 знаков.
- Обязательно используй ≥2 разных факта.
- Никаких общих фраз "отличный выбор", "прекрасно подойдёт", "лучший".
- Если есть «отличается от других: ...» — упомяни одно отличие.
- Если ссылаешься на описание — так и пиши: «из описания подрядчика: ...».
- Если в кандидате есть signals из Enrichment — используй ровно как в примере 3, с пометкой "со слов подрядчика". Не выдумывай signals.

Примеры:
1. {"reason":"Единственный из свободных 16 октября, кто ведёт на английском. Цена ровно в ваш бюджет.","factsUsed":["date","language","budget"]}
2. {"reason":"Ведёт только корпоративы, конференции и юбилеи, без свадеб. Вдвое дешевле бюджета — остаётся 500 000 ₸.","factsUsed":["format","budget"]}
3. {"reason":"Работа не привязана к часам на площадке. Единственная в тройке с сигналом \"работает с ивентами до 3000 человек\" (со слов подрядчика).","factsUsed":["hours","signal"]}

Отдавай ТОЛЬКО JSON: {"reason":"...","factsUsed":["budget","language","format","hours","signal","description"]}. Оставь только реально использованные ключи.`;
    const user = `Проверенные факты:\n${facts}\n\nЗапрос:\n${JSON.stringify(input.request)}\n\nОтличается от других в подборке:\n${input.differentiators.join('; ') || '—'}\n\nОписание подрядчика (со слов):\n${input.candidate.description.slice(0, 800)}`;
    try {
      const raw = await this.chatJson(sys, user);
      const reason = typeof raw?.reason === 'string' ? raw.reason.trim() : '';
      const factsUsed = Array.isArray(raw?.factsUsed)
        ? (raw.factsUsed as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      if (!reason) throw new Error('empty reason');
      return { reason, factsUsed };
    } catch (e) {
      this.logger.warn(`explain fallback for ${input.candidate.id}: ${(e as Error).message}`);
      return this.fallback.explain(input);
    }
  }

  async critic(
    reasons: { id: string; reason: string }[],
  ): Promise<{ ok: boolean; problems: { id: string; problem: string }[] }> {
    if (reasons.length < 2) return { ok: true, problems: [] };
    const sys = `Ты придирчивый редактор. На вход — объяснения нескольких карточек для одного запроса.
Найди проблемы:
- общие фразы ("отличный", "прекрасно", "лучший", "идеальный") → "generic";
- взаимозаменяемость (если стереть имена, две карточки не различить) → "interchangeable";
- нет ни одной цифры/языка/часа/формата → "no_facts".
Отдавай ТОЛЬКО JSON: {"ok":boolean,"problems":[{"id":"...","problem":"..."}]}`;
    try {
      const raw = await this.chatJson(sys, JSON.stringify(reasons));
      const ok = typeof raw?.ok === 'boolean' ? raw.ok : true;
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
      return { ok: true, problems: [] };
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

  private factsSummary(input: ExplainInput): string {
    const { candidate, request } = input;
    const lines: string[] = [];
    lines.push(`- цена «от» ${candidate.priceFromKzt.toLocaleString('ru-RU')} ₸, бюджет ${request.budgetKzt.toLocaleString('ru-RU')} ₸`);
    lines.push(`- языки подрядчика: ${candidate.languages.join(', ') || '—'}`);
    if (request.language) lines.push(`- заказчику нужен язык: ${request.language}`);
    lines.push(`- берёт форматы: ${candidate.eventFormats.join(', ') || '—'}, запрошен: ${request.eventType}`);
    lines.push(`- максимум часов: ${candidate.maxHours ?? 'не ограничено'}${request.durationHours ? `, нужно ${request.durationHours}` : ''}`);
    if (candidate.specialization) lines.push(`- специализация: ${candidate.specialization}`);
    if (candidate.signals.length) lines.push(`- признаки: ${candidate.signals.join(', ')}`);
    return lines.join('\n');
  }
}

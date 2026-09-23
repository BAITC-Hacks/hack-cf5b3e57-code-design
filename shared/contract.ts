/**
 * Единый контракт между front и back. Импортится и там, и там.
 * Никаких зависимостей: только TypeScript-типы + константы.
 *
 * Правило: любые изменения в этом файле — только через PR с апрувом двух
 * сторон (фронта и бека). Разошлись типы — расходится продукт.
 */

export const API_PREFIX = '/api/v1' as const;

// ---------------------------------------------------------------------------
// Запрос
// ---------------------------------------------------------------------------

export interface MatchRequest {
  city: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  /** Формат мероприятия из фиксированного списка: свадьба/той/корпоратив/... */
  eventType: string;
  category: string;
  budgetKzt: number;
  durationHours?: number;
  language?: string;
}

// ---------------------------------------------------------------------------
// Ответ
// ---------------------------------------------------------------------------

export type MatchOutcome =
  /** есть от 1 до 3 подходящих кандидатов */
  | 'found'
  /** в этом городе нет подрядчиков этой категории */
  | 'no_category_in_city'
  /** кандидаты есть, но ни один не проходит по датам/бюджету/формату/языку/часам */
  | 'all_filtered_out';

export type FactKey =
  /** цена «от» ≤ бюджета */
  | 'budget'
  /** формат в event_formats */
  | 'format'
  /** язык в languages */
  | 'language'
  /** max_hours ≥ длительности (или null = не ограничен) */
  | 'hours'
  /** признак из офлайн-обогащения (со слов подрядчика) */
  | 'signal'
  /** отсылка к описанию (со слов подрядчика) */
  | 'description';

export interface CardFact {
  key: FactKey;
  /** Готовая к показу строка на русском. */
  label: string;
  /** true — проверено по данным; false — «со слов подрядчика». */
  verified: boolean;
}

export interface CardFlags {
  synthetic: boolean;
  priceImputed: boolean;
  cityImputed: boolean;
}

export interface MatchCard {
  id: string;
  anonName: string;
  category: string;
  city: string;
  priceFromKzt: number;
  /** 1–2 предложения от LLM, детерминировано по построению (кэш). */
  reason: string;
  factsUsed: CardFact[];
  flags: CardFlags;
}

export type FunnelStepName =
  | 'city'
  | 'category'
  | 'date'
  | 'format'
  | 'budget'
  | 'language'
  | 'hours';

export interface FunnelStep {
  step: FunnelStepName;
  before: number;
  after: number;
  /** Готовая к показу причина: «занят 06.10», «цена > бюджета». */
  removedReason: string;
}

export interface MatchResponse {
  outcome: MatchOutcome;
  /** «На что смотреть» — 2–3 пункта под этот запрос. */
  criteria: string[];
  /** 0..3 карточки в детерминированном порядке. */
  cards: MatchCard[];
  /** Пошаговая воронка отсева — для `/manager` и `summary`. */
  funnel: FunnelStep[];
  /** Человеческая строка «почему столько» / «почему пусто». */
  summary: string;
}

// ---------------------------------------------------------------------------
// SSE-события для `/api/v1/match/stream`
// ---------------------------------------------------------------------------

export type SseEventType =
  | 'criteria'
  | 'filter_step'
  | 'ranked'
  | 'card'
  | 'critic'
  | 'done'
  | 'error';

export interface SseEventMap {
  criteria: { criteria: string[] };
  filter_step: FunnelStep;
  ranked: { ids: string[] };
  card: MatchCard;
  critic: {
    ok: boolean;
    problems: { id: string; problem: string }[];
  };
  done: MatchResponse;
  error: { code: string; message: string };
}

// ---------------------------------------------------------------------------
// Ошибки
// ---------------------------------------------------------------------------

export interface ValidationError {
  error: 'validation';
  fields: Record<string, string>;
}

export interface InternalError {
  error: 'internal';
  message: string;
}

export type ApiError = ValidationError | InternalError;

// ---------------------------------------------------------------------------
// Справочники (для дропдаунов на фронте)
// ---------------------------------------------------------------------------

export const CITIES = ['Алматы', 'Астана', 'Зарубежье'] as const;
export type City = (typeof CITIES)[number];

export const EVENT_FORMATS = [
  'свадьба',
  'той',
  'корпоратив',
  'конференция',
  'юбилей',
  'день рождения',
] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export const CATEGORIES = [
  'Ведущий',
  'Ведущий церемонии',
  'Фотограф',
  'Видеограф',
  'Флорист',
  'Декоратор',
  'Подарки и сувениры',
  'Инструменталист',
  'Лайв-бэнд',
  'Национальный ансамбль',
  'Танцевальный коллектив',
  'Шоу-программа',
  'Фото и видеобудки',
  'Банкетный зал',
  'Ресторан',
  'Загородная площадка',
  'Отель',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const LANGUAGES = ['русский', 'казахский', 'английский'] as const;
export type Language = (typeof LANGUAGES)[number];

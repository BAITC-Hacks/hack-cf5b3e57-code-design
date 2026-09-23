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

export type Locale = 'ru' | 'kk' | 'en';

export interface MatchRequest {
  city: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  /** Формат мероприятия из фиксированного списка: свадьба/той/корпоратив/... */
  eventType: string;
  category: string;
  budgetKzt: number;
  durationHours?: number;
  /** Требуемый язык подрядчика. */
  language?: string;
  /** Язык генерируемого текста (объяснения, criteria, summary). Default: 'ru'. */
  locale?: Locale;
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
// Каталог (`GET /api/v1/contractors`)
// ---------------------------------------------------------------------------

export interface ContractorListQuery {
  city?: string;
  category?: string;
  eventFormat?: string;
  language?: string;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  offset?: number;
}

export interface ContractorListItem {
  id: string;
  anonName: string;
  categories: string[];
  city: string;
  priceFromKzt: number;
  eventFormats: string[];
  languages: string[];
  maxHours: number | null;
  flags: CardFlags;
}

export interface ContractorListResponse {
  items: ContractorListItem[];
  total: number;
  limit: number;
  offset: number;
}

/** Полный профиль подрядчика, включая описание и календарь. */
export interface ContractorDetail extends ContractorListItem {
  description: string;
  busyDates: string[];
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
// Чат: AI-ассистент по подбору
// ---------------------------------------------------------------------------

/**
 * `search` — свободный текст → одна категория, до 3 карточек с объяснениями.
 * `bundle` — свободный текст → полный пакет мероприятия по нескольким категориям.
 */
export type ChatMode = 'search' | 'bundle';

export type ChatRole = 'user' | 'assistant';

export interface ChatCreateSessionRequest {
  mode: ChatMode;
  locale?: Locale;
}

export interface ChatCreateSessionResponse {
  sessionId: string;
  mode: ChatMode;
  locale: Locale;
  greeting: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** Прикреплённые результаты tool-вызовов (карточки, пакет). */
  attachments?: ChatAttachment[];
}

export type ChatAttachment =
  | { type: 'match'; match: MatchResponse }
  | { type: 'bundle'; bundle: EventBundle };

export interface ChatSendRequest {
  content: string;
}

/**
 * SSE-события `POST /api/v1/chat/:sessionId/message` (стрим ответа ассистента).
 * Клиент видит текст токенами, а по мере готовности — прикреплённые карточки.
 */
export interface ChatSseEventMap {
  /** Кусок текста ответа ассистента. */
  token: { text: string };
  /** Ассистент запустил tool — можно показать статус «ищу подрядчиков…». */
  tool_start: { name: 'search_contractors' | 'build_event_bundle'; args: Record<string, unknown> };
  /** Tool завершился — прикрепление к сообщению. */
  attachment: ChatAttachment;
  /** Ответ ассистента полностью готов. */
  done: { message: ChatMessage };
  /** Ошибка (промт-инъекция, rate limit, LLM upstream). */
  error: { code: 'injection' | 'rate_limit' | 'upstream' | 'internal'; message: string };
}

/**
 * Пакет мероприятия — что вернёт `build_event_bundle`. По каждой категории
 * либо матч (до 3 карточек с объяснениями), либо честное «нет вариантов».
 */
export interface EventBundle {
  city: string;
  date: string;
  eventType: string;
  totalBudgetKzt: number;
  /** Обязательные категории для этого типа события (свадьба и т.д.). */
  required: BundleItem[];
  /** Рекомендуемые: попадают в подборку, только если бюджет ещё есть. */
  recommended: BundleItem[];
  /** Итог по бюджету и покрытию. */
  summary: string;
}

export interface BundleItem {
  category: string;
  /** Аллоцированная доля общего бюджета под эту категорию. */
  allocatedBudgetKzt: number;
  match: MatchResponse;
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

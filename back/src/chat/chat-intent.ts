/** Facts extracted from the user's own messages, never from model output. */
export interface ChatIntent {
  city?: string;
  date?: string;
  eventType?: string;
  category?: string;
  budgetKzt?: number;
  durationHours?: number;
  language?: string;
  excludedCategories?: string[];
}

export interface CategoryAction {
  category: string;
  action: 'remove' | 'add';
}

export const BUNDLE_CATEGORIES: Record<
  string,
  { required: string[]; recommended: string[] }
> = {
  свадьба: {
    required: ['Ведущий', 'Банкетный зал', 'Фотограф', 'Декоратор'],
    recommended: ['Флорист', 'Видеограф', 'Ведущий церемонии', 'Лайв-бэнд'],
  },
  той: {
    required: ['Ведущий', 'Банкетный зал', 'Национальный ансамбль'],
    recommended: ['Декоратор', 'Флорист', 'Танцевальный коллектив'],
  },
  корпоратив: {
    required: ['Ведущий', 'Банкетный зал', 'Фотограф'],
    recommended: ['Лайв-бэнд', 'Видеограф', 'Шоу-программа'],
  },
  конференция: {
    required: ['Банкетный зал', 'Ведущий'],
    recommended: ['Фотограф', 'Видеограф'],
  },
  юбилей: {
    required: ['Ведущий', 'Банкетный зал'],
    recommended: ['Фотограф', 'Лайв-бэнд', 'Декоратор', 'Флорист'],
  },
  'день рождения': {
    required: ['Ведущий', 'Банкетный зал'],
    recommended: ['Фотограф', 'Лайв-бэнд', 'Декоратор', 'Флорист'],
  },
};

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const ENGLISH_MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const CATEGORY_PATTERNS: [string, RegExp][] = [
  ['Ведущий церемонии', /ведущ\S*\s+церемони/iu],
  ['Ведущий церемонии', /ceremony\s+host/iu],
  ['Национальный ансамбль', /национальн\S*\s+ансамбл/iu],
  ['Танцевальный коллектив', /танцевальн\S*\s+коллектив/iu],
  ['Банкетный зал', /банкетн\S*\s+зал/iu],
  ['Банкетный зал', /банкет/iu],
  ['Шоу-программа', /шоу[-\s]?программ/iu],
  ['Фотограф', /фотограф/iu],
  ['Фотограф', /photograph/iu],
  ['Видеограф', /видеограф/iu],
  ['Видеограф', /videograph/iu],
  ['Декоратор', /декоратор/iu],
  ['Декоратор', /decorat/iu],
  ['Флорист', /флорист/iu],
  ['Флорист', /florist/iu],
  ['Лайв-бэнд', /лайв[-\s]?(?:бэнд|бенд)/iu],
  ['Лайв-бэнд', /live\s+band/iu],
  ['Ведущий', /ведущ/iu],
  ['Ведущий', /(?:^|\W)host(?:$|\W)/iu],
];

function isoDate(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return date.toISOString().slice(0, 10);
}

function todayInAlmaty(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (kind: string) =>
    parts.find((part) => part.type === kind)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function inferYear(month: number, day: number, now: Date): string | undefined {
  const today = todayInAlmaty(now);
  const currentYear = Number(today.slice(0, 4));
  for (let year = currentYear; year < currentYear + 5; year++) {
    const date = isoDate(year, month, day);
    if (date && date >= today) return date;
  }
  return undefined;
}

function parseDate(text: string, now: Date): string | undefined {
  const iso = text.match(/(?:^|[^\d])(\d{4})-(\d{2})-(\d{2})(?!\d)/u);
  if (iso) return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const named = text.match(
    /(?:^|[^\d])([0-3]?\d)\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?/iu,
  );
  if (named) {
    const month = MONTHS.indexOf(named[2].toLowerCase()) + 1;
    const day = Number(named[1]);
    return named[3]
      ? isoDate(Number(named[3]), month, day)
      : inferYear(month, day, now);
  }

  const english = text.match(
    /(?:^|[^\d])([0-3]?\d)\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+([0-3]?\d)(?:,?\s+(\d{4}))?/iu,
  );
  if (english) {
    const dayFirst = english[1] !== undefined;
    const day = Number(dayFirst ? english[1] : english[4]);
    const monthName = dayFirst
      ? english[2].toLowerCase()
      : english[0].trim().split(/\s+/u)[0].toLowerCase();
    const month = ENGLISH_MONTHS.indexOf(monthName) + 1;
    const year = dayFirst ? english[3] : english[5];
    return year
      ? isoDate(Number(year), month, day)
      : inferYear(month, day, now);
  }

  const numeric = text.match(
    /(?:^|[^\d])([0-3]?\d)[./]([01]?\d)(?:[./](\d{4}))?(?!\d)/u,
  );
  if (numeric) {
    const month = Number(numeric[2]);
    const day = Number(numeric[1]);
    return numeric[3]
      ? isoDate(Number(numeric[3]), month, day)
      : inferYear(month, day, now);
  }
  return undefined;
}

function parseBudget(text: string): number | undefined {
  const million = [
    ...text.matchAll(
      /(?:^|[^\d])([\d]+(?:[.,]\d+)?)\s*(?:млн\.?|миллион(?:а|ов)?|million(?:s)?|mln)(?![а-яa-z])/giu,
    ),
  ].at(-1);
  if (million) {
    const value = Math.round(Number(million[1].replace(',', '.')) * 1_000_000);
    return value > 0 && Number.isSafeInteger(value) ? value : undefined;
  }

  const withCurrency = [
    ...text.matchAll(
      /(?:^|[^\d])((?:\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|\d{4,10}))\s*(?:₸|тг\.?|тенге|tenge|kzt)(?![а-яa-z])/giu,
    ),
  ].at(-1);
  const withBudgetWord = text.match(
    /(?:бюджет|бютжет|потратить|выделить|budget)\s*(?:—|:|=|в|около|примерно|is|of)?\s*((?:\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|\d{4,10}))/iu,
  );
  const raw = withCurrency?.[1] ?? withBudgetWord?.[1];
  if (!raw) return undefined;
  const value = Number(raw.replace(/[\s\u00a0\u202f]/gu, ''));
  return value > 0 && Number.isSafeInteger(value) ? value : undefined;
}

function parseOne(text: string, now: Date): ChatIntent {
  const normalized = text.toLowerCase().replace(/ё/g, 'е');
  const cities: { city: string; index: number }[] = [];
  for (const [city, pattern] of [
    ['Астана', /астан[а-я]*|astana|нур[-\s]?султан[а-я]*/giu],
    ['Алматы', /алмат[а-я]*|almaty/giu],
    ['Зарубежье', /зарубеж[а-я]*|за\s+рубеж[а-я]*|abroad/giu],
  ] as const) {
    for (const match of normalized.matchAll(pattern)) {
      cities.push({ city, index: match.index });
    }
  }
  const city = cities.sort((left, right) => right.index - left.index)[0]?.city;

  const eventType = /дн(?:я|ень)\s+рождения|день\s+рождени|birthday/iu.test(
    normalized,
  )
    ? 'день рождения'
    : /свадьб|свадебн|wedding|үйлену\s+той/iu.test(normalized)
      ? 'свадьба'
      : /(?:^|[^а-я])той(?:ы|ға|ды)?(?:[^а-я]|$)/iu.test(normalized)
        ? 'той'
        : /корпоратив|corporate/iu.test(normalized)
          ? 'корпоратив'
          : /конференци|conference/iu.test(normalized)
            ? 'конференция'
            : /юбиле|anniversary/iu.test(normalized)
              ? 'юбилей'
              : undefined;
  const category = CATEGORY_PATTERNS.find(([, pattern]) =>
    pattern.test(normalized),
  )?.[0];
  const language = /казахск|казахском|kazakh/iu.test(normalized)
    ? 'казахский'
    : /английск|английском|english/iu.test(normalized)
      ? 'английский'
      : /русск|russian/iu.test(normalized)
        ? 'русский'
        : undefined;
  const hours = normalized.match(
    /(?:^|[^\d])([1-9]|1\d|2[0-4])\s*(?:час(?:а|ов)?|hours?|сағат)(?:[^а-яa-z]|$)/iu,
  );

  return {
    city,
    date: parseDate(normalized, now),
    eventType,
    category,
    budgetKzt: parseBudget(normalized),
    durationHours: hours ? Number(hours[1]) : undefined,
    language,
  };
}

export function parseCategoryActions(text: string): CategoryAction[] {
  const normalized = text.toLowerCase().replace(/ё/g, 'е');
  const actions: (CategoryAction & { index: number })[] = [];
  const mentions = CATEGORY_PATTERNS.flatMap(([category, pattern]) =>
    [
      ...normalized.matchAll(new RegExp(pattern.source, `${pattern.flags}g`)),
    ].map((match) => ({
      category,
      start: match.index,
      end: match.index + match[0].length,
    })),
  ).sort(
    (left, right) =>
      right.end - right.start - (left.end - left.start) ||
      left.start - right.start,
  );
  const distinctMentions: typeof mentions = [];
  for (const mention of mentions) {
    if (
      distinctMentions.some(
        (other) => mention.start < other.end && mention.end > other.start,
      )
    ) {
      continue;
    }
    distinctMentions.push(mention);
  }

  for (const { category, start, end } of distinctMentions) {
    const before =
      normalized
        .slice(Math.max(0, start - 70), start)
        .split(/[,.!?;]/u)
        .at(-1) ?? '';
    const after = normalized.slice(end, end + 40).split(/[,.!?;]/u)[0] ?? '';
    const removeBefore =
      /(?:не\s+нуж(?:ен|на|ны)|не\s+надо|не\s+нужно|не\s+хочу|без|убери|убрать|исключи|исключить|откажемся\s+от)\s+(?:\S+\s+){0,2}$/iu.test(
        before,
      );
    const removeAfter =
      /^\s*(?:не\s+нуж(?:ен|на|ны)|не\s+надо|не\s+нужно)/iu.test(after);
    const addBefore =
      /(?:добавь|добавить|верни|вернуть|включи|включить|хочу|нуж(?:ен|на|ны)|оставь)\s+(?:\S+\s+){0,2}$/iu.test(
        before,
      );
    const addAfter = /^\s*(?:нуж(?:ен|на|ны)|добавь|верни)/iu.test(after);
    if (removeBefore || removeAfter) {
      actions.push({ category, action: 'remove', index: start });
    } else if (addBefore || addAfter) {
      actions.push({ category, action: 'add', index: start });
    }
  }
  return actions
    .sort((left, right) => left.index - right.index)
    .map(({ category, action }) => ({ category, action }));
}

export function parseChatIntent(
  userMessages: (string | { content: string; createdAt: Date })[],
  now: Date = new Date(),
): ChatIntent {
  const intent: ChatIntent = {};
  const excluded = new Set<string>();
  for (const turn of userMessages) {
    const message = typeof turn === 'string' ? turn : turn.content;
    const referenceDate = typeof turn === 'string' ? now : turn.createdAt;
    const parsed = parseOne(message, referenceDate);
    for (const key of Object.keys(parsed) as (keyof ChatIntent)[]) {
      if (parsed[key] !== undefined) {
        // Every newer explicit user value overrides the older value.
        (intent as Record<string, unknown>)[key] = parsed[key];
      }
    }
    for (const { category, action } of parseCategoryActions(message)) {
      if (action === 'remove') excluded.add(category);
      else excluded.delete(category);
    }
  }
  if (excluded.size > 0) intent.excludedCategories = [...excluded];
  return intent;
}

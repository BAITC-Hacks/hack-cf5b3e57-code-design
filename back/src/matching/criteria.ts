import { languageLoc } from './copy/nouns';
import { MatchRequestDto } from './dto/match-request.dto';

export type CriterionKey =
  | 'format'
  | 'language'
  | 'hours'
  | 'budget'
  | 'description';

export interface MatchCriterion {
  key: CriterionKey;
  label: string;
}

const HOSTS = new Set(['Ведущий', 'Ведущий церемонии']);
const PHOTO = new Set(['Фотограф', 'Видеограф']);
const VENUES = new Set([
  'Банкетный зал',
  'Ресторан',
  'Отель',
  'Загородная площадка',
]);
const MUSIC = new Set([
  'Лайв-бэнд',
  'Инструменталист',
  'Национальный ансамбль',
  'Танцевальный коллектив',
  'Шоу-программа',
]);
const DECOR = new Set(['Флорист', 'Декоратор']);

/** The visible criteria are the same dimensions used by ranking and evidence. */
export function criteriaFor(req: MatchRequestDto): MatchCriterion[] {
  let keys: CriterionKey[];
  if (HOSTS.has(req.category)) keys = ['language', 'description', 'format'];
  else if (PHOTO.has(req.category)) keys = ['format', 'hours', 'budget'];
  else if (VENUES.has(req.category)) keys = ['format', 'hours', 'budget'];
  else if (MUSIC.has(req.category)) keys = ['language', 'hours', 'format'];
  else if (DECOR.has(req.category)) keys = ['format', 'description', 'budget'];
  else keys = ['format', 'budget', 'hours'];

  // Explicit customer requirements supersede category defaults.
  if (req.durationHours) keys = ['hours', ...keys.filter((key) => key !== 'hours')];
  if (req.language) keys = ['language', ...keys.filter((key) => key !== 'language')];
  return keys.slice(0, 3).map((key) => ({ key, label: labelFor(key, req) }));
}

/** Only an explicit event mention can contribute description relevance. */
export function mentionsRequestedEvent(
  description: string,
  eventType: string,
): boolean {
  const terms: Record<string, string[]> = {
    свадьба: ['свад', 'бракосочет'],
    корпоратив: ['корпоратив'],
    конференция: ['конференц'],
    юбилей: ['юбиле'],
    'день рождения': ['день рожд', 'дня рожд', 'дни рожд'],
  };
  const text = ` ${description.toLocaleLowerCase('ru-RU')} `;
  if (eventType === 'той') {
    return /(?:^|[^\p{L}])(?:той|тои|тоев|тоях)(?=$|[^\p{L}])/u.test(text);
  }
  return (terms[eventType] ?? [eventType.toLocaleLowerCase('ru-RU')]).some(
    (term) => text.includes(term),
  );
}

/** Domain signals useful for ranking rich profiles without model inference. */
export function hasConcreteProfileSignal(description: string): boolean {
  return /импров|сценар|палитр|фотожурнал|документальн|монтаж|мультимед|репертуар|букет|оркестр|проектор|светов|кейсы|портфолио|\bdj\b|\d{2,}/iu.test(description);
}

export function eventLabel(
  eventType: string,
  locale: MatchRequestDto['locale'],
): string {
  const translated: Record<'kk' | 'en', Record<string, string>> = {
    kk: {
      свадьба: 'үйлену тойы', той: 'той', корпоратив: 'корпоратив',
      конференция: 'конференция', юбилей: 'мерейтой',
      'день рождения': 'туған күн',
    },
    en: {
      свадьба: 'wedding', той: 'toi celebration', корпоратив: 'corporate event',
      конференция: 'conference', юбилей: 'anniversary',
      'день рождения': 'birthday',
    },
  };
  return locale === 'kk' || locale === 'en'
    ? translated[locale][eventType] ?? eventType
    : eventType;
}

function labelFor(key: CriterionKey, req: MatchRequestDto): string {
  const locale = req.locale ?? 'ru';
  const event = eventLabel(req.eventType, locale);
  const labels = {
    ru: {
      format: `Фокус на формате «${event}»`,
      language: req.language
        ? `Работа на ${languageLoc(req.language)}`
        : 'Языки работы с гостями',
      hours: req.durationHours
        ? `Не меньше ${req.durationHours} ч на площадке`
        : 'Время работы на площадке',
      budget: 'Запас бюджета после цены «от»',
      description: `Упоминание «${event}» в анкете`,
    },
    kk: {
      format: `«${event}» форматына бейімділік`,
      language: req.language
        ? `${req.language} тілінде қызмет көрсету`
        : 'Қонақтармен жұмыс тілдері',
      hours: req.durationHours
        ? `Алаңда кемінде ${req.durationHours} сағат`
        : 'Алаңдағы жұмыс уақыты',
      budget: 'Бастапқы бағадан кейінгі бюджет қалдығы',
      description: `Анкетада «${event}» туралы мәлімет`,
    },
    en: {
      format: `Focus on the ${event} format`,
      language: req.language
        ? `Service in ${req.language}`
        : 'Languages for your guests',
      hours: req.durationHours
        ? `At least ${req.durationHours} hours on site`
        : 'Time available on site',
      budget: 'Budget left after the starting price',
      description: `Mention of ${event} in the profile`,
    },
  };
  return labels[locale][key];
}

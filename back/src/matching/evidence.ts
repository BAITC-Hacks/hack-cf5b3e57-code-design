import type { Prisma } from '@prisma/client';
import {
  criteriaFor,
  eventLabel,
  hasConcreteProfileSignal,
  mentionsRequestedEvent,
} from './criteria';
import { eventAcc, humanDate, languageLoc, money } from './copy/nouns';
import { MatchRequestDto } from './dto/match-request.dto';
import type { EvidenceOption } from './llm/llm-client';
import type { CardFact, FactKey } from './types';

export type Candidate = Prisma.ContractorGetPayload<{
  include: { enrichment: true };
}>;

const KK_MONTHS = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateLabel(date: string, locale: MatchRequestDto['locale']): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const day = Number(date.slice(8, 10));
  const month = Number(date.slice(5, 7)) - 1;
  if (locale === 'kk') return `${day} ${KK_MONTHS[month] ?? ''}`.trim();
  if (locale === 'en') return `${day} ${EN_MONTHS[month] ?? ''}`.trim();
  return humanDate(date);
}

function byLocale(
  req: MatchRequestDto,
  ru: string,
  kk: string,
  en: string,
): string {
  return req.locale === 'kk' ? kk : req.locale === 'en' ? en : ru;
}

function languageList(values: string[], req: MatchRequestDto): string {
  if (req.locale === 'en') {
    const names: Record<string, string> = {
      русский: 'Russian', казахский: 'Kazakh', английский: 'English',
    };
    return values.map((value) => names[value] ?? value).join(', ');
  }
  if (req.locale === 'kk') {
    const names: Record<string, string> = {
      русский: 'орыс', казахский: 'қазақ', английский: 'ағылшын',
    };
    return values.map((value) => names[value] ?? value).join(', ');
  }
  return values.join(', ');
}

function ruLanguageCount(count: number): string {
  if (count % 100 >= 11 && count % 100 <= 14) return `${count} языков`;
  if (count % 10 === 1) return `${count} язык`;
  if (count % 10 >= 2 && count % 10 <= 4) return `${count} языка`;
  return `${count} языков`;
}

function profileQuote(description: string, eventType: string): string | null {
  const normalized = description.replace(/\s+/gu, ' ').trim();
  const segments = normalized
    .split(/[.!?;•]+/u)
    .flatMap((part) => part.split(/[,—]+/u))
    .map((part) => part.trim())
    .filter((part) => part.length >= 18);
  const scored = segments.map((text, index) => ({
    text,
    index,
    score: (mentionsRequestedEvent(text, eventType) ? 10 : 0) +
      (hasConcreteProfileSignal(text) ? 5 : 0) -
      (/ТОЛЬКО|ЛУЧШ|ИДЕАЛ/iu.test(text) ? 2 : 0),
  })).filter((item) => item.score > 0);
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const relevant = scored[0]?.text;
  if (!relevant) return null;
  const bounded = relevant.length <= 82
    ? relevant
    : relevant.slice(0, relevant.lastIndexOf(' ', 78) > 45 ? relevant.lastIndexOf(' ', 78) : 78).trimEnd();
  return bounded === relevant ? bounded : `${bounded}…`;
}

/** Claims are assembled only from fields already loaded from the database. */
export function evidenceFor(
  candidate: Candidate,
  shown: Candidate[],
  req: MatchRequestDto,
): EvidenceOption[] {
  const others = shown.filter((item) => item.id !== candidate.id);
  const event = eventLabel(req.eventType, req.locale);
  const enabled = new Set(criteriaFor(req).map((item) => item.key));
  const options: EvidenceOption[] = [];
  const add = (
    id: string,
    criterionKey: EvidenceOption['criterionKey'],
    factKeys: FactKey[],
    text: string,
  ) => {
    if (enabled.has(criterionKey)) {
      options.push({ id, criterionKey, factKeys, text });
    }
  };

  if (others.length > 0) {
    for (const language of candidate.languages) {
      if (others.every((other) => !other.languages.includes(language))) {
        add(
          `unique-language:${language}`,
          'language',
          ['language'],
          byLocale(
            req,
            `Среди показанных только этот подрядчик работает на ${languageLoc(language)}`,
            `Көрсетілгендердің ішінде тек осы мердігер ${languageList([language], req)} тілінде жұмыс істейді`,
            `Among those shown, this is the only contractor working in ${languageList([language], req)}`,
          ),
        );
      }
    }
  }

  const quote = profileQuote(candidate.description, req.eventType);
  if (quote) {
    add(
      'profile-quote',
      enabled.has('description') ? 'description' : 'format',
      ['description'],
      byLocale(
        req,
        `В анкете: «${quote}» — со слов подрядчика`,
        `Анкетада: «${quote}» — мердігердің сөзінен`,
        `The contractor's profile says: “${quote}”`,
      ),
    );
  }

  if (
    others.length > 0 &&
    candidate.eventFormats.length < Math.min(...others.map((item) => item.eventFormats.length))
  ) {
    add(
      'narrower-format',
      'format',
      ['format'],
      byLocale(
        req,
        `Среди показанных у него самый узкий список форматов: ${candidate.eventFormats.length}`,
        `Көрсетілгендердің ішінде форматтары ең аз: ${candidate.eventFormats.length}`,
        `Among those shown, this profile lists the fewest event formats: ${candidate.eventFormats.length}`,
      ),
    );
  }

  if (
    candidate.maxHours !== null &&
    others.length > 0 &&
    others.every((item) => item.maxHours !== null && candidate.maxHours! > item.maxHours!)
  ) {
    add(
      'longest-hours',
      'hours',
      ['hours'],
      byLocale(
        req,
        `До ${candidate.maxHours} ч на площадке — больше, чем у других показанных`,
        `Алаңда ${candidate.maxHours} сағатқа дейін жұмыс істейді — көрсетілген басқалардан ұзақ`,
        `Can stay up to ${candidate.maxHours} hours on site, longer than the others shown`,
      ),
    );
  }

  if (
    others.length > 0 &&
    !candidate.priceImputed &&
    others.every((item) => !item.priceImputed) &&
    others.every((item) => candidate.priceFromKzt < item.priceFromKzt)
  ) {
    add(
      'lowest-price',
      'budget',
      ['budget'],
      byLocale(
        req,
        `Среди показанных самая низкая цена — от ${money(candidate.priceFromKzt)}`,
        `Көрсетілгендердің ішіндегі ең төмен баға — ${money(candidate.priceFromKzt)} бастап`,
        `The lowest starting price among those shown is ${money(candidate.priceFromKzt)}`,
      ),
    );
  }

  if (mentionsRequestedEvent(candidate.description, req.eventType)) {
    add(
      'event-in-description',
      'description',
      ['description'],
      byLocale(
        req,
        `В собственной анкете отдельно упоминает ${eventAcc(req.eventType)} — со слов подрядчика`,
        `Өз анкетасында ${event} атайды — мердігердің сөзінен`,
        `The profile specifically mentions ${event}, in the contractor's own words`,
      ),
    );
  }

  add(
    'format-count',
    'format',
    ['format'],
    byLocale(
      req,
      `Берёт ${eventAcc(req.eventType)} как один из ${candidate.eventFormats.length} указанных форматов`,
      `${event} — анкетадағы ${candidate.eventFormats.length} форматтың бірі`,
      `Accepts ${event} as one of ${candidate.eventFormats.length} listed formats`,
    ),
  );

  if (candidate.maxHours !== null) {
    add(
      'hours',
      'hours',
      ['hours'],
      byLocale(
        req,
        `В анкете указан предел ${candidate.maxHours} ч на площадке`,
        `Анкетада алаңдағы шек ${candidate.maxHours} сағат деп көрсетілген`,
        `The profile states a limit of ${candidate.maxHours} hours on site`,
      ),
    );
  }

  if (candidate.languages.length > 0) {
    add(
      'languages',
      'language',
      ['language'],
      byLocale(
        req,
        `В анкете указано ${ruLanguageCount(candidate.languages.length)}: ${languageList(candidate.languages, req)}`,
        `Анкетада ${candidate.languages.length} тіл көрсетілген: ${languageList(candidate.languages, req)}`,
        `The profile lists ${candidate.languages.length} languages: ${languageList(candidate.languages, req)}`,
      ),
    );
  }

  add(
    'budget-left',
    'budget',
    ['budget'],
    byLocale(
      req,
      `${candidate.priceImputed ? 'По ориентиру цены' : 'После цены'} от ${money(candidate.priceFromKzt)} остаётся ${money(req.budgetKzt - candidate.priceFromKzt)}`,
      `${money(candidate.priceFromKzt)} ${candidate.priceImputed ? 'баға бағдары' : 'бастапқы бағадан'} кейін ${money(req.budgetKzt - candidate.priceFromKzt)} қалады`,
      `After the ${money(candidate.priceFromKzt)} ${candidate.priceImputed ? 'estimated' : 'starting'} price, ${money(req.budgetKzt - candidate.priceFromKzt)} remains`,
    ),
  );

  // Most distinctive source-backed claims come first in MOCK and fallback.
  return options;
}

export function availabilitySentence(candidate: Candidate, req: MatchRequestDto): string {
  const date = dateLabel(req.date, req.locale);
  return byLocale(
    req,
    `Свободен ${date}; ${candidate.priceImputed ? 'ценовой ориентир' : 'цена от'} ${money(candidate.priceFromKzt)} в бюджете ${money(req.budgetKzt)}`,
    `${date} күні бос; ${candidate.priceImputed ? 'баға бағдары' : 'бастапқы баға'} ${money(candidate.priceFromKzt)}, бюджет ${money(req.budgetKzt)}`,
    `Available on ${date}; ${candidate.priceImputed ? 'estimated' : 'starting'} price ${money(candidate.priceFromKzt)} fits ${money(req.budgetKzt)}`, 
  );
}

export function composeReason(
  option: EvidenceOption,
  candidate: Candidate,
  req: MatchRequestDto,
): string {
  if (option.id === 'availability-only') return `${option.text}.`;
  return `${option.text.replace(/[.!?]+$/u, '')}. ${availabilitySentence(candidate, req)}.`;
}

/** Last-resort truthful one-sentence explanation when profiles are identical. */
export function availabilityOnlyOption(candidate: Candidate, req: MatchRequestDto): EvidenceOption {
  return {
    id: 'availability-only',
    criterionKey: 'budget',
    factKeys: ['date', 'budget'],
    text: availabilitySentence(candidate, req),
  };
}

export function factsFor(
  option: EvidenceOption,
  candidate: Candidate,
  req: MatchRequestDto,
): CardFact[] {
  const keys = new Set<FactKey>([...option.factKeys, 'date', 'budget']);
  const date = dateLabel(req.date, req.locale);
  const event = eventLabel(req.eventType, req.locale);
  const facts: CardFact[] = [];
  for (const key of keys) {
    switch (key) {
      case 'date':
        facts.push({
          key,
          label: byLocale(req, `Свободен ${date}`, `${date} күні бос`, `Available on ${date}`),
          verified: !candidate.busyDates.includes(req.date),
        });
        break;
      case 'budget':
        facts.push({
          key,
          label: byLocale(
            req,
            `${candidate.priceImputed ? 'Ориентир цены' : 'Цена'} от ${money(candidate.priceFromKzt)} ≤ ${money(req.budgetKzt)}`,
            `${candidate.priceImputed ? 'Баға бағдары' : 'Баға'} ${money(candidate.priceFromKzt)} ≤ ${money(req.budgetKzt)}`,
            `${candidate.priceImputed ? 'Estimated price' : 'Price'} ${money(candidate.priceFromKzt)} ≤ ${money(req.budgetKzt)}`,
          ),
          verified: !candidate.priceImputed && candidate.priceFromKzt <= req.budgetKzt,
        });
        break;
      case 'format':
        facts.push({
          key,
          label: byLocale(
            req,
            `«${event}» указан в форматах`,
            `«${event}» форматтар тізімінде бар`,
            `${event} is among the listed formats`,
          ),
          verified: candidate.eventFormats.includes(req.eventType),
        });
        break;
      case 'language':
        facts.push({
          key,
          label: req.language
            ? byLocale(
              req,
              `Работает на ${languageLoc(req.language)}`,
              `${languageList([req.language], req)} тілінде жұмыс істейді`,
              `Works in ${languageList([req.language], req)}`,
            )
            : byLocale(
              req,
              `Указано ${ruLanguageCount(candidate.languages.length)}`,
              `${candidate.languages.length} тіл көрсетілген`,
              `${candidate.languages.length} languages listed`,
            ),
          verified: req.language
            ? candidate.languages.includes(req.language)
            : candidate.languages.length > 0,
        });
        break;
      case 'hours':
        facts.push({
          key,
          label: candidate.maxHours === null
            ? byLocale(req, 'Лимит часов не указан', 'Сағат шегі көрсетілмеген', 'Hours limit not listed')
            : byLocale(
              req,
              `До ${candidate.maxHours} ч на площадке`,
              `Алаңда ${candidate.maxHours} сағатқа дейін`,
              `Up to ${candidate.maxHours} hours on site`,
            ),
          verified: candidate.maxHours !== null &&
            (!req.durationHours || candidate.maxHours >= req.durationHours),
        });
        break;
      case 'description':
        facts.push({
          key,
          label: byLocale(
            req,
            option.id === 'event-in-description'
              ? `«${event}» — со слов подрядчика в анкете`
              : 'Фрагмент анкеты — со слов подрядчика',
            option.id === 'event-in-description'
              ? `«${event}» — мердігердің анкетасындағы сөзі`
              : 'Анкета үзіндісі — мердігердің сөзінен',
            option.id === 'event-in-description'
              ? `${event} — in the contractor's own profile`
              : "Profile excerpt — in the contractor's own words",
          ),
          verified: false,
        });
        break;
      case 'signal':
        facts.push({
          key,
          label: byLocale(req, 'Со слов подрядчика', 'Мердігердің сөзінен', 'In the contractor’s own words'),
          verified: false,
        });
        break;
    }
  }
  return facts;
}

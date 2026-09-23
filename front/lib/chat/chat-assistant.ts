import {
  CATEGORIES,
  CITIES,
  EVENT_FORMATS,
  LANGUAGES,
} from "../../../shared/contract";
import type {
  Category,
  ChatRole,
  City,
  EventFormat,
  Language,
  Locale,
  MatchRequest,
} from "../../../shared/contract";
import type { ChatField, ChatMessages } from "@/lib/i18n/messages/chat";

export interface ChatDraft {
  category?: Category;
  city?: City;
  date?: string;
  eventType?: EventFormat;
  budgetKzt?: number;
  language?: Language;
  languageResolved: boolean;
}

export interface ChatTranscriptMessage {
  id: string;
  role: ChatRole;
  text: string;
}

export interface ParsedChatInput {
  draft: ChatDraft;
  recognized: ChatField[];
}

export const CHAT_FIELDS: readonly ChatField[] = [
  "category",
  "city",
  "date",
  "eventType",
  "budgetKzt",
  "language",
];

export const EMPTY_CHAT_DRAFT: ChatDraft = { languageResolved: false };

const ANY_LANGUAGE_TERMS = [
  "any",
  "any language",
  "skip",
  "no preference",
  "любой",
  "любой язык",
  "не важно",
  "неважно",
  "пропустить",
  "кез келген",
  "кез келген тіл",
  "өткізу",
  "маңызды емес",
];

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replaceAll("ё", "е")
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function extractOption<const Options extends readonly string[]>(
  input: string,
  options: Options,
  labels: Readonly<Record<string, string>>,
): Options[number] | undefined {
  const normalizedInput = normalize(input);
  const candidates = options
    .flatMap((value) => [
      { value, text: normalize(value) },
      { value, text: normalize(labels[value] ?? value) },
    ])
    .filter((candidate, index, all) =>
      candidate.text.length > 0 &&
      all.findIndex(
        (other) => other.value === candidate.value && other.text === candidate.text,
      ) === index,
    )
    .sort((left, right) => right.text.length - left.text.length);

  return candidates.find(({ text }) =>
    normalizedInput === text ||
    normalizedInput.startsWith(`${text} `) ||
    normalizedInput.endsWith(` ${text}`) ||
    normalizedInput.includes(` ${text} `),
  )?.value;
}

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function extractDate(input: string) {
  const iso = input.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const value = `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
    return isValidIsoDate(value) ? value : undefined;
  }

  const local = input.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](20\d{2}))?\b/);
  if (!local) return undefined;

  const value = `${local[3] ?? "2026"}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  return isValidIsoDate(value) ? value : undefined;
}

function extractBudget(input: string, acceptPlainNumber: boolean) {
  const normalized = input.toLocaleLowerCase().replaceAll(",", ".");
  const million = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:млн|миллион(?:а|ов)?|million(?:s)?)/u,
  );
  if (million) return Math.round(Number(million[1]) * 1_000_000);

  const thousand = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:тыс(?:яч[аи]?)?|мың|k|thousand(?:s)?)/u,
  );
  if (thousand) return Math.round(Number(thousand[1]) * 1_000);

  const withoutDates = normalized
    .replace(/\b20\d{2}-\d{1,2}-\d{1,2}\b/g, " ")
    .replace(/\b\d{1,2}[./-]\d{1,2}(?:[./-]20\d{2})?\b/g, " ");
  const numbers = withoutDates.match(/\d[\d\s]{2,}\d|\d+/g) ?? [];
  const values = numbers
    .map((value) => Number(value.replaceAll(" ", "")))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => right - left);
  const explicitCurrency = /(?:₸|тг|тенге|kzt|budget|бюджет)/iu.test(input);

  return values.find((value) => value >= 10_000 || (acceptPlainNumber && value > 0) || explicitCurrency);
}

function hasAnyLanguageIntent(input: string) {
  const normalized = normalize(input);
  return ANY_LANGUAGE_TERMS.some(
    (term) => normalized === normalize(term) || normalized.includes(normalize(term)),
  );
}

export function parseChatInput(
  input: string,
  currentDraft: ChatDraft,
  activeField: ChatField | null,
  labels: ChatMessages["labels"],
): ParsedChatInput {
  const draft = { ...currentDraft };
  const recognized: ChatField[] = [];
  const category = extractOption(input, CATEGORIES, labels.categories);
  const city = extractOption(input, CITIES, labels.cities);
  const date = extractDate(input);
  const eventType = extractOption(input, EVENT_FORMATS, labels.eventFormats);
  const budgetKzt = extractBudget(input, activeField === "budgetKzt");
  const language = extractOption(input, LANGUAGES, labels.languages);

  if (category) {
    draft.category = category;
    recognized.push("category");
  }
  if (city) {
    draft.city = city;
    recognized.push("city");
  }
  if (date) {
    draft.date = date;
    recognized.push("date");
  }
  if (eventType) {
    draft.eventType = eventType;
    recognized.push("eventType");
  }
  if (budgetKzt) {
    draft.budgetKzt = budgetKzt;
    recognized.push("budgetKzt");
  }
  if (language) {
    draft.language = language;
    draft.languageResolved = true;
    recognized.push("language");
  } else if (hasAnyLanguageIntent(input)) {
    delete draft.language;
    draft.languageResolved = true;
    recognized.push("language");
  }

  return { draft, recognized };
}

export function getNextChatField(draft: ChatDraft): ChatField | null {
  if (!draft.category) return "category";
  if (!draft.city) return "city";
  if (!draft.date) return "date";
  if (!draft.eventType) return "eventType";
  if (!draft.budgetKzt) return "budgetKzt";
  if (!draft.languageResolved) return "language";
  return null;
}

export function toMatchRequest(draft: ChatDraft, locale: Locale): MatchRequest {
  if (
    !draft.category ||
    !draft.city ||
    !draft.date ||
    !draft.eventType ||
    !draft.budgetKzt ||
    !draft.languageResolved
  ) {
    throw new Error("Cannot create MatchRequest from an incomplete chat draft");
  }

  return {
    budgetKzt: draft.budgetKzt,
    category: draft.category,
    city: draft.city,
    date: draft.date,
    eventType: draft.eventType,
    locale,
    ...(draft.language ? { language: draft.language } : {}),
  };
}

export function fieldValue(
  field: ChatField,
  draft: ChatDraft,
  copy: ChatMessages,
  locale: Locale,
) {
  switch (field) {
    case "category":
      return draft.category ? copy.labels.categories[draft.category] : null;
    case "city":
      return draft.city ? copy.labels.cities[draft.city] : null;
    case "date":
      return draft.date
        ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : `${locale}-KZ`, {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${draft.date}T12:00:00Z`))
        : null;
    case "eventType":
      return draft.eventType ? copy.labels.eventFormats[draft.eventType] : null;
    case "budgetKzt":
      return draft.budgetKzt
        ? `${new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`).format(draft.budgetKzt)} ₸`
        : null;
    case "language":
      if (!draft.languageResolved) return null;
      return draft.language ? copy.labels.languages[draft.language] : copy.actions.anyLanguage;
  }
}

export function invalidMessage(field: ChatField, copy: ChatMessages) {
  if (field === "date") return copy.assistant.invalidDate;
  if (field === "budgetKzt") return copy.assistant.invalidBudget;
  return copy.assistant.noRecognition;
}

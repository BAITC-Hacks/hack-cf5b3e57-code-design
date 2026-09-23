import type { Locale } from "../../../../shared/contract";

/*
 * Hand-written month / weekday names instead of Intl: browsers without full ICU
 * (and some Chromium builds) render Kazakh dates as "M10", and a server/client
 * difference in Intl output breaks hydration.
 */
const MONTHS: Record<Locale, readonly string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  kk: ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const MONTHS_SHORT: Record<Locale, readonly string[]> = {
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  kk: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const WEEKDAYS: Record<Locale, readonly string[]> = {
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  kk: ["Жексенбі", "Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

function parseIso(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "2026-10-16" → "16 октября" / "16 қазан" / "16 October". */
export function formatDayMonth(isoDate: string, locale: Locale) {
  const date = parseIso(isoDate);
  if (!date) return isoDate;
  return `${date.getUTCDate()} ${MONTHS[locale][date.getUTCMonth()]}`;
}

export function formatMonthShort(isoDate: string, locale: Locale) {
  const date = parseIso(isoDate);
  return date ? MONTHS_SHORT[locale][date.getUTCMonth()] : "";
}

export function formatWeekday(isoDate: string, locale: Locale) {
  const date = parseIso(isoDate);
  return date ? WEEKDAYS[locale][date.getUTCDay()] : "";
}

/** Replaces raw ISO dates inside service text with a human, locale-aware date. */
export function humanizeDates(text: string, locale: Locale) {
  return text.replace(ISO_DATE, (match) => formatDayMonth(match, locale));
}

/** 1000000 → "1 000 000 ₸" (ru/kk) or "1,000,000 ₸" (en), identical on server and client. */
export function formatKzt(value: number, locale: Locale) {
  const separator = locale === "en" ? "," : " ";
  const digits = Math.round(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return `${value < 0 ? "−" : ""}${digits} ₸`;
}

export function capitalize(text: string) {
  return text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text;
}

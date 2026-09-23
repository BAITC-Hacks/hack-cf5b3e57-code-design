import type { Locale } from "../../../shared/contract";

const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const INTL_LOCALE: Record<Locale, string> = { ru: "ru-RU", kk: "kk-KZ", en: "en-GB" };

/**
 * Display-only helper: turns raw ISO dates inside backend text
 * ("свободен на 2026-10-16") into human dates ("свободен на 16 октября").
 * Never use it on values that are sent back to the API.
 */
export function humanizeDates(text: string, locale: Locale) {
  if (!text) return text;
  const format = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return text.replace(ISO_DATE, (match, year: string, month: string, day: string) => {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? match : format.format(date);
  });
}

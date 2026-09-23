import type { Locale } from "../../../../shared/contract";

export const LOCALE_TAG: Record<Locale, string> = {
  ru: "ru-RU",
  kk: "kk-KZ",
  en: "en-US",
};

/** Kazakh month names — ICU data for kk is missing in some browsers ("M10 16"). */
const KK_MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];

const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

/** "2026-10-16" → «16 октября» / «16 қазан» / "October 16". */
export function formatDayMonth(isoDate: string, locale: Locale) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day || month > 12) return isoDate;
  if (locale === "kk") return `${day} ${KK_MONTHS[month - 1]}`;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
}

/** Service text keeps its own language; guess it so an inserted date matches the sentence. */
function textLocale(text: string, fallback: Locale): Locale {
  if (/[әғқңөұүһі]/i.test(text)) return "kk";
  if (/[а-яё]/i.test(text)) return "ru";
  if (/[a-z]/i.test(text)) return "en";
  return fallback;
}

/** Replaces raw ISO dates inside service text with human dates. Display only. */
export function humanizeDates(text: string, locale: Locale) {
  if (!text) return text;
  const target = textLocale(text.replace(ISO_DATE, ""), locale);
  return text.replace(ISO_DATE, (match) => formatDayMonth(match, target));
}

/** 1000000 → "1 000 000 ₸" (kk uses the same grouping as ru). */
export function formatMoney(value: number, locale: Locale) {
  const tag = locale === "en" ? "en-US" : "ru-RU";
  return `${new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(value)} ₸`;
}

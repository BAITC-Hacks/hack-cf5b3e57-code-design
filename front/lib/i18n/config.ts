import type { Locale } from "../../../shared/contract";

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "troika_locale";
export const SUPPORTED_LOCALES = ["ru", "kk", "en"] as const satisfies readonly Locale[];

export const LOCALE_TAGS: Record<Locale, string> = {
  ru: "ru-RU",
  kk: "kk-KZ",
  en: "en-GB",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

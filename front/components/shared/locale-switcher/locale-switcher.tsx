"use client";

import type { Locale } from "../../../../shared/contract";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-provider";
import styles from "./locale-switcher.module.css";

const LABELS: Record<Locale, string> = {
  ru: "RU",
  kk: "ҚАЗ",
  en: "EN",
};

export function LocaleSwitcher({
  ariaLabel = "Language / Тіл / Язык",
  className,
}: {
  ariaLabel?: string;
  className?: string;
}) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      aria-label={ariaLabel}
      className={[styles.switcher, className].filter(Boolean).join(" ")}
      role="group"
    >
      {SUPPORTED_LOCALES.map((option) => (
        <button
          aria-pressed={locale === option}
          className={locale === option ? styles.active : undefined}
          key={option}
          onClick={() => setLocale(option)}
          type="button"
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}

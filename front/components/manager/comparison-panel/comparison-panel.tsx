"use client";

import type { MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { ContractorPhoto } from "../shared/contractor-photo";
import { Icon } from "../shared/icon";
import type { DateComparison } from "../shared/manager-types";
import styles from "./comparison-panel.module.css";

function Results({ firstDate, first, secondDate, second }: DateComparison) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].comparison;
  const firstIds = new Set(first.cards.map((card) => card.id));
  const secondIds = new Set(second.cards.map((card) => card.id));
  const leftOnly = first.cards.filter((card) => !secondIds.has(card.id));
  const rightOnly = second.cards.filter((card) => !firstIds.has(card.id));
  const dateFormatter = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU", { day: "2-digit", month: "long" });
  const columns: { date: string; response: MatchResponse; unique: typeof leftOnly }[] = [
    { date: dateFormatter.format(new Date(`${firstDate}T12:00:00Z`)), response: first, unique: leftOnly },
    { date: dateFormatter.format(new Date(`${secondDate}T12:00:00Z`)), response: second, unique: rightOnly },
  ];
  return (
    <div className={styles.results}>
      <div className={styles.summary}>
        <span>{messages.changed(leftOnly.length + rightOnly.length)}</span>
        <p>{leftOnly.length ? messages.firstOnly(leftOnly.map((card) => card.anonName).join(", ")) : messages.unchanged}</p>
      </div>
      <div className={styles.columns}>
        {columns.map((column) => {
          const dateStep = column.response.funnel.find((step) => step.step === "date");
          return (
            <section key={column.date}>
              <div className={styles.date}><strong>{column.date}</strong><span>{messages.count(column.response.cards.length)}</span></div>
              {dateStep && <p className={styles.availability}>{messages.availabilityRemoved(dateStep.before - dateStep.after)}</p>}
              <ol>
                {column.response.cards.map((card) => (
                  <li key={card.id}>
                    <ContractorPhoto id={card.id} name={card.anonName} />
                    <span className={styles.identity}><strong>{card.anonName}</strong><small>{card.id}</small></span>
                    {column.unique.some((item) => item.id === card.id) && <em>{messages.onlyHere}</em>}
                    <p className={styles.cardReason}>{card.reason}</p>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function ComparisonPanel({ comparing, comparison, error, onCompare }: { comparing: boolean; comparison: DateComparison | null; error: string | null; onCompare: () => void }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].comparison;
  return (
    <section className={styles.panel}>
      <div className={styles.intro}><span className={styles.icon}><Icon><path d="M7 4v16M17 4v16M4 8h6M14 16h6" /></Icon></span><div><span className={styles.index}>{messages.section}</span><h2>{messages.title}</h2><p>{messages.description}</p></div></div>
      <button type="button" onClick={onCompare} disabled={comparing}>{comparing ? messages.loading : messages.action}</button>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {comparison && <Results {...comparison} />}
    </section>
  );
}

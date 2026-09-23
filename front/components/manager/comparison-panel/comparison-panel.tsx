"use client";

import type { MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { ContractorPhoto } from "../shared/contractor-photo";
import { formatDayMonth, humanizeDates } from "../shared/format";
import { Icon } from "../shared/icon";
import type { DateComparison } from "../shared/manager-types";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./comparison-panel.module.css";

function Results({ first, second }: DateComparison) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].comparison;
  const firstIds = new Set(first.cards.map((card) => card.id));
  const secondIds = new Set(second.cards.map((card) => card.id));
  const leftOnly = first.cards.filter((card) => !secondIds.has(card.id));
  const rightOnly = second.cards.filter((card) => !firstIds.has(card.id));
  const columns: { date: string; response: MatchResponse; unique: typeof leftOnly }[] = [
    { date: formatDayMonth("2026-10-16", locale), response: first, unique: leftOnly },
    { date: formatDayMonth("2026-10-23", locale), response: second, unique: rightOnly },
  ];
  return (
    <div className={styles.results}>
      <div className={styles.summary} role="status">
        <strong>{messages.changed(leftOnly.length + rightOnly.length)}</strong>
        <p>{leftOnly.length ? messages.dropped(leftOnly.map((card) => card.anonName).join(", ")) : messages.unchanged}</p>
      </div>
      <div className={styles.columns}>
        {columns.map((column) => {
          const dateStep = column.response.funnel.find((step) => step.step === "date");
          return (
            <section key={column.date} aria-label={column.date}>
              <div className={styles.date}><h3>{column.date}</h3><span>{messages.count(column.response.cards.length)}</span></div>
              {column.response.cards.length ? (
                <ol>
                  {column.response.cards.map((card) => (
                    <li key={card.id}>
                      <ContractorPhoto id={card.id} name={card.anonName} />
                      <span>
                        <strong>{card.anonName}</strong>
                        <small>{card.id}</small>
                        {column.unique.some((item) => item.id === card.id) && <em>{messages.onlyHere}</em>}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : <p className={styles.none}>{messages.empty}</p>}
              {dateStep && (
                <p className={styles.reason}>
                  <b>{messages.dateFilter}:</b> {dateStep.before} → {dateStep.after}{dateStep.before > dateStep.after ? ` · ${humanizeDates(dateStep.removedReason, locale)}` : ""}
                </p>
              )}
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
    <section className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-compare-title">
      <div className={styles.top}>
        <PanelHeading
          titleId="manager-compare-title"
          icon={<Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M12 10v11" /></Icon>}
          title={messages.title}
          description={messages.description}
        />
        <button className={styles.action} type="button" onClick={onCompare} disabled={comparing} aria-busy={comparing}>
          {comparing ? <><span className={styles.spinner} aria-hidden="true" />{messages.loading}</> : <>{messages.action}<Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon></>}
        </button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {comparison && <Results {...comparison} />}
    </section>
  );
}

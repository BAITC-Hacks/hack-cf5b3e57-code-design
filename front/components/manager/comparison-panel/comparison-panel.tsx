"use client";

import type { Locale, MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { ContractorPhoto } from "../shared/contractor-photo";
import { formatDayMonth, humanizeDates } from "../shared/format";
import { Icon } from "../shared/icon";
import type { DateComparison } from "../shared/manager-types";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./comparison-panel.module.css";

/** «16 и 23 октября» / "October 16 and 23" for one month, otherwise both dates in full. */
function formatDatePair(first: string, second: string, and: string, locale: Locale) {
  const sameMonth = first.slice(0, 7) === second.slice(0, 7);
  const firstDay = String(Number(first.slice(8, 10)));
  const secondDay = String(Number(second.slice(8, 10)));
  if (sameMonth && locale === "en") return `${formatDayMonth(first, locale)} ${and} ${secondDay}`;
  if (sameMonth) return `${firstDay} ${and} ${formatDayMonth(second, locale)}`;
  return `${formatDayMonth(first, locale)} ${and} ${formatDayMonth(second, locale)}`;
}

function Results({ first, second, dates }: DateComparison & { dates: [string, string] }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].comparison;
  const firstIds = new Set(first.cards.map((card) => card.id));
  const secondIds = new Set(second.cards.map((card) => card.id));
  const leftOnly = first.cards.filter((card) => !secondIds.has(card.id));
  const rightOnly = second.cards.filter((card) => !firstIds.has(card.id));
  const columns: { date: string; response: MatchResponse; unique: typeof leftOnly }[] = [
    { date: formatDayMonth(dates[0], locale), response: first, unique: leftOnly },
    { date: formatDayMonth(dates[1], locale), response: second, unique: rightOnly },
  ];
  const bothEmpty = first.cards.length === 0 && second.cards.length === 0;
  const changed = leftOnly.length > 0 || rightOnly.length > 0;
  return (
    <div className={styles.results}>
      <div className={styles.summary} role="status">
        <strong>{bothEmpty ? messages.bothEmpty : changed ? `${messages.changed(leftOnly.length + rightOnly.length).split(":")[0]} · ${messages.diff(leftOnly.length, rightOnly.length)}` : messages.changed(0)}</strong>
        {!bothEmpty && <p>{leftOnly.length ? messages.droppedOn(columns[1].date, leftOnly.map((card) => card.anonName).join(", ")) : messages.unchangedOn(columns[0].date)}</p>}
      </div>
      <div className={styles.columns}>
        {columns.map((column) => {
          const dateStep = column.response.funnel.find((step) => step.step === "date");
          return (
            <section key={column.response === first ? "first" : "second"} aria-label={column.date}>
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

export function ComparisonPanel({ comparedDates, comparing, comparison, error, firstDate, onCompare, onSecondDateChange, secondDate }: {
  comparedDates: [string, string] | null;
  comparing: boolean;
  comparison: DateComparison | null;
  error: string | null;
  firstDate: string;
  onCompare: () => void;
  onSecondDateChange: (date: string | null) => void;
  secondDate: string;
}) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].comparison;
  return (
    <section className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-compare-title">
      <div className={styles.top}>
        <PanelHeading
          titleId="manager-compare-title"
          icon={<Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M12 10v11" /></Icon>}
          title={messages.title}
          description={messages.descriptionCurrent}
        />
        <div className={styles.controls}>
          <label className={styles.dateField}>
            <span>{messages.dateLabel}</span>
            <input type="date" value={secondDate} min="2026-09-23" max="2026-12-31" disabled={comparing} onChange={(event) => onSecondDateChange(event.target.value || null)} />
          </label>
          <button className={styles.action} type="button" onClick={onCompare} disabled={comparing || !firstDate || !secondDate} aria-busy={comparing}>
            {comparing ? <><span className={styles.spinner} aria-hidden="true" />{messages.loading}</> : <>{messages.actionDates(formatDatePair(firstDate, secondDate, messages.and, locale))}<Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon></>}
          </button>
        </div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {comparison && comparedDates && <Results {...comparison} dates={comparedDates} />}
    </section>
  );
}

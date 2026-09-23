"use client";

import { useEffect, useRef, useState } from "react";

import type { Locale, MatchRequest, MatchResponse } from "../../../../shared/contract";
import { MatchApiError, requestMatch } from "@/lib/match-api";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { formatDayMonth, formatKzt, formatMonthShort, formatWeekday } from "../format/format";
import { CalendarIcon, SparkIcon } from "../icons/icons";
import styles from "./compare-dates.module.css";

interface CompareState {
  dates: [string, string] | null;
  error: string | null;
  left: MatchResponse | null;
  pending: boolean;
  right: MatchResponse | null;
}

const EMPTY_STATE: CompareState = { dates: null, error: null, left: null, pending: false, right: null };

/** "2026-10-16" + 7 → "2026-10-23" (UTC, no timezone drift). */
function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

/** «16 и 23 октября» when both dates share a month, otherwise «30 сентября и 7 октября». */
function formatDatePair(first: string, second: string, copy: MatchMessages, locale: Locale) {
  const sameMonth = first.slice(0, 7) === second.slice(0, 7);
  const firstLabel = sameMonth ? dayNumber(first) : formatDayMonth(first, locale);
  return `${firstLabel} ${copy.compareAnd} ${formatDayMonth(second, locale)}`;
}

function dayNumber(isoDate: string) {
  const day = Number(isoDate.slice(8, 10));
  return day ? String(day) : "";
}

export function CompareDates({ copy, locale, request }: { copy: MatchMessages; locale: Locale; request: MatchRequest }) {
  const [state, setState] = useState<CompareState>(EMPTY_STATE);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const firstDate = request.date;
  // Date B follows the form date (+7 days) until the client picks it explicitly.
  const secondDate = customDate ?? addDays(firstDate, 7);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function runComparison() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const dates: [string, string] = [firstDate, secondDate];
    setState({ dates, error: null, left: null, pending: true, right: null });

    try {
      // Full current form request — only the date differs between the two runs.
      const [left, right] = await Promise.all([
        requestMatch({ ...request, date: dates[0] }, controller.signal),
        requestMatch({ ...request, date: dates[1] }, controller.signal),
      ]);
      setState({ dates, error: null, left, pending: false, right });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({
        dates,
        error: error instanceof MatchApiError ? error.message : copy.errors.compare,
        left: null,
        pending: false,
        right: null,
      });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  return (
    <section className={styles.section} aria-labelledby="compare-dates-title">
      <div className={styles.intro}>
        <p>{copy.compareKicker}</p>
        <h2 id="compare-dates-title">{copy.compareTitle}</h2>
        <span>{copy.compareTextCurrent}</span>
        <label className={styles.dateField}>
          <span>{copy.compareWithDate}</span>
          <input
            max="2026-12-31"
            min="2026-09-23"
            onChange={(event) => setCustomDate(event.target.value || null)}
            type="date"
            value={secondDate}
          />
        </label>
        <button disabled={state.pending || !firstDate || !secondDate} onClick={() => void runComparison()} type="button">
          <CalendarIcon />
          {state.pending ? copy.compareBusy : copy.compareButtonDates.replace("{dates}", formatDatePair(firstDate, secondDate, copy, locale))}
        </button>
      </div>

      <div className={styles.canvas} aria-live="polite">
        {state.pending && (
          <div className={styles.loading}>
            <span /><span /><span />
            <p>{copy.compareBusy}</p>
          </div>
        )}

        {state.error && <p className={styles.error}>{state.error}</p>}

        {!state.pending && !state.error && state.left && state.right && state.dates && (
          <div className={styles.results}>
            <ComparisonResults copy={copy} dates={state.dates} left={state.left} locale={locale} right={state.right} />
          </div>
        )}

        {!state.pending && !state.error && !state.left && (
          <div className={styles.placeholder} aria-hidden="true">
            <div><span>{dayNumber(firstDate)}</span><small>{formatMonthShort(firstDate, locale)}</small></div>
            <span className={styles.line} />
            <SparkIcon />
            <span className={styles.line} />
            <div><span>{dayNumber(secondDate)}</span><small>{formatMonthShort(secondDate, locale)}</small></div>
          </div>
        )}
      </div>
    </section>
  );
}

function ComparisonResults({ copy, dates, left, locale, right }: { copy: MatchMessages; dates: [string, string]; left: MatchResponse; locale: Locale; right: MatchResponse }) {
  const leftIds = new Set(left.cards.map((card) => card.id));
  const rightIds = new Set(right.cards.map((card) => card.id));
  const dropped = left.cards.filter((card) => !rightIds.has(card.id)).length;
  const added = right.cards.filter((card) => !leftIds.has(card.id)).length;
  const bothEmpty = left.cards.length === 0 && right.cards.length === 0;
  const changed = dropped > 0 || added > 0;
  const [leftDate, rightDate] = dates;
  const title = bothEmpty ? copy.compareBothEmpty : changed ? copy.compareChanged : copy.compareUnchanged;
  const text = bothEmpty
    ? copy.compareBothEmptyText
    : changed
      ? `${copy.compareDiff.replace("{out}", String(dropped)).replace("{in}", String(added))}. ${copy.compareChangedText}`
      : copy.compareUnchangedText;

  return (
    <>
      <div className={styles.summary}>
        <span className={changed || bothEmpty ? styles.changedDot : styles.sameDot} />
        <div><strong>{title}</strong><small>{text}</small></div>
      </div>
      <div className={styles.columns}>
        <ComparisonDate date={leftDate} label={formatDayMonth(leftDate, locale)} locale={locale} response={left} otherIds={rightIds} changedLabel={copy.compareNotOn.replace("{date}", formatDayMonth(rightDate, locale))} sameLabel={copy.compareSame} />
        <ComparisonDate date={rightDate} label={formatDayMonth(rightDate, locale)} locale={locale} response={right} otherIds={leftIds} changedLabel={copy.compareNotOn.replace("{date}", formatDayMonth(leftDate, locale))} sameLabel={copy.compareSame} />
      </div>
    </>
  );
}

function ComparisonDate({ changedLabel, date, label, locale, otherIds, response, sameLabel }: { changedLabel: string; date: string; label: string; locale: Locale; otherIds: Set<string>; response: MatchResponse; sameLabel: string }) {
  return (
    <div className={styles.dateColumn}>
      <div className={styles.dateHeading}>
        <CalendarIcon />
        <span><strong>{label}</strong><small>{formatWeekday(date, locale)}</small></span>
      </div>
      <ol>
        {response.cards.map((card, index) => {
          const same = otherIds.has(card.id);
          return (
            <li key={card.id}>
              <span className={styles.rank} aria-hidden="true">{index + 1}</span>
              <span><strong>{card.anonName}</strong><small>{formatKzt(card.priceFromKzt, locale)}</small></span>
              <em className={same ? styles.same : styles.changed}>{same ? sameLabel : changedLabel}</em>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

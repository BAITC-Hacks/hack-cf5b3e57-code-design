"use client";

import { useEffect, useRef, useState } from "react";

import type { Locale, MatchRequest, MatchResponse } from "../../../../shared/contract";
import { MatchApiError, requestMatch } from "@/lib/match-api";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { formatKzt, formatMonthShort, formatWeekday } from "../format/format";
import { CalendarIcon, SparkIcon } from "../icons/icons";
import styles from "./compare-dates.module.css";

interface CompareState {
  error: string | null;
  left: MatchResponse | null;
  pending: boolean;
  right: MatchResponse | null;
}

const EMPTY_STATE: CompareState = { error: null, left: null, pending: false, right: null };

export function CompareDates({ copy, locale }: { copy: MatchMessages; locale: Locale }) {
  const [state, setState] = useState<CompareState>(EMPTY_STATE);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function runComparison() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ error: null, left: null, pending: true, right: null });

    const request: MatchRequest = {
      budgetKzt: 1_000_000,
      category: "Ведущий",
      city: "Алматы",
      date: "2026-10-16",
      eventType: "корпоратив",
      locale,
    };

    try {
      const [left, right] = await Promise.all([
        requestMatch(request, controller.signal),
        requestMatch({ ...request, date: "2026-10-23" }, controller.signal),
      ]);
      setState({ error: null, left, pending: false, right });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({
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
        <span>{copy.compareText}</span>
        <button disabled={state.pending} onClick={() => void runComparison()} type="button">
          <CalendarIcon />
          {state.pending ? copy.compareBusy : copy.compareButton}
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

        {!state.pending && !state.error && state.left && state.right && (
          <div className={styles.results}>
            <ComparisonResults copy={copy} left={state.left} locale={locale} right={state.right} />
          </div>
        )}

        {!state.pending && !state.error && !state.left && (
          <div className={styles.placeholder} aria-hidden="true">
            <div><span>16</span><small>{formatMonthShort("2026-10-16", locale)}</small></div>
            <span className={styles.line} />
            <SparkIcon />
            <span className={styles.line} />
            <div><span>23</span><small>{formatMonthShort("2026-10-23", locale)}</small></div>
          </div>
        )}
      </div>
    </section>
  );
}

function ComparisonResults({ copy, left, locale, right }: { copy: MatchMessages; left: MatchResponse; locale: Locale; right: MatchResponse }) {
  const leftIds = new Set(left.cards.map((card) => card.id));
  const rightIds = new Set(right.cards.map((card) => card.id));
  const changed = left.cards.some((card) => !rightIds.has(card.id)) || right.cards.some((card) => !leftIds.has(card.id));

  return (
    <>
      <div className={styles.summary}>
        <span className={changed ? styles.changedDot : styles.sameDot} />
        <div><strong>{changed ? copy.compareChanged : copy.compareUnchanged}</strong><small>{changed ? copy.compareChangedText : copy.compareUnchangedText}</small></div>
      </div>
      <div className={styles.columns}>
        <ComparisonDate date="2026-10-16" label={copy.compareLeft} locale={locale} response={left} otherIds={rightIds} changedLabel={copy.compareLostRight} sameLabel={copy.compareSame} />
        <ComparisonDate date="2026-10-23" label={copy.compareRight} locale={locale} response={right} otherIds={leftIds} changedLabel={copy.compareLostLeft} sameLabel={copy.compareSame} />
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


"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { Locale, MatchRequest, MatchResponse } from "../../../../shared/contract";
import { MatchApiError, requestMatch } from "@/lib/match-api";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CalendarIcon, SparkIcon } from "../icons/icons";
import styles from "./compare-dates.module.css";

interface CompareState {
  error: string | null;
  left: MatchResponse | null;
  pending: boolean;
  right: MatchResponse | null;
}

const EMPTY_STATE: CompareState = { error: null, left: null, pending: false, right: null };

function localeTag(locale: Locale) {
  return locale === "kk" ? "kk-KZ" : locale === "en" ? "en-GB" : "ru-RU";
}

function formatShortDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), { day: "numeric", month: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function monthLabel(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), { month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "")
    .toLocaleUpperCase(localeTag(locale));
}

export function CompareDates({ copy, locale }: { copy: MatchMessages; locale: Locale }) {
  const [state, setState] = useState<CompareState>(EMPTY_STATE);
  const controllerRef = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();

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
    <section className={styles.section}>
      <div className={styles.intro}>
        <p>{copy.compareKicker}</p>
        <h2>{copy.compareTitle}</h2>
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
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className={styles.results}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            <ComparisonResults copy={copy} left={state.left} locale={locale} right={state.right} />
          </motion.div>
        )}

        {!state.pending && !state.error && !state.left && (
          <div className={styles.placeholder} aria-hidden="true">
            <div><span>16</span><small>{monthLabel("2026-10-16", locale)}</small></div>
            <span className={styles.line} />
            <SparkIcon />
            <span className={styles.line} />
            <div><span>23</span><small>{monthLabel("2026-10-23", locale)}</small></div>
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
        <div><strong>{copy.compareChanged}</strong><small>{copy.compareChangedText}</small></div>
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
        <span><strong>{label}</strong><small>{formatShortDate(date, locale)}</small></span>
      </div>
      <ol>
        {response.cards.map((card, index) => {
          const same = otherIds.has(card.id);
          return (
            <li key={card.id}>
              <span className={styles.rank}>{index + 1}</span>
              <span><strong>{card.anonName}</strong><small>{card.id}</small></span>
              <em className={same ? styles.same : styles.changed}>{same ? sameLabel : changedLabel}</em>
            </li>
          );
        })}
      </ol>
    </div>
  );
}


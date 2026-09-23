"use client";

import type { Locale, MatchResponse } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CriteriaList } from "../criteria-list/criteria-list";
import { FunnelSummary } from "../funnel-summary/funnel-summary";
import { SparkIcon } from "../icons/icons";
import { MatchCard } from "../match-card/match-card";
import { OutcomeBanner } from "../outcome-banner/outcome-banner";
import styles from "./match-results.module.css";

interface MatchResultsProps {
  copy: MatchMessages;
  locale: Locale;
  result: MatchResponse;
  sectionRef: React.Ref<HTMLElement>;
}

export function MatchResults({ copy, locale, result, sectionRef }: MatchResultsProps) {
  const hasCards = result.cards.length > 0;
  const emptyAdvice = result.outcome === "no_category_in_city" ? copy.emptyActionCity : copy.emptyAction;

  return (
    <section
      aria-label={copy.resultKicker}
      className={styles.results}
      ref={sectionRef}
      tabIndex={-1}
    >
      <OutcomeBanner copy={copy} locale={locale} result={result} showSummary={hasCards} />

      <CriteriaList
        copy={copy}
        criteria={result.criteria}
        editLabel={hasCards ? undefined : copy.editRequest}
        hint={hasCards || !result.summary ? undefined : emptyAdvice}
        locale={locale}
        message={hasCards ? undefined : result.summary || emptyAdvice}
        variant={hasCards ? "found" : "sorry"}
      />

      {hasCards && (
        <div className={styles.cardsSection}>
          <div className={styles.heading}>
            <h2>{copy.cardsTitle}</h2>
            <span>{result.cards.length} / 3</span>
          </div>
          <div className={styles.grid} data-count={result.cards.length}>
            {result.cards.map((card, index) => (
              <div className={styles.cell} key={card.id}>
                <MatchCard
                  card={card}
                  categories={copy.categories}
                  cities={copy.cities}
                  copy={copy.card}
                  locale={locale}
                  rank={index + 1}
                />
              </div>
            ))}
            {result.cards.length < 3 && (
              <div className={styles.emptySlot} data-span={3 - result.cards.length}>
                <SparkIcon aria-hidden="true" />
                <strong>{copy.emptySlot.title}</strong>
                <span>{copy.emptySlot.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <FunnelSummary copy={copy} funnel={result.funnel} locale={locale} />
    </section>
  );
}

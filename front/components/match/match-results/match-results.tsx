"use client";

import type { Locale, MatchResponse } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CriteriaList } from "../criteria-list/criteria-list";
import { FunnelSummary } from "../funnel-summary/funnel-summary";
import { MatchCard } from "../match-card/match-card";
import { MascotGuide } from "../mascot-guide/mascot-guide";
import { OutcomeBanner } from "../outcome-banner/outcome-banner";
import styles from "./match-results.module.css";

interface MatchResultsProps {
  copy: MatchMessages;
  locale: Locale;
  result: MatchResponse;
  sectionRef: React.Ref<HTMLElement>;
}

export function MatchResults({ copy, locale, result, sectionRef }: MatchResultsProps) {
  return (
    <section
      className={styles.results}
      ref={sectionRef}
      tabIndex={-1}
    >
      <OutcomeBanner copy={copy} result={result} />
      <div className={styles.mascot}>
        <MascotGuide
          copy={copy.mascot}
          message={
            result.outcome === "found"
              ? (result.criteria[0] ?? result.summary)
              : result.summary
          }
          variant={result.outcome === "found" ? "found" : "sorry"}
        />
      </div>
      <CriteriaList copy={copy} criteria={result.criteria} />

      {result.cards.length > 0 ? (
        <div className={styles.cardsSection}>
          <div className={styles.heading}>
            <h2>{copy.cardsTitle}</h2>
            <span>{result.cards.length} / 3</span>
          </div>
          <div className={styles.grid}>
            {result.cards.map((card, index) => (
              <div key={card.id}>
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
          </div>
        </div>
      ) : (
        <p className={styles.empty}>{copy.emptyAction}</p>
      )}

      <FunnelSummary copy={copy} funnel={result.funnel} />
    </section>
  );
}

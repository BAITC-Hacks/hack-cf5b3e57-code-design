"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { Locale, MatchResponse } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CriteriaList } from "../criteria-list/criteria-list";
import { FunnelSummary } from "../funnel-summary/funnel-summary";
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={styles.results}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      ref={sectionRef}
      tabIndex={-1}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <OutcomeBanner copy={copy} result={result} />
      <CriteriaList copy={copy} criteria={result.criteria} />

      {result.cards.length > 0 ? (
        <div className={styles.cardsSection}>
          <div className={styles.heading}>
            <h2>{copy.cardsTitle}</h2>
            <span>{result.cards.length} / 3</span>
          </div>
          <div className={styles.grid}>
            {result.cards.map((card, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                key={card.id}
                transition={{
                  delay: reduceMotion ? 0 : 0.08 + index * 0.09,
                  duration: reduceMotion ? 0 : 0.38,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <MatchCard
                  card={card}
                  categories={copy.categories}
                  cities={copy.cities}
                  copy={copy.card}
                  locale={locale}
                  rank={index + 1}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>{copy.emptyAction}</p>
      )}

      <FunnelSummary copy={copy} funnel={result.funnel} />
    </motion.section>
  );
}

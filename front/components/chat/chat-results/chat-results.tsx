"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Ref } from "react";

import type { Locale, MatchResponse } from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { ChatResultCard } from "../chat-result-card/chat-result-card";
import { humanizeDates } from "../format-dates";
import styles from "./chat-results.module.css";

interface ChatResultsProps {
  copy: ChatMessages;
  locale: Locale;
  result: MatchResponse;
  sectionRef: Ref<HTMLElement>;
}

export function ChatResults({ copy, locale, result, sectionRef }: ChatResultsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={styles.results}
      id="chat-results"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      ref={sectionRef}
      tabIndex={-1}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.outcome} data-outcome={result.outcome}>
        <div>
          <p>{copy.result.eyebrow}</p>
          <h2>{copy.result.outcome[result.outcome]}</h2>
        </div>
        <span>{result.cards.length} / 3</span>
        <p>{humanizeDates(result.summary, locale)}</p>
      </div>

      {result.criteria.length > 0 && (
        <div className={styles.criteria}>
          <h3>{copy.result.criteria}</h3>
          <ul>
            {result.criteria.map((criterion, index) => (
              <li key={`${criterion}-${index}`}>
                <span aria-hidden="true">{index + 1}</span>
                {humanizeDates(criterion, locale)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.cards.length > 0 ? (
        <div className={styles.cardSection}>
          <h3>{copy.result.cards}</h3>
          <div className={styles.grid}>
            {result.cards.map((card, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                key={card.id}
                transition={{
                  delay: reduceMotion ? 0 : 0.08 + index * 0.08,
                  duration: reduceMotion ? 0 : 0.34,
                }}
              >
                <ChatResultCard card={card} copy={copy} locale={locale} rank={index + 1} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.empty}>{copy.result.emptyHint}</p>
      )}
    </motion.section>
  );
}

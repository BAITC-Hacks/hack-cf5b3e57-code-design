"use client";

import type { MatchCard, MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { ManagerContractorCard } from "../manager-contractor-card";
import { FactTable } from "../fact-table/fact-table";
import { Icon } from "../shared/icon";
import styles from "./manager-results.module.css";

export function ManagerResults({ cards, result }: { cards: MatchCard[]; result: MatchResponse | null }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].cards;
  if (!cards.length && !result) return null;
  const outcome = result ? messages.outcomes[result.outcome] : null;
  return (
    <>
    <section className={styles.panel} aria-live="polite">
      <div className={styles.heading}><div><span>{messages.section}</span><h2>{messages.title}</h2><p>{messages.description}</p></div>{result && outcome && <strong className={styles[result.outcome]}>{outcome.label}</strong>}</div>
      {result && outcome && <div className={`${styles.outcome} ${styles[`outcome_${result.outcome}`]}`}><strong>{outcome.title}</strong><p>{result.summary}</p></div>}
      {cards.length ? <div className={styles.grid}>{cards.map((card, index) => <ManagerContractorCard card={card} position={index + 1} key={card.id} />)}</div> : <div className={styles.empty}><Icon><path d="M4 6h16v12H4zM8 10h8M8 14h5" /></Icon><p>{result?.summary}</p></div>}
    </section>
    <FactTable cards={cards} />
    </>
  );
}

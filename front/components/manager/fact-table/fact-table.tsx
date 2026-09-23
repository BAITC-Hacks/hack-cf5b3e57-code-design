"use client";

import Link from "next/link";
import type { FactKey, MatchCard } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./fact-table.module.css";

const CATALOG_FIELDS: Record<FactKey, string> = {
  budget: "price_from_kzt",
  format: "event_formats",
  language: "languages",
  hours: "max_hours",
  date: "busy_dates",
  signal: "signals",
  description: "description",
};

export function FactTable({ cards }: { cards: MatchCard[] }) {
  const { locale } = useLocale();
  const { factTable: copy, cards: labels } = MANAGER_MESSAGES[locale];
  const facts = cards.flatMap((card) => card.factsUsed.map((fact, index) => ({ card, fact, index })));
  const verifiedCount = facts.filter(({ fact }) => fact.verified).length;

  return (
    <section className={styles.panel}>
      <div className={styles.heading}><h2>{copy.title}</h2><span>{labels.verified}: {verifiedCount}/{facts.length}</span></div>
      <p className={styles.description}>{copy.description}</p>
      {facts.length ? (
        <div className={styles.scroll} tabIndex={0} role="region" aria-label={copy.title}>
          <table>
            <thead><tr><th scope="col">{copy.profile}</th><th scope="col">{copy.claim}</th><th scope="col">{copy.field}</th><th scope="col">{copy.status}</th></tr></thead>
            <tbody>{facts.map(({ card, fact, index }) => (
              <tr key={`${card.id}-${fact.key}-${index}`}>
                <th scope="row"><Link href={`/contractor/${card.id}`}>{card.anonName}</Link></th>
                <td lang="ru">{fact.label}</td>
                <td>{CATALOG_FIELDS[fact.key]}</td>
                <td><span className={fact.verified ? styles.verified : styles.claimed}><span aria-hidden="true">{fact.verified ? "✓" : "○"}</span>{fact.verified ? labels.verified : labels.claimed}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className={styles.description}>{copy.empty}</p>}
    </section>
  );
}

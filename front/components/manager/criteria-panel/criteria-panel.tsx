"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./criteria-panel.module.css";

export function CriteriaPanel({ criteria, rankedIds }: { criteria: string[]; rankedIds: string[] }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].insights;
  return (
    <>
      <article className={styles.panel}>
        <div className={styles.heading}><span>{messages.criteria}</span><strong>{criteria.length || "—"}</strong></div>
        {criteria.length ? <ol>{criteria.map((criterion, index) => <li key={`${criterion}-${index}`}><span>{index + 1}</span>{criterion}</li>)}</ol> : <p>{messages.criteriaEmpty}</p>}
      </article>
      <article className={styles.panel}>
        <div className={styles.heading}><span>{messages.ranking}</span><strong>{rankedIds.length || "—"}</strong></div>
        {rankedIds.length ? <ol className={styles.ranking}>{rankedIds.map((id, index) => <li key={id}><span>{index + 1}</span><span>{id}</span></li>)}</ol> : <p>{messages.rankingEmpty}</p>}
      </article>
    </>
  );
}

"use client";

import type { MatchCard } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { humanizeDates } from "../shared/format";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./criteria-panel.module.css";

export function CriteriaPanel({ criteria, rankedIds, cards = [], finished = false }: { criteria: string[]; rankedIds: string[]; cards?: MatchCard[]; finished?: boolean }) {
  const { locale } = useLocale();
  const { insights: messages, pipeline } = MANAGER_MESSAGES[locale];
  const names = new Map(cards.map((card) => [card.id, card.anonName]));
  return (
    <>
      <article className={panelStyles.panel} aria-labelledby="manager-criteria-title">
        <PanelHeading
          titleId="manager-criteria-title"
          icon={<Icon><path d="M11 4.5 12.8 9.7 18 11.5l-5.2 1.8L11 18.5l-1.8-5.2L4 11.5l5.2-1.8L11 4.5Z" /><path d="M18.5 3v3.5M16.75 4.75h3.5" /></Icon>}
          title={messages.criteria}
          aside={criteria.length ? <span className={styles.count}>{criteria.length}</span> : null}
        />
        {criteria.length
          ? <ol className={`${styles.list} ${styles.criteria}`}>{criteria.map((criterion, index) => <li key={`${criterion}-${index}`}><span aria-hidden="true">{index + 1}</span><span>{humanizeDates(criterion, locale)}</span></li>)}</ol>
          : <p className={styles.empty}>{messages.criteriaEmpty}</p>}
      </article>
      <article className={panelStyles.panel} aria-labelledby="manager-ranking-title">
        <PanelHeading
          titleId="manager-ranking-title"
          icon={<Icon><path d="M7 18V9m5 9V5m5 13v-6" /></Icon>}
          title={messages.ranking}
          aside={rankedIds.length ? <span className={styles.count}>{rankedIds.length}</span> : null}
        />
        {rankedIds.length
          ? <ol className={`${styles.list} ${styles.ranking}`}>{rankedIds.map((id, index) => {
            const name = names.get(id);
            return <li key={id}><span aria-hidden="true">{index + 1}</span><span className={styles.name}>{name ? <><strong>{name}</strong><small>{id}</small></> : <strong>{id}</strong>}</span></li>;
          })}</ol>
          : <p className={styles.empty}>{finished ? pipeline.rankedEmpty : messages.rankingEmpty}</p>}
      </article>
    </>
  );
}

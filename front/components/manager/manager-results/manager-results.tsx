"use client";

import type { MatchCard, MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { ManagerContractorCard } from "../manager-contractor-card";
import { FactTable } from "../fact-table/fact-table";
import { humanizeDates } from "../shared/format";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./manager-results.module.css";

function OutcomeIcon({ outcome }: { outcome: MatchResponse["outcome"] }) {
  if (outcome === "found") return <Icon><path d="m5 12.5 4.3 4.3L19 7" /></Icon>;
  if (outcome === "no_category_in_city") return <Icon><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><path d="m9.5 7.5 5 5M14.5 7.5l-5 5" /></Icon>;
  return <Icon><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M10 13.5l4 4M14 13.5l-4 4" /></Icon>;
}

export function ManagerResults({ cards, result }: { cards: MatchCard[]; result: MatchResponse | null }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].cards;
  if (!cards.length && !result) return null;
  const outcome = result ? messages.outcomes[result.outcome] : null;
  return (
    <>
      <section className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-results-title" aria-live="polite">
        <PanelHeading
          titleId="manager-results-title"
          icon={<Icon><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h5" /></Icon>}
          title={messages.title}
          description={messages.description}
          asideBelow
          aside={result && outcome ? <strong className={`${styles.badge} ${styles[result.outcome]}`}>{outcome.label}</strong> : null}
        />
        {result && outcome && (
          <div className={`${styles.outcome} ${styles[`outcome_${result.outcome}`]}`}>
            <span className={styles.outcomeIcon} aria-hidden="true"><OutcomeIcon outcome={result.outcome} /></span>
            <div><strong>{outcome.title}</strong><p>{humanizeDates(result.summary, locale)}</p></div>
          </div>
        )}
        {cards.length
          ? <div className={styles.grid}>{cards.map((card, index) => <ManagerContractorCard card={card} position={index + 1} key={card.id} />)}</div>
          : <div className={styles.empty}><Icon><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Icon><p>{messages.emptyHint}</p></div>}
      </section>
      {cards.length > 0 && <FactTable cards={cards} />}
    </>
  );
}

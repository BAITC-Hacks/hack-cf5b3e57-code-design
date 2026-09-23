"use client";

import Link from "next/link";

import {
  CheckStatusIcon,
  ClaimedStatusIcon,
} from "@/components/shared/status-icons/status-icons";
import type { FactKey, MatchCard } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./fact-table.module.css";

/** Catalog column behind each fact — shown as a tooltip for technical reviewers. */
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
  const groups = cards.filter((card) => card.factsUsed.length > 0);
  const facts = groups.flatMap((card) => card.factsUsed);
  const verifiedCount = facts.filter((fact) => fact.verified).length;

  return (
    <section className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-facts-title">
      <PanelHeading
        titleId="manager-facts-title"
        icon={<Icon><path d="M9 11l2 2 4-4" /><path d="M5 4h14v16H5z" /></Icon>}
        title={copy.title}
        description={copy.description}
        asideBelow
        aside={facts.length ? <span className={styles.summary}><CheckStatusIcon />{copy.summary(verifiedCount, facts.length)}</span> : null}
      />
      {facts.length ? (
        <div className={styles.scroll} tabIndex={0} role="region" aria-label={copy.title}>
          <table>
            <thead><tr><th scope="col">{copy.profile}</th><th scope="col">{copy.claim}</th><th scope="col">{copy.field}</th><th scope="col">{copy.status}</th></tr></thead>
            {groups.map((card) => (
              <tbody key={card.id}>
                {card.factsUsed.map((fact, index) => (
                  <tr key={`${fact.key}-${index}`} className={index === 0 ? styles.groupStart : undefined}>
                    {index === 0 && <th scope="rowgroup" rowSpan={card.factsUsed.length} className={styles.nameCell}><Link href={`/contractor/${encodeURIComponent(card.id)}`}>{card.anonName}</Link></th>}
                    <td className={styles.claimCell} lang="ru">{fact.label}</td>
                    <td className={`${styles.field} ${styles.fieldCell}`} data-label={copy.field} title={CATALOG_FIELDS[fact.key]}>{copy.fields[fact.key] ?? fact.key}</td>
                    <td className={styles.statusCell}>
                      <span className={`${styles.status} ${fact.verified ? styles.verified : styles.claimed}`}>
                        {fact.verified ? <CheckStatusIcon /> : <ClaimedStatusIcon />}{fact.verified ? labels.verified : labels.claimed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      ) : <p className={styles.empty}>{copy.empty}</p>}
    </section>
  );
}

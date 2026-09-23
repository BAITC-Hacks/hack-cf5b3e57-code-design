import Image from "next/image";

import type { Locale } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { humanizeDates } from "../format/format";
import { ArrowIcon } from "../icons/icons";
import styles from "./criteria-list.module.css";

interface CriteriaListProps {
  copy: MatchMessages;
  criteria: string[];
  locale: Locale;
  /** Nurlan's own line; used when nothing matched (the service summary). */
  message?: string;
  /** Short next-step advice shown under Nurlan's line. */
  hint?: string;
  /** Link back to the form when nothing matched. */
  editLabel?: string;
  variant: "found" | "sorry";
}

/** Nurlan presents "what to look for" — one aligned panel instead of a floating bubble + separate list. */
export function CriteriaList({ copy, criteria, editLabel, hint, locale, message, variant }: CriteriaListProps) {
  if (criteria.length === 0 && !message) return null;

  return (
    <section className={`${styles.panel} ${variant === "sorry" ? styles.sorry : ""}`} aria-label={copy.mascot.name}>
      <div className={styles.avatar}>
        <Image alt={copy.mascot.alt[variant]} fill sizes="(max-width: 680px) 64px, 112px" src={`/mascot/nurlan-${variant}.webp`} />
      </div>

      <div className={styles.head}>
        <p className={styles.name}>{copy.mascot.name}</p>
        {message ? (
          <p className={styles.message}>{humanizeDates(message, locale)}</p>
        ) : (
          <h3>{copy.criteriaTitle}</h3>
        )}
        {hint && <p className={styles.hint}>{hint}</p>}
        {editLabel && (
          <a className={styles.edit} href="#match-form">
            {editLabel}
            <ArrowIcon aria-hidden="true" />
          </a>
        )}
      </div>

      {criteria.length > 0 && (
        <div className={styles.body}>
          {message && <h3>{copy.criteriaTitle}</h3>}
          <ol>
            {criteria.map((criterion, index) => (
              <li key={`${criterion}-${index}`}>
                <span aria-hidden="true">{index + 1}</span>
                <p>{humanizeDates(criterion, locale)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

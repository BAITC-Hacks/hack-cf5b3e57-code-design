import type { FunnelStep, FunnelStepName, Locale } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { humanizeDates } from "../format/format";
import { SlidersIcon } from "../icons/icons";
import styles from "./funnel-summary.module.css";

interface FunnelSummaryProps {
  copy: MatchMessages;
  funnel: FunnelStep[];
  locale: Locale;
}

export function FunnelSummary({ copy, funnel, locale }: FunnelSummaryProps) {
  if (funnel.length === 0) return null;
  const first = funnel[0]?.before ?? 0;
  const last = funnel.at(-1)?.after ?? 0;

  return (
    <details className={styles.funnel}>
      <summary className={styles.toggle}>
        <span className={styles.toggleIcon} aria-hidden="true"><SlidersIcon /></span>
        <span className={styles.toggleText}>
          <strong>{copy.exclusionsTitle}</strong>
          <small>{copy.funnelTitle}</small>
        </span>
        <span className={styles.total}>{first} → {last}</span>
        <svg className={styles.chevron} aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
      </summary>

      <div className={styles.content}>
        <p className={styles.hint}>{copy.funnelHint}</p>
        <ol>
          {funnel.map((step, index) => {
            const removed = step.before - step.after;
            return (
              <li className={removed > 0 ? undefined : styles.quiet} key={`${step.step}-${index}`}>
                <span className={styles.number} aria-hidden="true">{index + 1}</span>
                <span className={styles.copy}>
                  <strong>{copy.funnelNames[step.step as FunnelStepName] ?? step.step}</strong>
                  {removed > 0 && step.removedReason && <small>{humanizeDates(step.removedReason, locale)}</small>}
                </span>
                <span className={styles.count}>
                  <strong>{step.before} → {step.after}</strong>
                  {removed > 0 && <small>−{removed} {copy.funnelRemoved}</small>}
                </span>
              </li>
            );
          })}
        </ol>
        <p className={styles.note}>{copy.exclusionsNote}</p>
      </div>
    </details>
  );
}

import type { FunnelStep, FunnelStepName } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { SlidersIcon } from "../icons/icons";
import styles from "./funnel-summary.module.css";

export function FunnelSummary({ copy, funnel }: { copy: MatchMessages; funnel: FunnelStep[] }) {
  return (
    <div className={styles.funnel}>
      <div className={styles.heading}>
        <div>
          <SlidersIcon />
          <span>
            <h3>{copy.funnelTitle}</h3>
            <p>{copy.funnelHint}</p>
          </span>
        </div>
        <strong>{funnel[0]?.before ?? 0} → {funnel.at(-1)?.after ?? 0}</strong>
      </div>
      <ol>
        {funnel.map((step, index) => (
          <li key={`${step.step}-${index}`}>
            <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.copy}>
              <strong>{copy.funnelNames[step.step as FunnelStepName]}</strong>
              <small>{step.removedReason}</small>
            </span>
            <span className={styles.count}>
              <strong>{step.before} → {step.after}</strong>
              <small>−{step.before - step.after} {copy.funnelRemoved}</small>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}


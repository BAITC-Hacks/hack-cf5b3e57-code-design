import type { MatchOutcome, MatchResponse } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CheckIcon, SlidersIcon, UsersIcon } from "../icons/icons";
import styles from "./outcome-banner.module.css";

function variant(outcome: MatchOutcome) {
  if (outcome === "found") return styles.found;
  if (outcome === "no_category_in_city") return styles.missing;
  return styles.filtered;
}

function OutcomeIcon({ outcome }: { outcome: MatchOutcome }) {
  if (outcome === "found") return <CheckIcon />;
  if (outcome === "no_category_in_city") return <UsersIcon />;
  return <SlidersIcon />;
}

export function OutcomeBanner({ copy, result }: { copy: MatchMessages; result: MatchResponse }) {
  return (
    <div className={`${styles.banner} ${variant(result.outcome)}`}>
      <span className={styles.icon}><OutcomeIcon outcome={result.outcome} /></span>
      <div>
        <p>{copy.resultKicker}</p>
        <h2>{copy.outcomes[result.outcome].title}</h2>
        <span>{result.summary}</span>
      </div>
      <strong>{copy.outcomes[result.outcome].label}</strong>
    </div>
  );
}


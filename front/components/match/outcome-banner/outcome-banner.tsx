import type { MatchOutcome, MatchResponse } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CheckIcon, SlidersIcon, UsersIcon } from "../icons/icons";
import styles from "./outcome-banner.module.css";

function variant(result: MatchResponse) {
  if (result.outcome !== "found" || result.cards.length === 0) return styles.empty;
  return result.cards.length < 3 ? styles.partial : styles.found;
}

function OutcomeIcon({ outcome }: { outcome: MatchOutcome }) {
  if (outcome === "found") return <CheckIcon />;
  if (outcome === "no_category_in_city") return <UsersIcon />;
  return <SlidersIcon />;
}

export function OutcomeBanner({ copy, result }: { copy: MatchMessages; result: MatchResponse }) {
  const partial = result.outcome === "found" && result.cards.length > 0 && result.cards.length < 3;
  const outcomeCopy = partial ? copy.partialOutcome : copy.outcomes[result.outcome];
  return (
    <div className={`${styles.banner} ${variant(result)}`}>
      <span className={styles.icon}>{partial ? <UsersIcon /> : <OutcomeIcon outcome={result.outcome} />}</span>
      <div>
        <p>{copy.resultKicker}</p>
        <h2>{outcomeCopy.title}</h2>
        <span>{result.summary}</span>
      </div>
      <strong>{outcomeCopy.label}</strong>
    </div>
  );
}


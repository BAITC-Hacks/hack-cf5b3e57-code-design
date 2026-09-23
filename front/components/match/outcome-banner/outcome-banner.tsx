import type { Locale, MatchOutcome, MatchResponse } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { humanizeDates } from "../format/format";
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

interface OutcomeBannerProps {
  copy: MatchMessages;
  locale: Locale;
  result: MatchResponse;
  /** The summary can be voiced by Nurlan instead, to avoid saying it twice. */
  showSummary?: boolean;
}

export function OutcomeBanner({ copy, locale, result, showSummary = true }: OutcomeBannerProps) {
  const partial = result.outcome === "found" && result.cards.length > 0 && result.cards.length < 3;
  const outcomeCopy = partial ? copy.partialOutcome : copy.outcomes[result.outcome];
  return (
    <div className={`${styles.banner} ${variant(result)}`}>
      <span className={styles.icon} aria-hidden="true">{partial ? <UsersIcon /> : <OutcomeIcon outcome={result.outcome} />}</span>
      <div className={styles.text}>
        <p>{copy.resultKicker}</p>
        <h2>{outcomeCopy.title}</h2>
        {showSummary && result.summary && <span>{humanizeDates(result.summary, locale)}</span>}
      </div>
      <strong className={styles.label}>{outcomeCopy.label}</strong>
    </div>
  );
}

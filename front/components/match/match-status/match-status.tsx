import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CheckIcon, SparkIcon } from "../icons/icons";
import styles from "./match-status.module.css";

interface MatchStatusProps {
  copy: MatchMessages;
  error: string | null;
  loadingStep: number;
  onRetry: () => void;
  pending: boolean;
}

export function MatchStatus({ copy, error, loadingStep, onRetry, pending }: MatchStatusProps) {
  if (pending) {
    return (
      <section className={styles.loading} aria-busy="true" aria-label={copy.loadingTitle}>
        <div className={styles.orb}><SparkIcon /></div>
        <div>
          <p>{copy.loadingTitle}</p>
          <ol>
            {copy.loadingSteps.map((step, index) => (
              <li className={index <= loadingStep ? styles.active : undefined} key={step}>
                <span>{index < loadingStep ? <CheckIcon /> : index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.error} role="alert">
        <span className={styles.errorIcon}>!</span>
        <div><h2>{copy.errorTitle}</h2><p>{error}</p></div>
        <button onClick={onRetry} type="button">{copy.retry}</button>
      </section>
    );
  }

  return null;
}


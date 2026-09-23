import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CheckIcon } from "../icons/icons";
import { MascotGuide } from "../mascot-guide/mascot-guide";
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
        <div className={styles.avatar}>
          <MascotGuide compact copy={copy.mascot} variant="thinking" />
        </div>
        <div className={styles.head}>
          <strong>{copy.mascot.name}</strong>
          <p>{copy.loadingTitle}</p>
        </div>
        <ol className={styles.steps}>
          {copy.loadingSteps.map((step, index) => {
            const state = index < loadingStep ? styles.done : index === loadingStep ? styles.active : undefined;
            return (
              <li className={state} key={step}>
                <span aria-hidden="true">{index < loadingStep ? <CheckIcon /> : index + 1}</span>
                {step}
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.error} role="alert">
        <span className={styles.errorIcon} aria-hidden="true">!</span>
        <div><h2>{copy.errorTitle}</h2><p>{error}</p></div>
        <button onClick={onRetry} type="button">{copy.retry}</button>
      </section>
    );
  }

  return null;
}

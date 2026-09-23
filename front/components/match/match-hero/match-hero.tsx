import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CheckIcon, SparkIcon } from "../icons/icons";
import styles from "./match-hero.module.css";

export function MatchHero({ copy }: { copy: MatchMessages }) {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <SparkIcon />
          {copy.eyebrow}
        </p>
        <h1>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>
        <ul className={styles.proofs}>
          {copy.proof.map((proof) => (
            <li key={proof}>
              <CheckIcon />
              {proof}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.graphic} aria-hidden="true">
        <div className={styles.orbitLarge} />
        <div className={styles.orbitSmall} />
        <div className={styles.primaryCard}>
          <span>01</span>
          <strong>3 / 66</strong>
          <small>{copy.heroShortlist}</small>
        </div>
        <div className={styles.secondaryCard}>
          <CheckIcon />
          <span>{copy.heroFacts}</span>
        </div>
        <div className={styles.spark}>
          <SparkIcon />
        </div>
      </div>
    </section>
  );
}

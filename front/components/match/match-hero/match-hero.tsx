import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CheckIcon, SparkIcon } from "../icons/icons";
import styles from "./match-hero.module.css";

export function MatchHero({ copy }: { copy: MatchMessages }) {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}><SparkIcon />{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>
      </div>
      <ul className={styles.proofs}>
        {copy.proof.map((proof) => <li key={proof}><CheckIcon />{proof}</li>)}
      </ul>
    </section>
  );
}

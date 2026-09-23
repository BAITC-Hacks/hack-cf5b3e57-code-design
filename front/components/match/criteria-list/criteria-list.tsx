import type { MatchMessages } from "@/lib/i18n/messages/match";
import { SparkIcon } from "../icons/icons";
import styles from "./criteria-list.module.css";

export function CriteriaList({ copy, criteria }: { copy: MatchMessages; criteria: string[] }) {
  if (criteria.length === 0) return null;

  return (
    <div className={styles.criteria}>
      <div>
        <SparkIcon />
        <h3>{copy.criteriaTitle}</h3>
      </div>
      <ol>
        {criteria.map((criterion, index) => (
          <li key={`${criterion}-${index}`}>
            <span>{index + 1}</span>
            {criterion}
          </li>
        ))}
      </ol>
    </div>
  );
}


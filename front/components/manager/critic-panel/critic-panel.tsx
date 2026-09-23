"use client";

import { CheckStatusIcon } from "@/components/shared/status-icons/status-icons";
import type { SseEventMap } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./critic-panel.module.css";

export function CriticPanel({ critic }: { critic: SseEventMap["critic"] | null }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].insights;
  return (
    <article className={styles.panel}>
      <div className={styles.heading}><span>{messages.critic}</span><strong className={critic?.ok ? styles.ok : undefined}>{critic ? (critic.ok ? "OK" : critic.problems.length) : "—"}</strong></div>
      {critic ? critic.ok ? <p className={styles.verified}><span aria-hidden="true"><CheckStatusIcon /></span>{messages.criticOk}</p> : <ul>{critic.problems.map((problem) => <li key={`${problem.id}-${problem.problem}`}><strong>{problem.id}</strong> {problem.problem}</li>)}</ul> : <p className={styles.empty}>{messages.criticEmpty}</p>}
    </article>
  );
}

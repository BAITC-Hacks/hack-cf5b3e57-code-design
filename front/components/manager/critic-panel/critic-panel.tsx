"use client";

import { CheckStatusIcon } from "@/components/shared/status-icons/status-icons";
import type { MatchCard, SseEventMap } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import styles from "./critic-panel.module.css";

export function CriticPanel({ critic, cards = [], finished = false }: { critic: SseEventMap["critic"] | null; cards?: MatchCard[]; finished?: boolean }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].insights;
  const names = new Map(cards.map((card) => [card.id, card.anonName]));
  const status = critic
    ? critic.ok
      ? <span className={`${styles.status} ${styles.ok}`}><CheckStatusIcon />{messages.criticPassed}</span>
      : <span className={`${styles.status} ${styles.issues}`}>{messages.criticIssues(critic.problems.length)}</span>
    : null;
  return (
    <article className={panelStyles.panel} aria-labelledby="manager-critic-title">
      <PanelHeading
        titleId="manager-critic-title"
        icon={<Icon><path d="M12 3 4 7v5c0 4.8 3.4 7.7 8 9 4.6-1.3 8-4.2 8-9V7l-8-4Z" /><path d="m9 12 2 2 4-4" /></Icon>}
        title={messages.critic}
        aside={status}
      />
      {critic
        ? critic.ok
          ? <p className={styles.verified}><span aria-hidden="true"><CheckStatusIcon /></span>{messages.criticOk}</p>
          : <ul className={styles.problems}>{critic.problems.map((problem) => <li key={`${problem.id}-${problem.problem}`}><strong>{names.get(problem.id) ?? problem.id}</strong>{problem.problem}</li>)}</ul>
        : <p className={styles.empty}>{finished ? messages.criticSkipped : messages.criticEmpty}</p>}
    </article>
  );
}

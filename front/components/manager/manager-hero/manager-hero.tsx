"use client";

import type { RunStatus } from "../shared/manager-types";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./manager-hero.module.css";

export function ManagerHero({ status }: { status: RunStatus }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].hero;
  const copy = messages.statuses[status];
  return (
    <section className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>{messages.eyebrow}</span>
        <h1>{messages.title}</h1>
        <p>{messages.description}</p>
      </div>
      <div className={`${styles.status} ${styles[status]}`} role="status" aria-live="polite">
        <span className={styles.signal} aria-hidden="true" />
        <span><strong>{copy.label}</strong><small>{copy.description}</small></span>
      </div>
    </section>
  );
}

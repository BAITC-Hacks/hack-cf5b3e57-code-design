"use client";

import type { MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { Icon } from "../shared/icon";
import styles from "./json-panel.module.css";

export function JsonPanel({ result }: { result: MatchResponse | null }) {
  const { locale } = useLocale();
  if (!result) return null;
  const copy = MANAGER_MESSAGES[locale].json;
  return (
    <details className={styles.panel}>
      <summary>
        <Icon><path d="m9 5-5 7 5 7M15 5l5 7-5 7" /></Icon>
        <span className={styles.label}><strong>{copy.title}</strong><small>{copy.hint}</small></span>
        <span className={styles.chevron} aria-hidden="true"><Icon><path d="m6 9 6 6 6-6" /></Icon></span>
      </summary>
      <pre tabIndex={0} aria-label={copy.title}>{JSON.stringify(result, null, 2)}</pre>
    </details>
  );
}

"use client";

import type { MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { Icon } from "../shared/icon";
import styles from "./json-panel.module.css";

export function JsonPanel({ result }: { result: MatchResponse | null }) {
  const { locale } = useLocale();
  if (!result) return null;
  return <details className={styles.panel}><summary><span><Icon><path d="m9 5-5 7 5 7M15 5l5 7-5 7" /></Icon>{MANAGER_MESSAGES[locale].json.title}</span><span className={styles.schema}>MatchResponse</span></summary><pre tabIndex={0} aria-label={MANAGER_MESSAGES[locale].json.title}>{JSON.stringify(result, null, 2)}</pre></details>;
}

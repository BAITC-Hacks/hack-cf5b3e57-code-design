"use client";

import type { ReactNode } from "react";

import { ManagerHeader } from "../manager-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./manager-shell.module.css";

export function ManagerShell({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#manager-content">
        {MANAGER_MESSAGES[locale].shell.skip}
      </a>
      <ManagerHeader />
      <main className={styles.main} id="manager-content">
        {children}
      </main>
    </div>
  );
}

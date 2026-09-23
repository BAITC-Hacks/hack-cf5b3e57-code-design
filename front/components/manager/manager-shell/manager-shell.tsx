"use client";

import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import styles from "./manager-shell.module.css";

export function ManagerShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <SiteHeader contentId="manager-content" />
      <main className={styles.main} id="manager-content">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";

import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import styles from "./match-header.module.css";

interface MatchHeaderProps {
  copy: MatchMessages;
}

export function MatchHeader({ copy }: MatchHeaderProps) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label={copy.brandAria}>
        <svg className={styles.brandMark} viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect width="36" height="36" rx="11" fill="var(--tm-ember)" />
          <path d="M9 11h17M17 11v16m5-8 3 3 5-6" stroke="var(--tm-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{copy.brand}</span>
      </Link>

      <nav className={styles.navigation} aria-label={copy.navigationAria}>
        <Link href="/">{copy.nav.catalog}</Link>
        <Link className={styles.active} href="/match" aria-current="page">
          {copy.nav.match}
        </Link>
        <Link href="/chat">{copy.nav.chat}</Link>
        <Link href="/manager">{copy.nav.manager}</Link>
      </nav>

      <LocaleSwitcher ariaLabel={copy.localeLabel} className={styles.localeSwitcher} />
    </header>
  );
}

"use client";

import Link from "next/link";

import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./manager-header.module.css";

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function ManagerHeader() {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label={messages.navigation.brandAria}>
        <BrandMark />
        <span>
          Тройка
          <small>{messages.navigation.tagline}</small>
        </span>
      </Link>
      <nav className={styles.nav} aria-label={messages.navigation.aria}>
        <Link href="/">{messages.navigation.catalog}</Link>
        <Link href="/match">{messages.navigation.match}</Link>
        <Link className={styles.active} href="/manager" aria-current="page">
          {messages.navigation.manager}
        </Link>
      </nav>
      <div className={styles.actions}>
        <LocaleSwitcher ariaLabel={messages.navigation.localeAria} />
        <span className={styles.publicBadge}><span aria-hidden="true" /> {messages.navigation.publicMode}</span>
      </div>
    </header>
  );
}

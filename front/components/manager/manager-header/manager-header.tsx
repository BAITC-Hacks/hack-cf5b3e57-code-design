"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/shared/brand-logo/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./manager-header.module.css";

export function ManagerHeader() {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  const pathname = usePathname();
  const managerHref = pathname.startsWith("/admin") ? "/admin" : "/manager";
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <BrandLogo
          ariaLabel={messages.navigation.brandAria}
          className={styles.brand}
          tagline={messages.navigation.tagline}
        />
        <nav className={styles.nav} aria-label={messages.navigation.aria}>
          <Link href="/">{messages.navigation.catalog}</Link>
          <Link href="/match">{messages.navigation.match}</Link>
          <Link className={styles.active} href={managerHref} aria-current="page">
            {messages.navigation.manager}
          </Link>
        </nav>
        <div className={styles.actions}>
          <span className={styles.publicBadge}><span aria-hidden="true" />{messages.navigation.publicMode}</span>
          <LocaleSwitcher ariaLabel={messages.navigation.localeAria} />
        </div>
      </div>
    </header>
  );
}

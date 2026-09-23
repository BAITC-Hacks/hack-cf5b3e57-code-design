import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import styles from "./match-header.module.css";

interface MatchHeaderProps {
  copy: MatchMessages;
}

export function MatchHeader({ copy }: MatchHeaderProps) {
  return (
    <header className={styles.header}>
      <BrandLogo ariaLabel={copy.brandAria} className={styles.brand} />

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

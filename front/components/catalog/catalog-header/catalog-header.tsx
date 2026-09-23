import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo/brand-logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import type { CatalogMessages } from "@/lib/i18n/messages/catalog";
import styles from "./catalog-header.module.css";

export function CatalogHeader({
  messages,
}: {
  messages: CatalogMessages["header"];
}) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <BrandLogo
          ariaLabel={messages.homeAria}
          className={styles.brand}
          tagline={messages.tagline}
        />

        <nav className={styles.nav} aria-label={messages.navigationAria}>
          <Link className={styles.active} href="/">
            {messages.catalog}
          </Link>
          <Link href="/match">{messages.match}</Link>
          <Link href="/chat">{messages.assistant}</Link>
          <Link href="/manager">{messages.jury}</Link>
        </nav>

        <LocaleSwitcher
          ariaLabel={messages.localeAria}
          className={styles.locale}
        />
        <Link className={styles.cta} href="/match">
          {messages.chooseWithAi}
        </Link>
      </div>
    </header>
  );
}

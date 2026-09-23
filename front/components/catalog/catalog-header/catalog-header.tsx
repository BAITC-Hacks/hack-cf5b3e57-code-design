import Link from "next/link";

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
        <Link className={styles.brand} href="/" aria-label={messages.homeAria}>
          <span className={styles.brandMark} aria-hidden="true">
            3
          </span>
          <span>
            {messages.brand}
            <small>{messages.tagline}</small>
          </span>
        </Link>

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

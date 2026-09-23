import Link from "next/link";
import Image from "next/image";

import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-header.module.css";

export function ChatHeader({ copy }: { copy: ChatMessages }) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label={copy.brandAria}>
        <Image src="/brand/toimatch-mark.svg" width={32} height={32} alt="" />
        <span>{copy.brand}</span>
      </Link>

      <nav className={styles.navigation} aria-label={copy.navigationAria}>
        <Link href="/">{copy.nav.catalog}</Link>
        <Link href="/match">{copy.nav.match}</Link>
        <Link className={styles.active} href="/chat" aria-current="page">
          {copy.nav.chat}
        </Link>
        <Link href="/manager">{copy.nav.manager}</Link>
      </nav>

      <LocaleSwitcher ariaLabel={copy.localeLabel} className={styles.locale} />
    </header>
  );
}

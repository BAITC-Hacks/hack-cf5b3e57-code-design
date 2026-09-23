"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/shared/locale-switcher/locale-switcher";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteCopy } from "./site-copy";
import styles from "./site.module.css";

export function SiteHeader() {
  const { locale } = useLocale();
  const copy = siteCopy[locale];
  const pathname = usePathname();

  return <>
    <a className={styles.skip} href="#site-content">{copy.skip}</a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.brand} href="/" aria-label="ToiMatch">
          <Image src="/brand/toimatch-logo.svg" alt="ToiMatch" width={200} height={32} priority />
        </Link>
        <nav className={styles.nav} aria-label={copy.navigation}>
          {[["/", copy.catalog], ["/match", copy.match], ["/manager", copy.venues]].map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <LocaleSwitcher ariaLabel={copy.language} className={styles.locale} />
      </div>
    </header>
  </>;
}

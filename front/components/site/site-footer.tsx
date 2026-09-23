"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteCopy } from "./site-copy";
import styles from "./site.module.css";

export function SiteFooter() {
  const { locale } = useLocale();
  const copy = siteCopy[locale];
  return <footer className={styles.footer}>
    <div className={styles.footerInner}>
      <div className={styles.footerBrand}>
        <Link href="/" aria-label="ToiMatch"><Image src="/brand/toimatch-logo-light.svg" alt="ToiMatch" width={200} height={32} /></Link>
        <p>{copy.tagline}</p>
      </div>
      <nav className={styles.footerNav} aria-label={copy.navigation}>
        <Link href="/">{copy.catalog}</Link>
        <Link href="/match">{copy.match}</Link>
        <Link href="/manager">{copy.venues}</Link>
      </nav>
      <div className={styles.footerNotes}><p>{copy.data}</p><p>{copy.photo}</p></div>
    </div>
  </footer>;
}

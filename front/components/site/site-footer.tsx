"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo/brand-logo";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteCopy } from "./site-copy";
import styles from "./site.module.css";

export function SiteFooter() {
  const { locale } = useLocale();
  const copy = siteCopy[locale];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <BrandLogo ariaLabel={copy.brandAria} className={styles.footerLogo} light />
          <p>{copy.tagline}</p>
        </div>
        <nav className={styles.footerNav} aria-label={copy.navigation}>
          <Link href="/">{copy.catalog}</Link>
          <Link href="/match">{copy.match}</Link>
          <Link href="/chat">{copy.assistant}</Link>
          <Link href="/manager">{copy.manager}</Link>
        </nav>
        <div className={styles.footerNotes}>
          <p>{copy.photo}</p>
          <p>
            <span>{copy.rights}</span>
            <span aria-hidden="true"> · </span>
            <span>{copy.data}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

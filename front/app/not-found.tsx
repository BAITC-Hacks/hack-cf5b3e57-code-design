import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { siteCopy } from "@/components/site/site-copy";
import styles from "@/components/site/site.module.css";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export const metadata: Metadata = { title: { absolute: "ToiMatch — 404" } };

export default async function NotFound() {
  const copy = siteCopy[await getRequestLocale()];

  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={styles.notFound} id="main-content">
        <div className={styles.notFoundCopy}>
          <p className={styles.notFoundCode}>{copy.notFoundCode}</p>
          <h1>{copy.notFound}</h1>
          <p className={styles.notFoundText}>{copy.notFoundText}</p>
          <div className={styles.notFoundActions}>
            <Link href="/">{copy.catalog}</Link>
            <Link href="/match">{copy.notFoundMatch}</Link>
          </div>
        </div>
        <div className={styles.notFoundMascot}>
          <Image
            alt={copy.mascotAlt}
            fill
            priority
            sizes="(max-width: 760px) 180px, 280px"
            src="/mascot/nurlan-sorry.webp"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

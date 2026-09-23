import type { Metadata } from "next";
import Link from "next/link";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { siteCopy } from "@/components/site/site-copy";
import styles from "@/components/site/site.module.css";

export const metadata: Metadata = { title: { absolute: "ToiMatch — 404" } };

export default async function NotFound() {
  const copy = siteCopy[await getRequestLocale()];
  return <main className={styles.notFound}>
    <p>404</p><h1>{copy.notFound}</h1><p>{copy.notFoundText}</p>
    <Link href="/">{copy.catalog}</Link>
  </main>;
}

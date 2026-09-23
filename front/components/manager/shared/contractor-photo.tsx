"use client";

import Image from "next/image";
import { useState } from "react";

import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./contractor-photo.module.css";

export function ContractorPhoto({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const { locale } = useLocale();
  const copy = MANAGER_MESSAGES[locale].cards;

  return (
    <figure className={styles.photo}>
      <div className={styles.visual}>
        {failed ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="12" cy="12" r="4" /></svg>
        ) : (
          <Image src={`/contractors/${encodeURIComponent(id)}.webp`} alt={name} fill sizes="72px" onError={() => setFailed(true)} />
        )}
      </div>
      <figcaption>{failed ? copy.photoMissing : copy.photo}</figcaption>
    </figure>
  );
}

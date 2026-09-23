"use client";

import Image from "next/image";
import { useState } from "react";

import type {
  Category,
  ContractorListItem,
} from "../../../../shared/contract";
import type { CatalogMessages } from "@/lib/i18n/messages/catalog";
import styles from "./contractor-photo.module.css";

export function ContractorPhoto({
  contractor,
  messages,
  priority = false,
}: {
  contractor: Pick<ContractorListItem, "id" | "anonName" | "categories">;
  messages: CatalogMessages;
  priority?: boolean;
}) {
  const [unavailableId, setUnavailableId] = useState<string | null>(null);
  const imageUnavailable = unavailableId === contractor.id;
  const rawCategory = contractor.categories[0];
  const category = rawCategory
    ? (messages.values.categories[rawCategory as Category] ?? rawCategory)
    : messages.photo.contractorFallback;
  const missingAlt = messages.photo.missingAlt.replace(
    "{name}",
    contractor.anonName,
  );
  const imageAlt = messages.photo.imageAlt
    .replace("{name}", contractor.anonName)
    .replace("{category}", category);

  return (
    <div className={styles.frame}>
      {imageUnavailable ? (
        <div
          className={styles.fallback}
          role="img"
          aria-label={missingAlt}
        >
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 4 28.7 18.9 44 24l-15.3 5.1L24 44l-4.7-14.9L4 24l15.3-5.1L24 4Z" />
            <circle cx="24" cy="24" r="5" />
          </svg>
          <span>{category}</span>
        </div>
      ) : (
        <Image
          className={styles.image}
          src={`/contractors/${contractor.id}.webp`}
          alt={imageAlt}
          fill
          priority={priority}
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
          onError={() => setUnavailableId(contractor.id)}
        />
      )}
      <span className={styles.disclosure}>{messages.photo.disclosure}</span>
    </div>
  );
}

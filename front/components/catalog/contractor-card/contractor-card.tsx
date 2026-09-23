"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import type {
  Category,
  City,
  ContractorListItem,
  EventFormat,
  Language,
  Locale,
} from "../../../../shared/contract";
import type { CatalogMessages } from "@/lib/i18n/messages/catalog";
import styles from "./contractor-card.module.css";
import { ContractorPhoto } from "../contractor-photo/contractor-photo";

function getMatchHref(contractor: ContractorListItem) {
  const params = new URLSearchParams({
    city: contractor.city,
    category: contractor.categories[0] ?? "",
    budgetKzt: String(contractor.priceFromKzt),
  });

  return `/match?${params.toString()}`;
}

export function ContractorCard({
  contractor,
  locale,
  messages,
  priority = false,
}: {
  contractor: ContractorListItem;
  locale: Locale;
  messages: CatalogMessages;
  priority?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const priceFormatter = new Intl.NumberFormat(
    locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-KZ",
  );
  const detailHref = `/contractor/${encodeURIComponent(contractor.id)}`;
  const rawCategory = contractor.categories[0];
  const category = rawCategory
    ? (messages.values.categories[rawCategory as Category] ?? rawCategory)
    : messages.photo.contractorFallback;
  const city =
    messages.values.cities[contractor.city as City] ?? contractor.city;
  const dataFlags = [
    contractor.flags.synthetic && messages.card.synthetic,
    contractor.flags.cityImputed && messages.card.cityImputed,
    contractor.flags.priceImputed && messages.card.priceImputed,
  ].filter((flag): flag is string => Boolean(flag));
  const profileAria = messages.card.profileAria.replace(
    "{name}",
    contractor.anonName,
  );

  return (
    <motion.article
      className={styles.card}
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        className={styles.photoLink}
        href={detailHref}
        aria-label={profileAria}
      >
        <ContractorPhoto
          contractor={contractor}
          messages={messages}
          priority={priority}
        />
      </Link>

      <div className={styles.content}>
        <div className={styles.badges}>
          <span className={styles.category}>{category}</span>
          <span className={styles.city}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 17s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9Z" />
              <circle cx="10" cy="8" r="1.7" />
            </svg>
            {city}
          </span>
        </div>

        <div className={styles.heading}>
          <div>
            <Link href={detailHref} className={styles.name}>
              {contractor.anonName}
            </Link>
            <span className={styles.id}>{contractor.id}</span>
          </div>
          <p className={styles.price}>
            <span>{messages.card.priceFrom}</span>{" "}
            {priceFormatter.format(contractor.priceFromKzt)} ₸
          </p>
        </div>

        <dl className={styles.facts}>
          <div>
            <dt>{messages.card.formats}</dt>
            <dd>
              {contractor.eventFormats
                .slice(0, 3)
                .map(
                  (eventFormat) =>
                    messages.values.eventFormats[eventFormat as EventFormat] ??
                    eventFormat,
                )
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt>{messages.card.languages}</dt>
            <dd>
              {contractor.languages
                .map(
                  (language) =>
                    messages.values.languages[language as Language] ?? language,
                )
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt>{messages.card.duration}</dt>
            <dd>
              {contractor.maxHours === null
                ? messages.card.unlimited
                : messages.card.upToHours.replace(
                    "{hours}",
                    String(contractor.maxHours),
                  )}
            </dd>
          </div>
        </dl>

        {dataFlags.length > 0 && (
          <div className={styles.flags} aria-label={messages.card.dataAria}>
            {dataFlags.map((flag) => (
              <span key={flag}>{flag}</span>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <Link className={styles.detailLink} href={detailHref}>
            {messages.card.profile}
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m7 4 6 6-6 6" />
            </svg>
          </Link>
          <Link className={styles.matchLink} href={getMatchHref(contractor)}>
            {messages.card.checkWithAi}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

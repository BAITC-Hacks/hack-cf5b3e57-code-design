"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import {
  CATEGORIES,
  CITIES,
  EVENT_FORMATS,
  LANGUAGES,
} from "../../../../shared/contract";
import type { ContractorListQuery } from "../../../../shared/contract";
import type { CatalogMessages } from "@/lib/i18n/messages/catalog";
import styles from "./catalog-filters.module.css";

export function CatalogFilters({
  filters,
  messages,
}: {
  filters: ContractorListQuery;
  messages: CatalogMessages;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.form
      className={styles.form}
      action="/"
      method="get"
      initial={reduceMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.heading}>
        <div>
          <span>{messages.filters.title}</span>
          <p>{messages.filters.description}</p>
        </div>
        <Link href="/" className={styles.reset}>
          {messages.filters.reset}
        </Link>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>{messages.filters.city}</span>
          <select name="city" defaultValue={filters.city ?? ""}>
            <option value="">{messages.filters.allCities}</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {messages.values.cities[city]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>{messages.filters.category}</span>
          <select name="category" defaultValue={filters.category ?? ""}>
            <option value="">{messages.filters.allCategories}</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {messages.values.categories[category]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>{messages.filters.eventFormat}</span>
          <select
            name="eventFormat"
            defaultValue={filters.eventFormat ?? ""}
          >
            <option value="">{messages.filters.anyFormat}</option>
            {EVENT_FORMATS.map((eventFormat) => (
              <option key={eventFormat} value={eventFormat}>
                {messages.values.eventFormats[eventFormat]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>{messages.filters.language}</span>
          <select name="language" defaultValue={filters.language ?? ""}>
            <option value="">{messages.filters.anyLanguage}</option>
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {messages.values.languages[language]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>{messages.filters.priceFrom}</span>
          <input
            type="number"
            name="priceMin"
            min="0"
            step="10000"
            inputMode="numeric"
            placeholder={messages.filters.minPricePlaceholder}
            defaultValue={filters.priceMin}
          />
        </label>

        <label className={styles.field}>
          <span>{messages.filters.priceTo}</span>
          <input
            type="number"
            name="priceMax"
            min="0"
            step="10000"
            inputMode="numeric"
            placeholder={messages.filters.maxPricePlaceholder}
            defaultValue={filters.priceMax}
          />
        </label>
      </div>

      <button className={styles.submit} type="submit">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 5h14M5.5 10h9M8 15h4" />
        </svg>
        {messages.filters.submit}
      </button>
    </motion.form>
  );
}

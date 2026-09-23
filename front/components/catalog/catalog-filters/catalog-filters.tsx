"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { CustomSelect } from "@/components/shared/custom-select/custom-select";
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
          <CustomSelect
            defaultValue={filters.city ?? ""}
            name="city"
            options={[
              { value: "", label: messages.filters.allCities },
              ...CITIES.map((city) => ({
                value: city,
                label: messages.values.cities[city],
              })),
            ]}
          />
        </label>

        <label className={styles.field}>
          <span>{messages.filters.category}</span>
          <CustomSelect
            defaultValue={filters.category ?? ""}
            name="category"
            options={[
              { value: "", label: messages.filters.allCategories },
              ...CATEGORIES.map((category) => ({
                value: category,
                label: messages.values.categories[category],
              })),
            ]}
          />
        </label>

        <label className={styles.field}>
          <span>{messages.filters.eventFormat}</span>
          <CustomSelect
            defaultValue={filters.eventFormat ?? ""}
            name="eventFormat"
            options={[
              { value: "", label: messages.filters.anyFormat },
              ...EVENT_FORMATS.map((eventFormat) => ({
                value: eventFormat,
                label: messages.values.eventFormats[eventFormat],
              })),
            ]}
          />
        </label>

        <label className={styles.field}>
          <span>{messages.filters.language}</span>
          <CustomSelect
            defaultValue={filters.language ?? ""}
            name="language"
            options={[
              { value: "", label: messages.filters.anyLanguage },
              ...LANGUAGES.map((language) => ({
                value: language,
                label: messages.values.languages[language],
              })),
            ]}
          />
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

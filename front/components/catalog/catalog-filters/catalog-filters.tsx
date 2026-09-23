"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

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
  activeCount = 0,
  filters,
  messages,
}: {
  activeCount?: number;
  filters: ContractorListQuery;
  messages: CatalogMessages;
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <motion.form
      className={styles.form}
      action="/#catalog-results"
      data-expanded={expanded}
      method="get"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.heading}>
        <h2 className={styles.title}>{messages.filters.title}</h2>
        <button
          aria-controls={panelId}
          aria-expanded={expanded}
          className={styles.toggle}
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <svg className={styles.toggleIcon} viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M5.5 10h9M8 15h4" />
          </svg>
          <span>{messages.filters.title}</span>
          {activeCount > 0 ? (
            <span className={styles.count}>{activeCount}</span>
          ) : null}
          <svg className={styles.chevron} viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>
        {activeCount > 0 ? (
          <Link href="/#catalog-results" className={styles.reset}>
            {messages.filters.reset}
          </Link>
        ) : null}
      </div>

      <div className={styles.panel} id={panelId}>
        <p className={styles.description}>{messages.filters.description}</p>

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

          <div className={styles.priceRow}>
            <label className={styles.field}>
              <span>{messages.filters.priceFrom}</span>
              <input
                type="number"
                name="priceMin"
                min="0"
                step="any"
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
                step="any"
                inputMode="numeric"
                placeholder={messages.filters.maxPricePlaceholder}
                defaultValue={filters.priceMax}
              />
            </label>
          </div>
        </div>

        <button className={styles.submit} type="submit">
          {messages.filters.submit}
        </button>
      </div>
    </motion.form>
  );
}

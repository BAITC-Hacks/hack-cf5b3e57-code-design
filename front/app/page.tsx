import type { Metadata } from "next";
import Link from "next/link";

import { CatalogFilters } from "@/components/catalog/catalog-filters/catalog-filters";
import { CatalogHeader } from "@/components/catalog/catalog-header/catalog-header";
import { ContractorCard } from "@/components/catalog/contractor-card/contractor-card";
import {
  CATEGORIES,
  CITIES,
  EVENT_FORMATS,
  LANGUAGES,
} from "../../shared/contract";
import type {
  Category,
  ContractorListItem,
  ContractorListQuery,
  ContractorListResponse,
} from "../../shared/contract";
import { CatalogApiError, getContractors } from "@/lib/catalog-api";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import {
  catalogMessages,
  type CatalogMessages,
} from "@/lib/i18n/messages/catalog";
import styles from "./page.module.css";

const OTHER_CATEGORY = "__other__";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = catalogMessages[locale];

  return {
    title: messages.metadata.catalogTitle,
    description: messages.metadata.catalogDescription,
  };
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAllowedValue(
  value: string | string[] | undefined,
  allowedValues: readonly string[],
) {
  const candidate = getSingleValue(value);
  return candidate && allowedValues.includes(candidate) ? candidate : undefined;
}

function getPrice(value: string | string[] | undefined) {
  const candidate = getSingleValue(value);
  if (!candidate || !/^\d+$/.test(candidate)) return undefined;

  const price = Number(candidate);
  return Number.isSafeInteger(price) && price >= 0 ? price : undefined;
}

function getCatalogFilters(
  query: Record<string, string | string[] | undefined>,
): ContractorListQuery {
  return {
    city: getAllowedValue(query.city, CITIES),
    category: getAllowedValue(query.category, CATEGORIES),
    eventFormat: getAllowedValue(query.eventFormat, EVENT_FORMATS),
    language: getAllowedValue(query.language, LANGUAGES),
    priceMin: getPrice(query.priceMin),
    priceMax: getPrice(query.priceMax),
  };
}

function getCategoryHref(category: string, filters: ContractorListQuery) {
  const params = new URLSearchParams();

  if (filters.city) params.set("city", filters.city);
  params.set("category", category);
  if (filters.eventFormat) params.set("eventFormat", filters.eventFormat);
  if (filters.language) params.set("language", filters.language);
  if (filters.priceMin !== undefined) {
    params.set("priceMin", String(filters.priceMin));
  }
  if (filters.priceMax !== undefined) {
    params.set("priceMax", String(filters.priceMax));
  }

  return `/?${params.toString()}#catalog-results`;
}

function ServiceUnavailable({
  message,
  messages,
}: {
  message: string;
  messages: CatalogMessages;
}) {
  return (
    <main className={styles.unavailable}>
      <span className={styles.unavailableIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 8v5m0 3.5v.1M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <p className={styles.eyebrow}>{messages.errors.catalogEyebrow}</p>
      <h1>{messages.errors.catalogTitle}</h1>
      <p>{message}</p>
      <div className={styles.unavailableActions}>
        <Link href="/">{messages.errors.retry}</Link>
        <Link href="/match">{messages.errors.goToAi}</Link>
      </div>
    </main>
  );
}

function groupContractorsByCategory(items: ContractorListItem[]) {
  const categories = new Map<string, ContractorListItem[]>();

  for (const contractor of items) {
    const category = contractor.categories[0] ?? OTHER_CATEGORY;
    const group = categories.get(category) ?? [];
    group.push(contractor);
    categories.set(category, group);
  }

  return [...categories.entries()].sort(([first], [second]) => {
    const firstIndex = CATEGORIES.indexOf(first as (typeof CATEGORIES)[number]);
    const secondIndex = CATEGORIES.indexOf(second as (typeof CATEGORIES)[number]);
    const normalizedFirst = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
    const normalizedSecond = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;
    return normalizedFirst - normalizedSecond || first.localeCompare(second, "ru");
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestLocale();
  const messages = catalogMessages[locale];
  const filters = getCatalogFilters(await searchParams);
  const requestQuery = { ...filters, limit: 100, offset: 0 };

  let catalog: ContractorListResponse;
  let facets: ContractorListResponse;

  try {
    const catalogRequest = getContractors(requestQuery);
    const facetsRequest = filters.category
      ? getContractors({ ...requestQuery, category: undefined })
      : catalogRequest;
    [catalog, facets] = await Promise.all([catalogRequest, facetsRequest]);
  } catch (error) {
    const message =
      error instanceof CatalogApiError && error.status === 503
        ? messages.errors.catalogUnavailable
        : messages.errors.genericUnavailable;

    return (
      <div className={styles.page}>
        <CatalogHeader messages={messages.header} />
        <ServiceUnavailable message={message} messages={messages} />
      </div>
    );
  }

  const groupedContractors = groupContractorsByCategory(catalog.items);
  const categoryCounts = CATEGORIES.map((category) => ({
    category,
    label: messages.values.categories[category],
    count: facets.items.filter((contractor) =>
      contractor.categories.includes(category),
    ).length,
  })).filter(({ count }) => count > 0);
  const hasFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "",
  );

  return (
    <div className={styles.page}>
      <CatalogHeader messages={messages.header} />

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{messages.catalog.heroEyebrow}</p>
              <h1>
                {messages.catalog.heroTitleFirst}
                <br />
                <span>{messages.catalog.heroTitleSecond}</span>
              </h1>
              <p className={styles.heroLead}>{messages.catalog.heroLead}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} href="/match">
                  {messages.catalog.chooseWithAi}
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m7 4 6 6-6 6" />
                  </svg>
                </Link>
                <Link className={styles.secondaryAction} href="#catalog-results">
                  {messages.catalog.browseCatalog}
                </Link>
              </div>
            </div>

            <div
              className={styles.heroProof}
              aria-label={messages.catalog.proofAria}
            >
              <div>
                <strong>{catalog.total}</strong>
                <span>
                  {hasFilters
                    ? messages.catalog.matchesFilters
                    : messages.catalog.profilesInCatalog}
                </span>
              </div>
              <div>
                <strong>{CATEGORIES.length}</strong>
                <span>{messages.catalog.serviceCategories}</span>
              </div>
              <div>
                <strong>{CITIES.length}</strong>
                <span>{messages.catalog.searchGeographies}</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className={styles.categoryStrip}
          aria-label={messages.catalog.categoriesAria}
        >
          <div className={styles.categoryStripInner}>
            <Link
              className={!filters.category ? styles.categoryActive : undefined}
              href="/#catalog-results"
            >
              {messages.catalog.all} <span>{facets.total}</span>
            </Link>
            {categoryCounts.map(({ category, count, label }) => (
              <Link
                key={category}
                className={
                  filters.category === category ? styles.categoryActive : undefined
                }
                href={getCategoryHref(category, filters)}
              >
                {label} <span>{count}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.catalog} id="catalog-results">
          <div className={styles.catalogHeading}>
            <div>
              <p className={styles.eyebrow}>{messages.catalog.sectionEyebrow}</p>
              <h2>
                {filters.category
                  ? (messages.values.categories[
                      filters.category as Category
                    ] ?? filters.category)
                  : messages.catalog.allContractors}
                <span>{catalog.total}</span>
              </h2>
            </div>
            <p>{messages.catalog.sortNote}</p>
          </div>

          <div className={styles.catalogLayout}>
            <aside
              className={styles.sidebar}
              aria-label={messages.catalog.filtersAria}
            >
              <CatalogFilters filters={filters} messages={messages} />
            </aside>

            <div className={styles.results} aria-live="polite">
              {groupedContractors.length === 0 ? (
                <div className={styles.empty}>
                  <span aria-hidden="true">
                    <svg viewBox="0 0 32 32">
                      <circle cx="14" cy="14" r="8" />
                      <path d="m20 20 7 7M10 14h8" />
                    </svg>
                  </span>
                  <h3>{messages.catalog.emptyTitle}</h3>
                  <p>{messages.catalog.emptyText}</p>
                  <div>
                    <Link href="/">{messages.catalog.resetFilters}</Link>
                    <Link href="/match">{messages.catalog.tryAiMatch}</Link>
                  </div>
                </div>
              ) : (
                groupedContractors.map(([category, contractors], groupIndex) => (
                  <section className={styles.categorySection} key={category}>
                    <div className={styles.categoryHeading}>
                      <h3>
                        {category === OTHER_CATEGORY
                          ? messages.catalog.otherCategory
                          : (messages.values.categories[
                              category as Category
                            ] ?? category)}
                      </h3>
                      <span>{contractors.length}</span>
                    </div>
                    <div className={styles.cards}>
                      {contractors.map((contractor, itemIndex) => (
                        <ContractorCard
                          key={contractor.id}
                          contractor={contractor}
                          locale={locale}
                          messages={messages}
                          priority={groupIndex === 0 && itemIndex < 3}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>
        </section>

        <section className={styles.aiBanner}>
          <div>
            <p className={styles.eyebrow}>{messages.catalog.bannerEyebrow}</p>
            <h2>{messages.catalog.bannerTitle}</h2>
            <p>{messages.catalog.bannerText}</p>
          </div>
          <Link href="/match">
            {messages.catalog.startMatch}
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m7 4 6 6-6 6" />
            </svg>
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>{messages.catalog.footerBrand}</span>
        <p>{messages.catalog.footerNote}</p>
      </footer>
    </div>
  );
}

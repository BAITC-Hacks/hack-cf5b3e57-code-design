import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CatalogFilters } from "@/components/catalog/catalog-filters/catalog-filters";
import { CategoryStrip } from "@/components/catalog/category-strip/category-strip";
import { ContractorCard } from "@/components/catalog/contractor-card/contractor-card";
import { ContractorPhoto } from "@/components/catalog/contractor-photo/contractor-photo";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
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
import siteStyles from "@/components/site/site.module.css";
import styles from "./page.module.css";

const OTHER_CATEGORY = "__other__";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = {
    ru: {
      title: "ToiMatch — подрядчики для мероприятий в Алматы и Астане",
      description:
        "Ведущие, фотографы, декораторы, музыканты и залы в Алматы и Астане. Выберите сами или получите три варианта под дату и бюджет — с объяснением выбора.",
    },
    kk: {
      title: "ToiMatch — Алматы мен Астанадағы іс-шара мердігерлері",
      description:
        "Алматы мен Астанадағы жүргізушілер, фотографтар, декораторлар, музыканттар және залдар. Өзіңіз таңдаңыз немесе күн мен бюджетке сай үш нұсқаны түсіндірмесімен алыңыз.",
    },
    en: {
      title: "ToiMatch — event contractors in Almaty and Astana",
      description:
        "Hosts, photographers, decorators, musicians and venues in Almaty and Astana. Browse yourself or get three options for your date and budget — with the reasons why.",
    },
  }[locale];

  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: "/" },
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
    <main className={styles.unavailable} id="main-content">
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

const HERO_PHOTO_IDS = ["HK-19103", "HK-39372", "HK-88430"] as const;

function pickHeroContractors(items: ContractorListItem[]) {
  const preferred = HERO_PHOTO_IDS.map((id) =>
    items.find((contractor) => contractor.id === id),
  ).filter((contractor): contractor is ContractorListItem => Boolean(contractor));
  const rest = items.filter(
    (contractor) => !preferred.some((picked) => picked.id === contractor.id),
  );
  return [...preferred, ...rest].slice(0, 3);
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
      <div className={siteStyles.shell}>
        <SiteHeader />
        <ServiceUnavailable message={message} messages={messages} />
        <SiteFooter />
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

  const heroContractors = pickHeroContractors(facets.items);
  const [heroMain, ...heroSide] = heroContractors;
  const activeFilterCount = [
    filters.city,
    filters.category,
    filters.eventFormat,
    filters.language,
    filters.priceMin,
    filters.priceMax,
  ].filter((value) => value !== undefined && value !== "").length;

  return (
    <div className={siteStyles.shell}>
      <SiteHeader />

      <main className={styles.page} id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>{messages.catalog.heroEyebrow}</p>
            <h1>
              {messages.catalog.heroTitleFirst}{" "}
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
            <dl className={styles.heroProof} aria-label={messages.catalog.proofAria}>
              <div>
                <dt>
                  {hasFilters
                    ? messages.catalog.matchesFilters
                    : messages.catalog.profilesInCatalog}
                </dt>
                <dd>{catalog.total}</dd>
              </div>
              <div>
                <dt>{messages.catalog.serviceCategories}</dt>
                <dd>{CATEGORIES.length}</dd>
              </div>
              <div>
                <dt>{messages.catalog.searchGeographies}</dt>
                <dd>{CITIES.length}</dd>
              </div>
            </dl>
          </div>

          {heroMain ? (
            <div className={styles.heroMosaic} aria-hidden="true">
              <div className={styles.mosaicMain}>
                <ContractorPhoto contractor={heroMain} messages={messages} priority />
              </div>
              {heroSide.map((contractor) => (
                <div className={styles.mosaicSide} key={contractor.id}>
                  <ContractorPhoto contractor={contractor} messages={messages} priority />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <CategoryStrip
          className={styles.categoryStrip}
          ariaLabel={messages.catalog.categoriesAria}
          listClassName={styles.categoryStripInner}
          nextLabel={messages.catalog.nextCategories}
          previousLabel={messages.catalog.previousCategories}
        >
          <li>
            <Link
              aria-current={!filters.category ? "page" : undefined}
              className={!filters.category ? styles.categoryActive : undefined}
              href="/#catalog-results"
            >
              {messages.catalog.all} <span>{facets.total}</span>
            </Link>
          </li>
          {categoryCounts.map(({ category, count, label }) => (
            <li key={category}>
              <Link
                aria-current={filters.category === category ? "page" : undefined}
                className={
                  filters.category === category ? styles.categoryActive : undefined
                }
                href={getCategoryHref(category, filters)}
              >
                {label} <span>{count}</span>
              </Link>
            </li>
          ))}
        </CategoryStrip>

        <section className={styles.aiBanner}>
          <div className={styles.aiBannerCopy}>
            <p className={styles.bannerEyebrow}>{messages.catalog.bannerEyebrow}</p>
            <h2>{messages.catalog.bannerTitle}</h2>
            <p>{messages.catalog.bannerText}</p>
            <Link href="/match">
              {messages.catalog.startMatch}
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m7 4 6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className={styles.aiBannerMascot} aria-hidden="true">
            <Image
              alt=""
              fill
              sizes="(max-width: 760px) 160px, 240px"
              src="/mascot/nurlan-found.webp"
            />
          </div>
        </section>

        <section className={styles.catalog} id="catalog-results">
          <div className={styles.catalogHeading}>
            <h2>
              {filters.category
                ? (messages.values.categories[
                    filters.category as Category
                  ] ?? filters.category)
                : messages.catalog.allContractors}
              <span>{catalog.total}</span>
            </h2>
            <p>{messages.catalog.sortNote}</p>
          </div>

          <div className={styles.catalogLayout}>
            <aside
              className={styles.sidebar}
              aria-label={messages.catalog.filtersAria}
            >
              <CatalogFilters
                activeCount={activeFilterCount}
                filters={filters}
                messages={messages}
              />
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

      </main>

      <SiteFooter />
    </div>
  );
}

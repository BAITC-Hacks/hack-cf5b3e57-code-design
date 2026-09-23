import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityCalendar } from "@/components/catalog/availability-calendar";
import { ContractorPhoto } from "@/components/catalog/contractor-photo/contractor-photo";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import siteStyles from "@/components/site/site.module.css";
import {
  CatalogApiError,
  getContractorById,
} from "@/lib/catalog-api";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import {
  catalogMessages,
  type CatalogMessages,
} from "@/lib/i18n/messages/catalog";
import type {
  Category,
  City,
  ContractorDetail,
  EventFormat,
  Language,
  Locale,
} from "../../../../shared/contract";
import styles from "@/components/catalog/profile-page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = catalogMessages[locale];
  const { id } = await params;
  const canonical = `/contractor/${encodeURIComponent(id)}`;

  try {
    const contractor = await getContractorById(id);
    const category = contractor.categories[0];
    const categoryLabel = category
      ? (messages.values.categories[category as Category] ?? category)
      : undefined;
    const cityLabel =
      messages.values.cities[contractor.city as City] ?? contractor.city;
    const subtitle = [categoryLabel, cityLabel].filter(Boolean).join(", ");
    const price = new Intl.NumberFormat(getIntlLocale(locale)).format(
      contractor.priceFromKzt,
    );
    const formats = contractor.eventFormats
      .map(
        (format) =>
          messages.values.eventFormats[format as EventFormat] ?? format,
      )
      .join(", ");
    const languages = contractor.languages
      .map(
        (language) =>
          messages.values.languages[language as Language] ?? language,
      )
      .join(", ");
    const parts = {
      ru: [
        subtitle && `${subtitle}.`,
        `Цена от ${price} ₸.`,
        formats && `Форматы: ${formats}.`,
        languages && `Языки: ${languages}.`,
        "Профиль и свободные даты на ToiMatch.",
      ],
      kk: [
        subtitle && `${subtitle}.`,
        `Бағасы ${price} ₸-ден.`,
        formats && `Форматтар: ${formats}.`,
        languages && `Тілдер: ${languages}.`,
        "Профиль мен бос күндер — ToiMatch-те.",
      ],
      en: [
        subtitle && `${subtitle}.`,
        `From ${price} ₸.`,
        formats && `Formats: ${formats}.`,
        languages && `Languages: ${languages}.`,
        "Profile and free dates on ToiMatch.",
      ],
    }[locale];
    const description = parts.filter(Boolean).join(" ");

    return {
      title: subtitle
        ? `${contractor.anonName} — ${subtitle}`
        : contractor.anonName,
      description,
      alternates: { canonical },
    };
  } catch {
    return {
      title: messages.metadata.detailTitle,
      description: messages.metadata.detailDescription,
      alternates: { canonical },
    };
  }
}

function getIntlLocale(locale: Locale) {
  return locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU";
}

function getMatchHref(contractor: ContractorDetail) {
  const params = new URLSearchParams({
    city: contractor.city,
    category: contractor.categories[0] ?? "",
    budgetKzt: String(contractor.priceFromKzt),
  });

  return `/match?${params.toString()}`;
}

function DetailUnavailable({
  message,
  messages,
}: {
  message: string;
  messages: CatalogMessages;
}) {
  return (
    <main className={styles.errorState} id="main-content">
      <span aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 8v5m0 3.5v.1M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <p className={styles.eyebrow}>{messages.errors.detailEyebrow}</p>
      <h1>{messages.errors.detailTitle}</h1>
      <p>{message}</p>
      <Link href="/">{messages.errors.backToCatalog}</Link>
    </main>
  );
}

export default async function ContractorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getRequestLocale();
  const messages = catalogMessages[locale];
  const intlLocale = getIntlLocale(locale);
  const priceFormatter = new Intl.NumberFormat(intlLocale);
  const { id } = await params;
  let contractor: ContractorDetail;

  try {
    contractor = await getContractorById(id);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) {
      notFound();
    }

    const message =
      error instanceof CatalogApiError && error.status === 503
        ? messages.errors.catalogUnavailable
        : messages.errors.genericUnavailable;

    return (
      <div className={siteStyles.shell}>
        <SiteHeader />
        <DetailUnavailable message={message} messages={messages} />
        <SiteFooter />
      </div>
    );
  }

  const dataFlags = [
    contractor.flags.synthetic && {
      title: messages.detail.syntheticTitle,
      text: messages.detail.syntheticText,
    },
    contractor.flags.cityImputed && {
      title: messages.detail.cityImputedTitle,
      text: messages.detail.cityImputedText,
    },
    contractor.flags.priceImputed && {
      title: messages.detail.priceImputedTitle,
      text: messages.detail.priceImputedText,
    },
  ].filter(
    (flag): flag is { title: string; text: string } => Boolean(flag),
  );

  return (
    <div className={siteStyles.shell}>
      <SiteHeader />

      <main className={styles.main} id="main-content">
        <nav className={styles.breadcrumbs} aria-label={messages.detail.backToCatalog}>
          <Link className={styles.backLink} href="/#catalog-results">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m12.5 4-6 6 6 6" />
            </svg>
            {messages.detail.backToCatalog}
          </Link>
        </nav>

        <section className={styles.profileHero}>
          <div className={styles.photo}>
            <ContractorPhoto
              contractor={contractor}
              messages={messages}
              priority
            />
          </div>

          <div className={styles.profileIntro}>
            <div className={styles.topline}>
              <div className={styles.categories}>
                {contractor.categories.map((category) => (
                  <span key={category}>
                    {messages.values.categories[category as Category] ??
                      category}
                  </span>
                ))}
              </div>
              <p className={styles.location}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 17s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9Z" />
                  <circle cx="10" cy="8" r="1.7" />
                </svg>
                {messages.values.cities[contractor.city as City] ??
                  contractor.city}
              </p>
            </div>

            <h1>{contractor.anonName}</h1>
            <p className={styles.price}>
              <span>{messages.detail.costFrom}</span>
              {priceFormatter.format(contractor.priceFromKzt)} ₸
            </p>

            <dl className={styles.quickFacts}>
              <div>
                <dt>{messages.detail.formats}</dt>
                <dd>{contractor.eventFormats.map(value => messages.values.eventFormats[value as EventFormat] ?? value).join(", ")}</dd>
              </div>
              <div>
                <dt>{messages.detail.languages}</dt>
                <dd>{contractor.languages.map(value => messages.values.languages[value as Language] ?? value).join(", ")}</dd>
              </div>
              <div>
                <dt>{messages.card.duration}</dt>
                <dd>
                  {contractor.maxHours === null
                    ? messages.card.unlimited
                    : messages.detail.hoursShort.replace(
                        "{hours}",
                        String(contractor.maxHours),
                      )}
                </dd>
              </div>
            </dl>

            <div className={styles.actions}>
              <Link className={styles.primaryAction} href={getMatchHref(contractor)}>
                {messages.detail.checkForEvent}
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m7 4 6 6-6 6" />
                </svg>
              </Link>
              <Link className={styles.secondaryAction} href="/chat">
                {messages.detail.askAi}
              </Link>
            </div>
            <p className={styles.profileId}>ID {contractor.id}</p>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.panel} aria-labelledby="profile-description">
            <h2 id="profile-description">{messages.detail.descriptionTitle}</h2>
            <p className={styles.description}>{contractor.description}</p>
            <p className={styles.sourceNote}>{messages.detail.sourceNote}</p>
          </section>

          <aside className={styles.panel} aria-labelledby="profile-data">
            <h2 id="profile-data">{messages.detail.important}</h2>
            {dataFlags.length > 0 ? (
              <div className={styles.dataFlags}>
                {dataFlags.map((flag) => (
                  <div key={flag.title}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 3 3.5 6v4.6c0 3.5 2.7 5.8 6.5 7.4 3.8-1.6 6.5-3.9 6.5-7.4V6L10 3Z" />
                      <path d="M10 7v4m0 2.6v.1" />
                    </svg>
                    <span>
                      <strong>{flag.title}</strong>
                      <small>{flag.text}</small>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.cleanData}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 3 3.5 6v4.6c0 3.5 2.7 5.8 6.5 7.4 3.8-1.6 6.5-3.9 6.5-7.4V6L10 3Z" />
                  <path d="m7.2 10.3 1.8 1.8 3.9-4" />
                </svg>
                <span>
                  <strong>{messages.detail.cleanDataTitle}</strong>
                  <small>{messages.detail.cleanDataText}</small>
                </span>
              </div>
            )}
          </aside>
        </div>
        <AvailabilityCalendar contractor={contractor} locale={locale} today={new Date().toISOString().slice(0, 10)} />
      </main>

      <SiteFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityCalendar } from "@/components/catalog/availability-calendar";
import { ContractorPhoto } from "@/components/catalog/contractor-photo/contractor-photo";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = catalogMessages[locale];

  return {
    title: messages.metadata.detailTitle,
    description: messages.metadata.detailDescription,
  };
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
    <main className={styles.errorState}>
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
      <div className={styles.page}>
        <DetailUnavailable message={message} messages={messages} />
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
    <div className={styles.page}>

      <main className={styles.main}>
        <Link className={styles.backLink} href="/">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m12.5 4-6 6 6 6" />
          </svg>
          {messages.detail.backToCatalog}
        </Link>

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
              <span className={styles.profileId}>{contractor.id}</span>
            </div>

            <p className={styles.location}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 17s5-4.7 5-9a5 5 0 1 0-10 0c0 4.3 5 9 5 9Z" />
                <circle cx="10" cy="8" r="1.7" />
              </svg>
              {messages.values.cities[contractor.city as City] ??
                contractor.city}
            </p>
            <h1>{contractor.anonName}</h1>
            <p className={styles.price}>
              <span>{messages.detail.costFrom}</span>
              {priceFormatter.format(contractor.priceFromKzt)} ₸
            </p>

            <div className={styles.quickFacts}>
              <div>
                <span>{messages.detail.formats}</span>
                <strong>{contractor.eventFormats.map(value => messages.values.eventFormats[value as EventFormat] ?? value).join(", ")}</strong>
              </div>
              <div>
                <span>{messages.detail.languages}</span>
                <strong>{contractor.languages.map(value => messages.values.languages[value as Language] ?? value).join(", ")}</strong>
              </div>
              <div>
                <span>{messages.card.duration}</span>
                <strong>
                  {contractor.maxHours === null
                    ? messages.card.unlimited
                    : messages.detail.hoursShort.replace(
                        "{hours}",
                        String(contractor.maxHours),
                      )}
                </strong>
              </div>
            </div>

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
          </div>
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.primaryColumn}>
            <section className={styles.panel}>
              <p className={styles.eyebrow}>{messages.detail.aboutEyebrow}</p>
              <h2>{messages.detail.descriptionTitle}</h2>
              <p className={styles.description}>{contractor.description}</p>
              <p className={styles.sourceNote}>{messages.detail.sourceNote}</p>
            </section>

          </div>

          <aside className={styles.secondaryColumn}>
            <section className={styles.panel}>
              <p className={styles.eyebrow}>{messages.detail.serviceEyebrow}</p>
              <h2>{messages.detail.formats}</h2>
              <div className={styles.tagList}>
                {contractor.eventFormats.map((eventFormat) => (
                  <span key={eventFormat}>
                    {messages.values.eventFormats[
                      eventFormat as EventFormat
                    ] ?? eventFormat}
                  </span>
                ))}
              </div>

              <h2 className={styles.subheading}>{messages.detail.languages}</h2>
              <div className={styles.languageList}>
                {contractor.languages.map((language) => (
                  <span key={language}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="m4 10 4 4 8-8" />
                    </svg>
                    {messages.values.languages[language as Language] ?? language}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <p className={styles.eyebrow}>{messages.detail.dataEyebrow}</p>
              <h2>{messages.detail.important}</h2>
              {dataFlags.length > 0 ? (
                <div className={styles.dataFlags}>
                  {dataFlags.map((flag) => (
                    <div key={flag.title}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 3 3.5 6v4.6c0 3.5 2.7 5.8 6.5 7.4 3.8-1.6 6.5-3.9 6.5-7.4V6L10 3Z" />
                        <path d="m7.2 10.3 1.8 1.8 3.9-4" />
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
            </section>
          </aside>
        </div>
        <AvailabilityCalendar contractor={contractor} locale={locale} today={new Date().toISOString().slice(0, 10)} />
      </main>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { Ref } from "react";

import type {
  BundleItem,
  EventBundle,
  Locale,
  MatchCard,
} from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { humanizeDates } from "../format-dates";
import styles from "./chat-bundle-results.module.css";

interface ChatBundleResultsProps {
  bundle: EventBundle;
  copy: ChatMessages;
  locale: Locale;
  sectionRef: Ref<HTMLElement>;
}

function categoryLabel(category: string, copy: ChatMessages) {
  return copy.labels.categories[
    category as keyof ChatMessages["labels"]["categories"]
  ] ?? category;
}

function money(value: number, locale: Locale) {
  return `${new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`).format(value)} ₸`;
}

function BundleCandidate({
  card,
  copy,
  locale,
  rank,
}: {
  card: MatchCard;
  copy: ChatMessages;
  locale: Locale;
  rank: number;
}) {
  const flags = [
    card.flags.synthetic ? copy.result.flags.synthetic : null,
    card.flags.priceImputed ? copy.result.flags.priceImputed : null,
    card.flags.cityImputed ? copy.result.flags.cityImputed : null,
  ].filter((flag): flag is string => Boolean(flag));

  return (
    <div className={styles.candidate}>
      <div className={styles.candidateHeader}>
        <span className={styles.rank}>{rank}</span>
        <h5>
          <Link href={`/contractor/${card.id}`}>{card.anonName}</Link>
        </h5>
        <span className={styles.price}>
          {copy.result.from} {money(card.priceFromKzt, locale)}
        </span>
      </div>
      <p className={styles.reason}>{humanizeDates(card.reason, locale)}</p>
      {flags.length > 0 && (
        <ul className={styles.flags}>
          {flags.map((flag) => <li key={flag}>{flag}</li>)}
        </ul>
      )}
      {card.factsUsed.length > 0 && (
        <details className={styles.facts}>
          <summary>{copy.result.facts}</summary>
          <ul>
            {card.factsUsed.map((fact, index) => (
              <li key={`${fact.key}-${index}`}>
                <span
                  aria-hidden="true"
                  className={fact.verified ? styles.verified : styles.claimed}
                >
                  {fact.verified ? "✓" : "○"}
                </span>
                <span>
                  {humanizeDates(fact.label, locale)}
                  <small>{fact.verified ? copy.result.verified : copy.result.claimed}</small>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function BundleGroup({
  copy,
  items,
  label,
  locale,
}: {
  copy: ChatMessages;
  items: BundleItem[];
  label: string;
  locale: Locale;
}) {
  if (items.length === 0) return null;

  return (
    <section className={styles.group}>
      <h3>{label}</h3>
      <div className={styles.items}>
        {items.map((item) => {
          const [first, ...alternatives] = item.match.cards;
          const budgetBlocked = !first && item.match.funnel.some(
            (step) => step.step === "budget" && step.before > 0 && step.after === 0,
          );
          return (
            <article className={styles.item} data-found={Boolean(first)} key={item.category}>
              <header className={styles.itemHeader}>
                <div>
                  <h4>{categoryLabel(item.category, copy)}</h4>
                  <span className={styles.status}>
                    {first ? copy.bundle.found : copy.result.outcome[item.match.outcome]}
                  </span>
                </div>
                {budgetBlocked && (
                  <span className={styles.allocation}>
                    {copy.bundle.budget}: {money(item.allocatedBudgetKzt, locale)}
                  </span>
                )}
              </header>

              {first ? (
                <>
                  <BundleCandidate card={first} copy={copy} locale={locale} rank={1} />
                  {alternatives.length > 0 && (
                    <details className={styles.alternatives}>
                      <summary>
                        {copy.bundle.alternatives} ({alternatives.length})
                      </summary>
                      <div>
                        {alternatives.map((card, index) => (
                          <BundleCandidate
                            card={card}
                            copy={copy}
                            key={card.id}
                            locale={locale}
                            rank={index + 2}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <p className={styles.empty}>
                  {humanizeDates(item.match.summary || copy.bundle.empty, locale)}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ChatBundleResults({
  bundle,
  copy,
  locale,
  sectionRef,
}: ChatBundleResultsProps) {
  const reduceMotion = useReducedMotion();
  const items = [...bundle.required, ...bundle.recommended];
  const missing = items.filter((item) => item.match.cards.length === 0);
  const found = items.length - missing.length;
  const city = copy.labels.cities[
    bundle.city as keyof ChatMessages["labels"]["cities"]
  ] ?? bundle.city;
  const eventType = copy.labels.eventFormats[
    bundle.eventType as keyof ChatMessages["labels"]["eventFormats"]
  ] ?? bundle.eventType;

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={styles.results}
      id="chat-results"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      ref={sectionRef}
      tabIndex={-1}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className={styles.overview}>
        <div>
          <p className={styles.eyebrow}>{copy.bundle.eyebrow}</p>
          <h2>{copy.bundle.title}</h2>
          <p className={styles.context}>
            {eventType} · {city} · {humanizeDates(bundle.date, locale)}
          </p>
        </div>
        <span className={styles.total}>
          {copy.bundle.totalBudget}: {money(bundle.totalBudgetKzt, locale)}
        </span>
        {items.length > 0 && (
          <p className={styles.coverage}>
            <strong>{found} / {items.length}</strong> {copy.bundle.coverage}
          </p>
        )}
        {items.length === 0 && (
          <p className={styles.summary}>{humanizeDates(bundle.summary, locale)}</p>
        )}
        {missing.length > 0 && (
          <div className={styles.missing}>
            <strong>{copy.bundle.missing}</strong>
            <ul>
              {missing.map((item) => (
                <li key={item.category}>{categoryLabel(item.category, copy)}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <BundleGroup
        copy={copy}
        items={bundle.required}
        label={copy.bundle.required}
        locale={locale}
      />
      <BundleGroup
        copy={copy}
        items={bundle.recommended}
        label={copy.bundle.recommended}
        locale={locale}
      />
    </motion.section>
  );
}

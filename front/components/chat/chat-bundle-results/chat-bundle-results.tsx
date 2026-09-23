"use client";

import type { Ref } from "react";

import type { BundleItem, EventBundle, Locale } from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { ChatResultCard } from "../chat-result-card/chat-result-card";
import styles from "./chat-bundle-results.module.css";

interface ChatBundleResultsProps {
  bundle: EventBundle;
  copy: ChatMessages;
  locale: Locale;
  sectionRef: Ref<HTMLElement>;
}

function BundleGroup({
  items,
  title,
  copy,
  locale,
  open,
}: {
  items: BundleItem[];
  title: string;
  copy: ChatMessages;
  locale: Locale;
  open: boolean;
}) {
  const formatter = new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`);

  return (
    <div className={styles.group}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.emptyGroup}>{copy.bundle.none}</p>
      ) : items.map((item) => {
        const category = copy.labels.categories[
          item.category as keyof ChatMessages["labels"]["categories"]
        ] ?? item.category;
        return (
          <details className={styles.item} key={item.category} open={open ? true : undefined}>
            <summary>
              <span>
                <strong>{category}</strong>
                <small>{copy.result.outcome[item.match.outcome]}</small>
              </span>
              <span className={styles.budget}>
                {copy.bundle.allocation}: {formatter.format(item.allocatedBudgetKzt)} ₸
              </span>
              <span aria-hidden="true" className={styles.chevron}>⌄</span>
            </summary>
            <div className={styles.itemBody}>
              <p>{item.match.summary}</p>
              {item.match.criteria.length > 0 && (
                <ul className={styles.criteria}>
                  {item.match.criteria.map((criterion, index) => (
                    <li key={`${index}-${criterion}`}>{criterion}</li>
                  ))}
                </ul>
              )}
              {item.match.cards.length > 0 ? (
                <div className={styles.cards}>
                  {item.match.cards.map((card, index) => (
                    <ChatResultCard
                      card={card}
                      copy={copy}
                      key={card.id}
                      locale={locale}
                      rank={index + 1}
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.emptyMatch}>{copy.result.emptyHint}</p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function ChatBundleResults({ bundle, copy, locale, sectionRef }: ChatBundleResultsProps) {
  const formatter = new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`);
  const city = copy.labels.cities[
    bundle.city as keyof ChatMessages["labels"]["cities"]
  ] ?? bundle.city;
  const eventType = copy.labels.eventFormats[
    bundle.eventType as keyof ChatMessages["labels"]["eventFormats"]
  ] ?? bundle.eventType;

  return (
    <section className={styles.results} id="chat-results" ref={sectionRef} tabIndex={-1}>
      <div className={styles.overview}>
        <p>{copy.bundle.eyebrow}</p>
        <h2>{copy.bundle.title}</h2>
        <div className={styles.meta}>
          <span>{city}</span>
          <span>{bundle.date}</span>
          <span>{eventType}</span>
          <span>{formatter.format(bundle.totalBudgetKzt)} ₸</span>
        </div>
        <p className={styles.summary}>{bundle.summary}</p>
      </div>
      <BundleGroup
        copy={copy}
        items={bundle.required}
        locale={locale}
        open
        title={copy.bundle.required}
      />
      <BundleGroup
        copy={copy}
        items={bundle.recommended}
        locale={locale}
        open={false}
        title={copy.bundle.recommended}
      />
    </section>
  );
}

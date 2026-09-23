"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const currency = new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`);

  return (
    <section className={styles.group}>
      <h3>{label}</h3>
      <div className={styles.items}>
        {items.map((item) => {
          const category =
            copy.labels.categories[
              item.category as keyof ChatMessages["labels"]["categories"]
            ] ?? item.category;
          return (
            <article className={styles.item} key={item.category}>
              <header>
                <div>
                  <p>{copy.bundle.category}</p>
                  <h4>{category}</h4>
                </div>
                <span>
                  {copy.bundle.budget}: {currency.format(item.allocatedBudgetKzt)} ₸
                </span>
              </header>
              <p className={styles.summary}>{item.match.summary}</p>
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
                <p className={styles.empty}>{copy.bundle.empty}</p>
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
  const currency = new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`);

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className={styles.results}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      ref={sectionRef}
      tabIndex={-1}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className={styles.overview}>
        <div>
          <p>{copy.bundle.eyebrow}</p>
          <h2>{copy.bundle.title}</h2>
        </div>
        <span>{currency.format(bundle.totalBudgetKzt)} ₸</span>
        <p>{bundle.summary}</p>
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

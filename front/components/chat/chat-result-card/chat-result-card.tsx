"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Locale, MatchCard } from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-result-card.module.css";

interface ChatResultCardProps {
  card: MatchCard;
  copy: ChatMessages;
  locale: Locale;
  rank: number;
}

export function ChatResultCard({ card, copy, locale, rank }: ChatResultCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const category = copy.labels.categories[
    card.category as keyof ChatMessages["labels"]["categories"]
  ] ?? card.category;
  const city = copy.labels.cities[
    card.city as keyof ChatMessages["labels"]["cities"]
  ] ?? card.city;
  const price = new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-KZ`).format(
    card.priceFromKzt,
  );
  const flags = [
    card.flags.synthetic ? copy.result.flags.synthetic : null,
    card.flags.priceImputed ? copy.result.flags.priceImputed : null,
    card.flags.cityImputed ? copy.result.flags.cityImputed : null,
  ].filter((flag): flag is string => Boolean(flag));

  return (
    <article className={styles.card}>
      <div className={styles.visual}>
        {!imageFailed ? (
          <Image
            alt={`${card.anonName}, ${category}`}
            className={styles.image}
            fill
            onError={() => setImageFailed(true)}
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
            src={`/contractors/${card.id}.webp`}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span>{String(rank).padStart(2, "0")}</span>
            <strong>{category.slice(0, 1)}</strong>
          </div>
        )}
        <span className={styles.rank}>#{rank}</span>
        <span className={styles.photoLabel}>{imageFailed ? copy.result.photoMissing : copy.result.photo}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.identity}>
          <div>
            <p>{category}</p>
            <h3>{card.anonName}</h3>
          </div>
          <span>{city}</span>
        </div>

        <p className={styles.price}>
          <span>{copy.result.from}</span> <strong>{price} ₸</strong>
        </p>
        <p className={styles.reason}>{card.reason}</p>

        {flags.length > 0 && (
          <ul className={styles.flags}>
            {flags.map((flag) => <li key={flag}>{flag}</li>)}
          </ul>
        )}

        <div className={styles.facts}>
          <h4>{copy.result.facts}</h4>
          <ul>
            {card.factsUsed.map((fact, index) => (
              <li key={`${fact.key}-${index}`}>
                <span className={fact.verified ? styles.verified : styles.claimed} aria-hidden="true">
                  {fact.verified ? "✓" : "○"}
                </span>
                <span>
                  <strong>{fact.label}</strong>
                  <small>{fact.verified ? copy.result.verified : copy.result.claimed}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Link className={styles.profileLink} href={`/contractor/${card.id}`}>
          {card.id}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";

import type { Locale, MatchCard as MatchCardData } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { highlightReason } from "./highlight-reason";
import cardStyles from "./match-card.module.css";

import { CategoryIcon, CheckIcon, PinIcon, QuoteIcon } from "../icons/icons";

interface MatchCardCopy {
  choice: string;
  from: string;
  verified: string;
  claimed: string;
  aiPhoto: string;
  synthetic: string;
  provenance: string;
  priceImputed: string;
  cityImputed: string;
}

interface MatchCardProps {
  card: MatchCardData;
  categories: MatchMessages["categories"];
  cities: MatchMessages["cities"];
  copy: MatchCardCopy;
  locale: Locale;
  rank: number;
}

const LOCALE_TAG: Record<Locale, string> = {
  en: "en-US",
  kk: "kk-KZ",
  ru: "ru-RU",
};

export function MatchCard({ card, categories, cities, copy, locale, rank }: MatchCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { parts, remainingFacts } = highlightReason(card.reason, card.factsUsed);
  const flags = [
    card.flags.synthetic ? copy.synthetic : null,
    card.flags.priceImputed ? copy.priceImputed : null,
    card.flags.cityImputed ? copy.cityImputed : null,
  ].filter((flag): flag is string => Boolean(flag));

  const price = new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: 0,
  }).format(card.priceFromKzt);

  return (
    <article className={cardStyles.card}>
      <div className={cardStyles.visual}>
        {!imageFailed ? (
          <Image
            src={`/contractors/${card.id}.webp`}
            alt={`${card.anonName}, ${categories[card.category as keyof typeof categories] ?? card.category}`}
            fill
            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className={cardStyles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={cardStyles.placeholder} aria-hidden="true">
            <CategoryIcon category={card.category} />
            <span>{categories[card.category as keyof typeof categories] ?? card.category}</span>
          </div>
        )}

        <span className={cardStyles.rank} aria-label={`${copy.choice} ${rank}`}>
          {rank}
        </span>
        {!imageFailed && <span className={cardStyles.photoNote}>{copy.aiPhoto}</span>}
      </div>

      <div className={cardStyles.body}>
        <div className={cardStyles.identity}>
          <div>
            <p className={cardStyles.category}>{categories[card.category as keyof typeof categories] ?? card.category}</p>
            <h3>{card.anonName}</h3>
          </div>
          <p className={cardStyles.location}>
            <PinIcon />
            {cities[card.city as keyof typeof cities] ?? card.city}
          </p>
        </div>

        {flags.length > 0 && (
          <ul className={cardStyles.flags} aria-label={copy.provenance}>
            {flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        )}

        <div className={cardStyles.price}>
          <span>{copy.from}</span>
          <strong>{price} ₸</strong>
        </div>

        <div className={cardStyles.reason}>
          <p>{parts.map((part) => part.verified ? (
            <mark key={part.start} className={cardStyles.verified} title={copy.verified}>{part.text}</mark>
          ) : part.text)}</p>
        </div>

        {remainingFacts.length > 0 && <ul className={cardStyles.facts}>
          {remainingFacts.map((fact, index) => (
            <li
              className={fact.verified ? cardStyles.factVerified : cardStyles.factClaimed}
              key={`${fact.key}-${index}`}
            >
              <span className={cardStyles.factIcon} aria-hidden="true">
                {fact.verified ? <CheckIcon /> : <QuoteIcon />}
              </span>
              <span>
                <strong>{fact.label}</strong>
                <small>{fact.verified ? copy.verified : copy.claimed}</small>
              </span>
            </li>
          ))}
        </ul>}
      </div>
    </article>
  );
}

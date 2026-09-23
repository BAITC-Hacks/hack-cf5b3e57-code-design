"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  CheckStatusIcon,
  ClaimedStatusIcon,
} from "@/components/shared/status-icons/status-icons";
import type { MatchCard } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { formatMoney } from "../shared/format";
import { splitReason } from "../shared/highlight";
import { Icon } from "../shared/icon";
import styles from "./manager-contractor-card.module.css";

export function ManagerContractorCard({ card, position }: { card: MatchCard; position: number }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  const reducedMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);
  const category = messages.form.categories[card.category] ?? card.category;
  const flags = [
    card.flags.synthetic ? messages.cards.synthetic : null,
    card.flags.cityImputed ? messages.cards.cityImputed : null,
    card.flags.priceImputed ? messages.cards.priceImputed : null,
  ].filter((flag): flag is string => Boolean(flag));
  return (
    <motion.article className={styles.card} initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .34, delay: reducedMotion ? 0 : (position - 1) * .08 }}>
      <div className={styles.visual}>
        {imageFailed ? (
          <div className={styles.placeholder}>
            <Icon><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="12" cy="12" r="3.5" /></Icon>
            <span>{messages.cards.photoMissing}</span>
          </div>
        ) : (
          <Image
            src={`/contractors/${encodeURIComponent(card.id)}.webp`}
            alt={`${card.anonName}, ${category}`}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1120px) 50vw, 400px"
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        )}
        <span className={styles.rank} aria-label={messages.cards.rank(position)}>{position}</span>
        {!imageFailed && <span className={styles.photoNote}>{messages.cards.photo}</span>}
      </div>
      <div className={styles.body}>
        <p className={styles.category}>{category}</p>
        <h3>{card.anonName}</h3>
        <p className={styles.meta}>
          <span><Icon><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></Icon>{messages.form.cities[card.city] ?? card.city}</span>
          <span>{card.id}</span>
        </p>
        {flags.length > 0 && <ul className={styles.flags} aria-label={messages.cards.flagsAria}>{flags.map((flag) => <li key={flag}>{flag}</li>)}</ul>}
        <div className={styles.price}><span>{messages.cards.from}</span><strong>{formatMoney(card.priceFromKzt, locale)}</strong></div>
        <p className={styles.reason}>
          {splitReason(card.reason, card.factsUsed).map((part) => part.verified
            ? <mark key={part.start} title={messages.cards.verified}>{part.text}</mark>
            : part.text)}
        </p>
        {card.factsUsed.length > 0 && (
          <ul className={styles.facts} aria-label={messages.cards.evidenceAria}>
            {card.factsUsed.map((fact, index) => (
              <li className={fact.verified ? styles.verified : styles.claimed} key={`${fact.key}-${index}`}>
                <span className={styles.factIcon} aria-hidden="true">{fact.verified ? <CheckStatusIcon /> : <ClaimedStatusIcon />}</span>
                <span><strong lang="ru">{fact.label}</strong><small>{fact.verified ? messages.cards.verified : messages.cards.claimed}</small></span>
              </li>
            ))}
          </ul>
        )}
        <Link className={styles.profile} href={`/contractor/${encodeURIComponent(card.id)}`}>
          {messages.cards.profileLink}<Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
        </Link>
      </div>
    </motion.article>
  );
}

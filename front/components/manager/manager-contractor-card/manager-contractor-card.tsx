"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  CheckStatusIcon,
  ClaimedStatusIcon,
} from "@/components/shared/status-icons/status-icons";
import type { MatchCard } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./manager-contractor-card.module.css";

export function ManagerContractorCard({ card, position }: { card: MatchCard; position: number }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  const reducedMotion = useReducedMotion();
  const numberLocale = locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU";
  const price = new Intl.NumberFormat(numberLocale, { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(card.priceFromKzt);
  return (
    <motion.article className={styles.card} initial={reducedMotion ? false : { opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reducedMotion ? 0 : .38, delay: reducedMotion ? 0 : (position - 1) * .08 }}>
      <div className={styles.topline}><span className={styles.position}>#{position}</span><span className={styles.id}>{card.id}</span></div>
      <div className={styles.heading}><span className={styles.avatar} aria-hidden="true">{card.anonName.slice(0, 1)}</span><div><h3>{card.anonName}</h3><p>{messages.form.categories[card.category] ?? card.category} · {messages.form.cities[card.city] ?? card.city}</p></div></div>
      <p className={styles.price}>{price}</p><p className={styles.reason}>{card.reason}</p>
      <div className={styles.facts} aria-label={messages.cards.evidenceAria}>
        {card.factsUsed.map((fact, index) => <div className={fact.verified ? styles.verified : styles.claimed} key={`${fact.key}-${index}`}><span className={styles.factIcon} aria-hidden="true">{fact.verified ? <CheckStatusIcon /> : <ClaimedStatusIcon />}</span><span><strong>{fact.verified ? messages.cards.verified : messages.cards.claimed}</strong>{fact.label}</span></div>)}
      </div>
      {(card.flags.synthetic || card.flags.cityImputed || card.flags.priceImputed) && <div className={styles.flags} aria-label={messages.cards.flagsAria}>{card.flags.synthetic && <span>{messages.cards.synthetic}</span>}{card.flags.cityImputed && <span>{messages.cards.cityImputed}</span>}{card.flags.priceImputed && <span>{messages.cards.priceImputed}</span>}</div>}
    </motion.article>
  );
}

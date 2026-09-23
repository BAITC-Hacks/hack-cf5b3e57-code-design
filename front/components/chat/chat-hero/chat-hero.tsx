"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-hero.module.css";

export function ChatHero({ copy }: { copy: ChatMessages }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={styles.hero} aria-labelledby="chat-title">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={styles.eyebrow}>{copy.hero.eyebrow}</p>
        <h1 id="chat-title">
          {copy.hero.title} <span>{copy.hero.accent}</span>
        </h1>
        <p className={styles.description}>{copy.hero.description}</p>
      </motion.div>
    </section>
  );
}

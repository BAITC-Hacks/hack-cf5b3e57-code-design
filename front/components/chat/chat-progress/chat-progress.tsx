"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ChatMode, Locale } from "../../../../shared/contract";
import {
  CHAT_FIELDS,
  fieldValue,
  type ChatDraft,
} from "@/lib/chat/chat-assistant";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-progress.module.css";

interface ChatProgressProps {
  copy: ChatMessages;
  draft: ChatDraft;
  locale: Locale;
  mode: ChatMode;
}

export function ChatProgress({
  copy,
  draft,
  locale,
  mode,
}: ChatProgressProps) {
  const reduceMotion = useReducedMotion();
  const fields = mode === "bundle"
    ? CHAT_FIELDS.filter((field) => field !== "category")
    : CHAT_FIELDS;
  const completed = fields.filter((field) => fieldValue(field, draft, copy, locale)).length;

  return (
    <aside className={styles.panel} aria-labelledby="chat-progress-title">
      <div className={styles.heading}>
        <div>
          <p>{copy.progress.eyebrow}</p>
          <h2 id="chat-progress-title">{copy.progress.title}</h2>
        </div>
        <span>{completed}/{fields.length}</span>
      </div>

      <ol className={styles.list}>
        {fields.map((field, index) => {
          const value = fieldValue(field, draft, copy, locale);

          return (
            <motion.li
              animate={{ opacity: 1, x: 0 }}
              className={value ? styles.complete : undefined}
              initial={reduceMotion ? false : { opacity: 0, x: 10 }}
              key={field}
              transition={{ delay: reduceMotion ? 0 : index * 0.035, duration: reduceMotion ? 0 : 0.28 }}
            >
              <span className={styles.index} aria-hidden="true">
                {value ? "✓" : String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.field}>
                <strong>
                  {copy.fields[field].label}
                  {field === "language" && <small>{copy.progress.optional}</small>}
                </strong>
                <span>{value ?? "—"}</span>
              </span>
            </motion.li>
          );
        })}
      </ol>
      <p className={styles.note}>{copy.progress.note}</p>
    </aside>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";

import { CheckStatusIcon } from "@/components/shared/status-icons/status-icons";
import type { Locale } from "../../../../shared/contract";
import {
  CHAT_FIELDS,
  fieldValue,
  type ChatDraft,
} from "@/lib/chat/chat-assistant";
import type { ChatField, ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-progress.module.css";

interface ChatProgressProps {
  activeField: ChatField | null;
  copy: ChatMessages;
  draft: ChatDraft;
  locale: Locale;
  onEdit: (field: ChatField) => void;
  pending: boolean;
}

export function ChatProgress({
  activeField,
  copy,
  draft,
  locale,
  onEdit,
  pending,
}: ChatProgressProps) {
  const reduceMotion = useReducedMotion();

  return (
    <aside className={styles.panel} aria-labelledby="chat-progress-title">
      <div className={styles.heading}>
        <div>
          <p>{copy.progress.eyebrow}</p>
          <h2 id="chat-progress-title">{copy.progress.title}</h2>
        </div>
        <span>{CHAT_FIELDS.filter((field) => fieldValue(field, draft, copy, locale)).length}/6</span>
      </div>

      <ol className={styles.list}>
        {CHAT_FIELDS.map((field, index) => {
          const value = fieldValue(field, draft, copy, locale);
          const isActive = activeField === field;

          return (
            <motion.li
              animate={{ opacity: 1, x: 0 }}
              className={isActive ? styles.active : value ? styles.complete : undefined}
              initial={reduceMotion ? false : { opacity: 0, x: 10 }}
              key={field}
              transition={{ delay: reduceMotion ? 0 : index * 0.035, duration: reduceMotion ? 0 : 0.28 }}
            >
              <span className={styles.index} aria-hidden="true">
                {value ? <CheckStatusIcon /> : String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.field}>
                <strong>
                  {copy.fields[field].label}
                  {field === "language" && <small>{copy.progress.optional}</small>}
                </strong>
                <span>{value ?? (isActive ? copy.progress.pending : "—")}</span>
              </span>
              {value && (
                <button
                  aria-label={`${copy.progress.edit}: ${copy.fields[field].label}`}
                  disabled={pending}
                  onClick={() => onEdit(field)}
                  type="button"
                >
                  {copy.progress.edit}
                </button>
              )}
            </motion.li>
          );
        })}
      </ol>
    </aside>
  );
}

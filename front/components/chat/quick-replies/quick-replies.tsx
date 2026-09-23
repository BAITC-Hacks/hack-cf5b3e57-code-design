"use client";

import { motion, useReducedMotion } from "framer-motion";

import styles from "./quick-replies.module.css";

export interface QuickReply {
  label: string;
  value: string;
  displayValue?: string;
}

export function QuickReplies({
  disabled,
  items,
  onSelect,
}: {
  disabled: boolean;
  items: readonly QuickReply[];
  onSelect: (item: QuickReply) => void;
}) {
  const reduceMotion = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <div className={styles.list}>
      {items.map((item, index) => (
        <motion.button
          animate={{ opacity: 1, y: 0 }}
          disabled={disabled}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          key={`${item.value}-${index}`}
          onClick={() => onSelect(item)}
          transition={{ delay: reduceMotion ? 0 : Math.min(index, 8) * 0.025, duration: reduceMotion ? 0 : 0.2 }}
          type="button"
        >
          {item.label}
        </motion.button>
      ))}
    </div>
  );
}

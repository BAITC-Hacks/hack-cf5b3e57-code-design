"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ChatMode } from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-mode-switcher.module.css";

interface ChatModeSwitcherProps {
  copy: ChatMessages;
  disabled: boolean;
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

export function ChatModeSwitcher({
  copy,
  disabled,
  mode,
  onChange,
}: ChatModeSwitcherProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={styles.root} aria-label={copy.modes.label} role="group">
      {(["search", "bundle"] as const).map((value) => (
        <button
          aria-pressed={mode === value}
          className={mode === value ? styles.active : undefined}
          disabled={disabled}
          key={value}
          onClick={() => onChange(value)}
          type="button"
        >
          {mode === value && (
            <motion.span
              className={styles.indicator}
              layoutId="chat-mode-indicator"
              transition={{ duration: reduceMotion ? 0 : 0.22 }}
            />
          )}
          <span>
            <strong>{copy.modes[value].label}</strong>
            <small>{copy.modes[value].description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

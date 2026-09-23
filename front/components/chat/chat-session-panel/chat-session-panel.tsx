"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { ChatMode, ChatSseEventMap } from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { ChatModeSwitcher } from "../chat-mode-switcher/chat-mode-switcher";
import styles from "./chat-session-panel.module.css";

export type ChatConnectionPhase = "starting" | "ready" | "streaming" | "error";

interface ChatSessionPanelProps {
  copy: ChatMessages;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  phase: ChatConnectionPhase;
  sessionId: string | null;
  tool: ChatSseEventMap["tool_start"]["name"] | null;
}

export function ChatSessionPanel({
  copy,
  mode,
  onModeChange,
  phase,
  sessionId,
  tool,
}: ChatSessionPanelProps) {
  const reduceMotion = useReducedMotion();
  const busy = phase === "starting" || phase === "streaming";

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className={styles.panel}
      initial={reduceMotion ? false : { opacity: 0, x: 14 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <div className={styles.heading}>
        <p>{copy.session.eyebrow}</p>
        <h2>{copy.session.title}</h2>
      </div>

      <ChatModeSwitcher
        copy={copy}
        disabled={busy}
        mode={mode}
        onChange={onModeChange}
      />

      <div className={styles.status} data-phase={phase}>
        <span aria-hidden="true" />
        <div>
          <strong>{copy.session.status[phase]}</strong>
          <small>
            {tool ? copy.tools[tool] : copy.session.statusDescription[phase]}
          </small>
        </div>
      </div>

      {sessionId && (
        <p className={styles.sessionId} title={sessionId}>
          <span>{copy.session.id}</span>
          <code>{sessionId.slice(0, 12)}</code>
        </p>
      )}
    </motion.aside>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import type { ChatTranscriptMessage } from "@/lib/chat/chat-assistant";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import styles from "./chat-thread.module.css";

interface ChatThreadProps {
  copy: ChatMessages;
  messages: readonly ChatTranscriptMessage[];
  pending: boolean;
}

export function ChatThread({ copy, messages, pending }: ChatThreadProps) {
  const reduceMotion = useReducedMotion();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [messages, pending, reduceMotion]);

  return (
    <div
      aria-label={copy.assistant.name}
      aria-live="polite"
      aria-relevant="additions"
      className={styles.thread}
      role="log"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={message.role === "assistant" ? styles.assistantRow : styles.userRow}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            key={message.id}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {message.role === "assistant" && (
              <span className={styles.avatar} aria-hidden="true">T</span>
            )}
            <div className={styles.message}>
              <span className={styles.role}>
                {message.role === "assistant" ? copy.assistant.label : copy.composer.label}
              </span>
              <p>{message.text}</p>
            </div>
          </motion.div>
        ))}

        {pending && (
          <motion.div
            animate={{ opacity: 1 }}
            className={styles.assistantRow}
            initial={reduceMotion ? false : { opacity: 0 }}
            key="pending"
          >
            <span className={styles.avatar} aria-hidden="true">T</span>
            <div className={`${styles.message} ${styles.typing}`}>
              <span className="visually-hidden">{copy.assistant.searching}</span>
              <i />
              <i />
              <i />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

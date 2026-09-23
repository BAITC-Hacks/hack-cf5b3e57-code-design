"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";

import type { ChatMessage } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { humanizeDates } from "../format-dates";
import styles from "./chat-thread.module.css";

function AssistantAvatar() {
  return (
    <span className={styles.avatar} aria-hidden="true">
      <Image alt="" height={160} src="/mascot/nurlan-hello.webp" width={160} />
    </span>
  );
}

interface ChatThreadProps {
  copy: ChatMessages;
  messages: readonly ChatMessage[];
  pending: boolean;
}

export function ChatThread({ copy, messages, pending }: ChatThreadProps) {
  const reduceMotion = useReducedMotion();
  const { locale } = useLocale();
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
            {message.role === "assistant" && <AssistantAvatar />}
            <div className={styles.message}>
              <span className={styles.role}>
                {message.role === "assistant" ? copy.assistant.label : copy.composer.label}
              </span>
              <p>
                {message.role === "assistant"
                  ? humanizeDates(message.content, locale)
                  : message.content}
              </p>
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
            <AssistantAvatar />
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

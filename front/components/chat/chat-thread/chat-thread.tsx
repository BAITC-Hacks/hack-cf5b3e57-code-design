"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";

import type { ChatMessage, Locale } from "../../../../shared/contract";
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

function inlineText(value: string): ReactNode[] {
  const content: ReactNode[] = [];
  const emphasis = /\*\*([^*]+)\*\*/g;
  let cursor = 0;

  for (const match of value.matchAll(emphasis)) {
    const index = match.index ?? 0;
    if (index > cursor) content.push(value.slice(cursor, index).replaceAll("**", ""));
    content.push(<strong key={index}>{match[1]}</strong>);
    cursor = index + match[0].length;
  }
  if (cursor < value.length) content.push(value.slice(cursor).replaceAll("**", ""));

  return content;
}

function assistantContent(value: string, locale: Locale): ReactNode[] {
  const lines = humanizeDates(value, locale).replaceAll("\r\n", "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const key = blocks.length;
    blocks.push(
      <p key={key}>
        {paragraph.map((line, index) => (
          <span key={index}>
            {index > 0 && <br />}
            {inlineText(line)}
          </span>
        ))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    const key = blocks.length;
    const entries = list.map((line, index) => <li key={index}>{inlineText(line)}</li>);
    blocks.push(ordered ? <ol key={key}>{entries}</ol> : <ul key={key}>{entries}</ul>);
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = line.match(/^(?:[-*•]\s+|\d+[.)]\s+)(.+)$/);
    if (bullet) {
      flushParagraph();
      const nextOrdered = /^\d/.test(line);
      if (list.length > 0 && nextOrdered !== ordered) flushList();
      ordered = nextOrdered;
      list.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(line.replace(/^#{1,6}\s+/, "").replace(/^>\s+/, ""));
  }
  flushParagraph();
  flushList();

  return blocks;
}

interface ChatThreadProps {
  copy: ChatMessages;
  messages: readonly ChatMessage[];
  pending: boolean;
}

export function ChatThread({ copy, messages, pending }: ChatThreadProps) {
  const reduceMotion = useReducedMotion();
  const { locale } = useLocale();
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thread = threadRef.current;
    thread?.scrollTo({
      top: thread.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, pending, reduceMotion]);

  return (
    <div
      aria-label={copy.assistant.name}
      aria-live="polite"
      aria-relevant="additions"
      className={styles.thread}
      ref={threadRef}
      role="log"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => {
          const content = message.role === "assistant" && message.attachments?.length
            ? copy.assistant.attachmentReady
            : message.content;
          return <motion.div
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
              <div className={styles.content}>
                {message.role === "assistant" ? (
                  assistantContent(content, locale)
                ) : (
                  <p>{content}</p>
                )}
              </div>
            </div>
          </motion.div>;
        })}

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
    </div>
  );
}

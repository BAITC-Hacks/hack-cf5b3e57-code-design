"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CATEGORIES,
  CITIES,
  EVENT_FORMATS,
  LANGUAGES,
} from "../../../../shared/contract";
import type { MatchResponse } from "../../../../shared/contract";
import {
  EMPTY_CHAT_DRAFT,
  getNextChatField,
  invalidMessage,
  parseChatInput,
  toMatchRequest,
  type ChatDraft,
  type ChatTranscriptMessage,
} from "@/lib/chat/chat-assistant";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CHAT_MESSAGES, type ChatField } from "@/lib/i18n/messages/chat";
import { MatchApiError, requestMatch } from "@/lib/match-api";
import { ChatComposer } from "../chat-composer/chat-composer";
import { ChatHeader } from "../chat-header/chat-header";
import { ChatHero } from "../chat-hero/chat-hero";
import { ChatProgress } from "../chat-progress/chat-progress";
import { ChatResults } from "../chat-results/chat-results";
import { ChatThread } from "../chat-thread/chat-thread";
import type { QuickReply } from "../quick-replies/quick-replies";
import styles from "./chat-experience.module.css";

type ChatPhase = "collecting" | "loading" | "result" | "error";

function initialMessages(copy: (typeof CHAT_MESSAGES)["ru"]): ChatTranscriptMessage[] {
  return [
    { id: "welcome", role: "assistant", text: copy.assistant.greeting },
    { id: "transparency", role: "assistant", text: copy.assistant.transparency },
    { id: "first-question", role: "assistant", text: copy.fields.category.prompt },
  ];
}

export function ChatExperience() {
  const { locale } = useLocale();
  const copy = CHAT_MESSAGES[locale];
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<ChatDraft>(EMPTY_CHAT_DRAFT);
  const [activeField, setActiveField] = useState<ChatField | null>("category");
  const [messages, setMessages] = useState<ChatTranscriptMessage[]>(() => initialMessages(copy));
  const [phase, setPhase] = useState<ChatPhase>("collecting");
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageSequence = useRef(3);
  const controllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const quickReplies = useMemo<readonly QuickReply[]>(() => {
    switch (activeField) {
      case "category":
        return CATEGORIES.map((value) => ({ label: copy.labels.categories[value], value }));
      case "city":
        return CITIES.map((value) => ({ label: copy.labels.cities[value], value }));
      case "date":
        return copy.quickDates;
      case "eventType":
        return EVENT_FORMATS.map((value) => ({ label: copy.labels.eventFormats[value], value }));
      case "budgetKzt":
        return copy.quickBudgets;
      case "language":
        return [
          ...LANGUAGES.map((value) => ({ label: copy.labels.languages[value], value })),
          { label: copy.actions.anyLanguage, value: "any" },
        ];
      default:
        return [];
    }
  }, [activeField, copy]);

  function appendMessage(role: ChatTranscriptMessage["role"], text: string) {
    messageSequence.current += 1;
    const message = { id: `chat-${messageSequence.current}`, role, text };
    setMessages((current) => [...current, message]);
  }

  function appendAssistant(...texts: string[]) {
    setMessages((current) => [
      ...current,
      ...texts.map((text) => {
        messageSequence.current += 1;
        return {
          id: `chat-${messageSequence.current}`,
          role: "assistant" as const,
          text,
        };
      }),
    ]);
  }

  async function runMatch(nextDraft: ChatDraft) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase("loading");
    setResult(null);
    setError(null);

    try {
      const response = await requestMatch(toMatchRequest(nextDraft, locale), controller.signal);
      setResult(response);
      setPhase("result");
      appendAssistant(copy.assistant.resultReady);
      window.requestAnimationFrame(() => {
        resultRef.current?.focus({ preventScroll: true });
        resultRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      const message = requestError instanceof MatchApiError
        ? requestError.message
        : copy.assistant.error;
      setError(message);
      setPhase("error");
      appendAssistant(copy.assistant.error);
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function handleSend(value: string, displayValue = value) {
    if (phase === "loading") return;
    appendMessage("user", displayValue);

    const expectedField = activeField;
    const parsed = parseChatInput(value, draft, expectedField, copy.labels);
    setDraft(parsed.draft);

    if (expectedField && !parsed.recognized.includes(expectedField)) {
      appendAssistant(invalidMessage(expectedField, copy), copy.fields[expectedField].prompt);
      return;
    }

    if (!expectedField && parsed.recognized.length === 0) {
      appendAssistant(copy.assistant.noRecognition);
      return;
    }

    const nextField = getNextChatField(parsed.draft);
    if (nextField) {
      setActiveField(nextField);
      setPhase("collecting");
      appendAssistant(copy.assistant.understood, copy.fields[nextField].prompt);
      return;
    }

    setActiveField(null);
    appendAssistant(
      getNextChatField(draft) === null ? copy.assistant.changed : copy.assistant.understood,
      copy.assistant.searching,
    );
    void runMatch(parsed.draft);
  }

  function handleEdit(field: ChatField) {
    controllerRef.current?.abort();
    setActiveField(field);
    setPhase("collecting");
    setResult(null);
    setError(null);
    appendAssistant(copy.fields[field].prompt);
  }

  function handleRestart() {
    controllerRef.current?.abort();
    messageSequence.current = 4;
    setDraft(EMPTY_CHAT_DRAFT);
    setActiveField("category");
    setPhase("collecting");
    setResult(null);
    setError(null);
    setMessages([
      ...initialMessages(copy).slice(0, 2),
      { id: "restart", role: "assistant", text: copy.assistant.restarted },
      { id: "restart-question", role: "assistant", text: copy.fields.category.prompt },
    ]);
  }

  const pending = phase === "loading";

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#chat-conversation">{copy.skip}</a>
      <ChatHeader copy={copy} />
      <ChatHero copy={copy} />

      <main className={styles.main} id="chat-conversation">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className={styles.conversation}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.conversationHeader}>
            <div>
              <span aria-hidden="true" />
              <strong>{copy.assistant.name}</strong>
            </div>
            <button disabled={pending} onClick={handleRestart} type="button">
              {copy.actions.restart}
            </button>
          </div>
          <ChatThread copy={copy} messages={messages} pending={pending} />
          <ChatComposer
            copy={copy}
            disabled={pending}
            focusKey={activeField ?? phase}
            onSend={handleSend}
            placeholder={activeField ? copy.fields[activeField].placeholder : copy.actions.change}
            quickReplies={quickReplies}
          />
        </motion.section>

        <ChatProgress
          activeField={activeField}
          copy={copy}
          draft={draft}
          locale={locale}
          onEdit={handleEdit}
          pending={pending}
        />
      </main>

      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {pending ? copy.assistant.searching : error ?? result?.summary ?? ""}
      </div>

      {error && (
        <section className={styles.error} role="alert">
          <p>{error}</p>
          <div>
            <button onClick={() => {
              appendAssistant(copy.assistant.searching);
              void runMatch(draft);
            }} type="button">
              {copy.actions.retry}
            </button>
            <button onClick={handleRestart} type="button">{copy.actions.restart}</button>
          </div>
        </section>
      )}

      {result && <ChatResults copy={copy} locale={locale} result={result} sectionRef={resultRef} />}

      <footer className={styles.footer}>
        <strong>{copy.brand}</strong>
        <span>{copy.hero.badge}</span>
      </footer>
    </div>
  );
}

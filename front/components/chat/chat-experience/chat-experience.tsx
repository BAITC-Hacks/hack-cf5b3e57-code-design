"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ChatAttachment,
  ChatCreateSessionResponse,
  ChatMode,
} from "../../../../shared/contract";
import { ChatApiError, createChatSession, sendChatMessage } from "@/lib/chat/chat-api";
import {
  EMPTY_CHAT_DRAFT,
  parseChatInput,
  type ChatDraft,
  type ChatTranscriptMessage,
} from "@/lib/chat/chat-assistant";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CHAT_MESSAGES } from "@/lib/i18n/messages/chat";
import { ChatBundleResults } from "../chat-bundle-results/chat-bundle-results";
import { ChatComposer } from "../chat-composer/chat-composer";
import { ChatHeader } from "../chat-header/chat-header";
import { ChatHero } from "../chat-hero/chat-hero";
import { ChatProgress } from "../chat-progress/chat-progress";
import { ChatResults } from "../chat-results/chat-results";
import { ChatThread } from "../chat-thread/chat-thread";
import type { QuickReply } from "../quick-replies/quick-replies";
import styles from "./chat-experience.module.css";

type ChatPhase = "connecting" | "ready" | "loading" | "error";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function ChatExperience() {
  const { locale } = useLocale();
  const copy = CHAT_MESSAGES[locale];
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<ChatMode>("search");
  const [session, setSession] = useState<ChatCreateSessionResponse | null>(null);
  const [phase, setPhase] = useState<ChatPhase>("connecting");
  const [messages, setMessages] = useState<ChatTranscriptMessage[]>([]);
  const [draft, setDraft] = useState<ChatDraft>(EMPTY_CHAT_DRAFT);
  const [result, setResult] = useState<ChatAttachment | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const operationRef = useRef(0);
  const messageSequence = useRef(0);
  const resultRef = useRef<HTMLElement | null>(null);

  const loadSession = useCallback(async (
    nextMode: ChatMode,
    controller: AbortController,
    operation: number,
  ) => {
    try {
      const created = await createChatSession({ mode: nextMode, locale }, controller.signal);
      if (operationRef.current !== operation) return;
      setSession(created);
      setMessages([{ id: `welcome-${created.sessionId}`, role: "assistant", text: created.greeting }]);
      setDraft(EMPTY_CHAT_DRAFT);
      setResult(null);
      setError(null);
      setPhase("ready");
    } catch (requestError) {
      if (operationRef.current !== operation || isAbortError(requestError)) return;
      setError(requestError instanceof ChatApiError ? requestError.message : copy.assistant.sessionError);
      setPhase("error");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [copy.assistant.sessionError, locale]);

  useEffect(() => {
    const controller = new AbortController();
    const operation = ++operationRef.current;
    controllerRef.current = controller;
    void loadSession(mode, controller, operation);
    return () => {
      controllerRef.current?.abort();
      operationRef.current += 1;
    };
  }, [mode, loadSession]);

  function resetState() {
    messageSequence.current = 0;
    setSession(null);
    setMessages([]);
    setDraft(EMPTY_CHAT_DRAFT);
    setResult(null);
    setError(null);
    setLastFailedText(null);
    setToolStatus(null);
    setPhase("connecting");
  }

  function startSession(nextMode: ChatMode) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    const operation = ++operationRef.current;
    controllerRef.current = controller;
    resetState();
    void loadSession(nextMode, controller, operation);
  }

  useEffect(() => {
    if (!result || phase !== "ready") return;
    window.requestAnimationFrame(() => {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }, [phase, reduceMotion, result]);

  const quickReplies = useMemo<readonly QuickReply[]>(() => {
    if (messages.some((message) => message.role === "user")) return [];
    return copy.examples[mode];
  }, [copy.examples, messages, mode]);

  const statusForTool = useCallback((name: string) => {
    if (name === "search_contractors") return copy.tools.searching;
    if (name === "build_event_bundle") return copy.tools.bundle;
    if (name === "estimate_bundle_minimum") return copy.tools.estimating;
    return copy.assistant.searching;
  }, [copy]);

  async function sendMessage(value: string, displayValue = value) {
    if (!session || session.mode !== mode || session.locale !== locale ||
      phase === "loading" || phase === "connecting") return;
    const controller = new AbortController();
    const operation = ++operationRef.current;
    controllerRef.current = controller;
    const replyId = `reply-${++messageSequence.current}`;
    const userId = `user-${++messageSequence.current}`;
    let streamedText = "";

    setMessages((current) => [...current, { id: userId, role: "user", text: displayValue }]);
    setDraft((current) => parseChatInput(value, current, null, copy.labels).draft);
    setResult(null);
    setError(null);
    setLastFailedText(null);
    setToolStatus(null);
    setPhase("loading");

    try {
      await sendChatMessage(session.sessionId, { content: value }, (event) => {
        if (operationRef.current !== operation) return;
        switch (event.type) {
          case "token":
            streamedText += event.data.text;
            setMessages((current) => {
              const response = { id: replyId, role: "assistant" as const, text: streamedText };
              return current.some((message) => message.id === replyId)
                ? current.map((message) => message.id === replyId ? response : message)
                : [...current, response];
            });
            break;
          case "tool_start":
            setToolStatus(statusForTool(String(event.data.name)));
            break;
          case "attachment":
            setResult(event.data);
            break;
          case "done":
            setMessages((current) => {
              const response = {
                id: replyId,
                role: "assistant" as const,
                text: event.data.message.content,
              };
              return current.some((message) => message.id === replyId)
                ? current.map((message) => message.id === replyId ? response : message)
                : [...current, response];
            });
            if (event.data.message.attachments?.length) {
              setResult(event.data.message.attachments.at(-1) ?? null);
            }
            setToolStatus(null);
            break;
          case "error":
            break;
        }
      }, controller.signal);
      if (operationRef.current === operation) setPhase("ready");
    } catch (requestError) {
      if (operationRef.current !== operation || isAbortError(requestError)) return;
      setError(requestError instanceof ChatApiError ? requestError.message : copy.assistant.error);
      setLastFailedText(value);
      setToolStatus(null);
      setPhase("error");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function switchMode(nextMode: ChatMode) {
    if (nextMode === mode) return;
    controllerRef.current?.abort();
    operationRef.current += 1;
    resetState();
    setMode(nextMode);
  }

  function retry() {
    if (!session) {
      void startSession(mode);
    } else if (lastFailedText) {
      void sendMessage(lastFailedText);
    }
  }

  const sessionReady = session?.mode === mode && session.locale === locale;
  const pending = phase === "connecting" || phase === "loading" ||
    (phase !== "error" && !sessionReady);

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
            <button onClick={() => void startSession(mode)} type="button">
              {copy.actions.restart}
            </button>
          </div>
          <div aria-label={copy.mode.label} className={styles.modeSwitch} role="group">
            {(["search", "bundle"] as const).map((option) => (
              <button
                aria-pressed={mode === option}
                className={mode === option ? styles.selectedMode : undefined}
                key={option}
                onClick={() => switchMode(option)}
                type="button"
              >
                {copy.mode[option]}
              </button>
            ))}
          </div>
          <ChatThread
            copy={copy}
            messages={messages}
            pending={pending}
            pendingLabel={!sessionReady ? copy.assistant.connecting : toolStatus ?? undefined}
          />
          <ChatComposer
            copy={copy}
            disabled={pending || !sessionReady}
            focusKey={`${mode}-${phase}`}
            onSend={(value, display) => void sendMessage(value, display)}
            placeholder={copy.composer.placeholder}
            quickReplies={quickReplies}
          />
        </motion.section>

        <ChatProgress copy={copy} draft={draft} locale={locale} mode={mode} />
      </main>

      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {toolStatus ?? (phase === "connecting" ? copy.assistant.connecting : error ?? "")}
      </div>

      {error && (
        <section className={styles.error} role="alert">
          <p>{error}</p>
          <div>
            {(!session || lastFailedText) && (
              <button onClick={retry} type="button">{copy.actions.retry}</button>
            )}
            <button onClick={() => void startSession(mode)} type="button">
              {copy.actions.restart}
            </button>
          </div>
        </section>
      )}

      {sessionReady && result?.type === "match" && (
        <ChatResults copy={copy} locale={locale} result={result.match} sectionRef={resultRef} />
      )}
      {sessionReady && result?.type === "bundle" && (
        <ChatBundleResults bundle={result.bundle} copy={copy} locale={locale} sectionRef={resultRef} />
      )}

      <footer className={styles.footer}>
        <strong>{copy.brand}</strong>
        <span>{copy.hero.badge}</span>
      </footer>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ChatAttachment,
  ChatMessage,
  ChatMode,
  ChatSseEventMap,
} from "../../../../shared/contract";
import { ChatApiError, createChatSession, streamChatMessage } from "@/lib/chat/chat-api";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CHAT_MESSAGES } from "@/lib/i18n/messages/chat";
import { ChatAttachmentResults } from "../chat-attachment-results/chat-attachment-results";
import { ChatComposer } from "../chat-composer/chat-composer";
import { ChatHeader } from "../chat-header/chat-header";
import { ChatHero } from "../chat-hero/chat-hero";
import {
  ChatSessionPanel,
  type ChatConnectionPhase,
} from "../chat-session-panel/chat-session-panel";
import { ChatThread } from "../chat-thread/chat-thread";
import type { QuickReply } from "../quick-replies/quick-replies";
import styles from "./chat-experience.module.css";

function localMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `local-${crypto.randomUUID()}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function ChatExperience() {
  const { locale } = useLocale();
  const copy = CHAT_MESSAGES[locale];
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<ChatMode>("search");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatConnectionPhase>("starting");
  const [tool, setTool] = useState<ChatSseEventMap["tool_start"]["name"] | null>(null);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const sessionController = useRef<AbortController | null>(null);
  const messageController = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sessionController.current?.abort();
    messageController.current?.abort();
    const controller = new AbortController();
    sessionController.current = controller;

    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setPhase("starting");
      setSessionId(null);
      setMessages([]);
      setAttachment(null);
      setTool(null);
      setError(null);

      try {
        const session = await createChatSession({ mode, locale }, controller.signal);
        if (controller.signal.aborted) return;
        setSessionId(session.sessionId);
        setMessages([localMessage("assistant", session.greeting)]);
        setPhase("ready");
      } catch (sessionError) {
        if (sessionError instanceof DOMException && sessionError.name === "AbortError") return;
        setError(
          sessionError instanceof ChatApiError
            ? sessionError.message
            : copy.assistant.error,
        );
        setPhase("error");
      }
    })();

    return () => controller.abort();
  }, [copy.assistant.error, locale, mode, restartKey]);

  useEffect(
    () => () => {
      sessionController.current?.abort();
      messageController.current?.abort();
    },
    [],
  );

  const quickReplies = useMemo<readonly QuickReply[]>(
    () => copy.starterPrompts[mode].map((value) => ({ label: value, value })),
    [copy, mode],
  );

  function focusAttachment() {
    window.requestAnimationFrame(() => {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  async function handleSend(content: string, displayValue = content) {
    if (!sessionId || phase === "starting" || phase === "streaming") return;
    messageController.current?.abort();
    const controller = new AbortController();
    messageController.current = controller;
    const streamId = `stream-${crypto.randomUUID()}`;
    let streamedText = "";
    let streamMessageAdded = false;
    let terminalError = false;

    setLastMessage(content);
    setMessages((current) => [...current, localMessage("user", displayValue)]);
    setAttachment(null);
    setTool(null);
    setError(null);
    setPhase("streaming");

    try {
      await streamChatMessage(
        sessionId,
        { content },
        (event) => {
          if (event.type === "token") {
            streamedText += event.data.text;
            setMessages((current) => {
              const streamMessage: ChatMessage = {
                id: streamId,
                role: "assistant",
                content: streamedText,
                createdAt: new Date().toISOString(),
              };
              if (!streamMessageAdded) {
                streamMessageAdded = true;
                return [...current, streamMessage];
              }
              return current.map((message) =>
                message.id === streamId ? streamMessage : message,
              );
            });
            return;
          }
          if (event.type === "tool_start") {
            setTool(event.data.name);
            return;
          }
          if (event.type === "attachment") {
            setAttachment(event.data);
            focusAttachment();
            return;
          }
          if (event.type === "done") {
            setMessages((current) => {
              if (streamMessageAdded) {
                return current.map((message) =>
                  message.id === streamId ? event.data.message : message,
                );
              }
              return [...current, event.data.message];
            });
            const finalAttachment = event.data.message.attachments?.at(-1);
            if (finalAttachment) setAttachment(finalAttachment);
            setPhase("ready");
            setTool(null);
            return;
          }
          terminalError = true;
          setError(event.data.message || copy.assistant.error);
          setPhase("error");
          setTool(null);
        },
        controller.signal,
      );
    } catch (streamError) {
      if (streamError instanceof DOMException && streamError.name === "AbortError") return;
      terminalError = true;
      setError(streamError instanceof ChatApiError ? streamError.message : copy.assistant.error);
      setPhase("error");
      setTool(null);
    } finally {
      if (!terminalError && messageController.current === controller) {
        setPhase((current) => (current === "streaming" ? "ready" : current));
      }
      if (messageController.current === controller) messageController.current = null;
    }
  }

  function restart() {
    messageController.current?.abort();
    setRestartKey((current) => current + 1);
  }

  const pending = phase === "starting" || phase === "streaming";
  const summary =
    attachment?.type === "match"
      ? attachment.match.summary
      : attachment?.type === "bundle"
        ? attachment.bundle.summary
        : "";

  return (
    <>
      <a className={styles.skipLink} href="#chat-conversation">
        {copy.skip}
      </a>
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
              <strong>{copy.modes[mode].label}</strong>
            </div>
            <button disabled={pending} onClick={restart} type="button">
              {copy.actions.restart}
            </button>
          </div>
          <ChatThread copy={copy} messages={messages} pending={pending} />
          <ChatComposer
            copy={copy}
            disabled={pending || !sessionId}
            focusKey={`${sessionId ?? "starting"}-${phase}`}
            onSend={handleSend}
            placeholder={copy.composer.placeholder}
            quickReplies={quickReplies}
          />
        </motion.section>

        <ChatSessionPanel
          copy={copy}
          mode={mode}
          onModeChange={setMode}
          phase={phase}
          sessionId={sessionId}
          tool={tool}
        />
      </main>

      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {pending ? copy.assistant.searching : error ?? summary}
      </div>

      {error && (
        <section className={styles.error} role="alert">
          <p>{error}</p>
          <div>
            {lastMessage && sessionId && (
              <button onClick={() => void handleSend(lastMessage)} type="button">
                {copy.actions.retry}
              </button>
            )}
            <button onClick={restart} type="button">
              {copy.actions.restart}
            </button>
          </div>
        </section>
      )}

      {attachment && (
        <ChatAttachmentResults
          attachment={attachment}
          copy={copy}
          locale={locale}
          sectionRef={resultRef}
        />
      )}

      <footer className={styles.footer}>
        <strong>{copy.brand}</strong>
        <span>{copy.hero.badge}</span>
      </footer>
    </>
  );
}

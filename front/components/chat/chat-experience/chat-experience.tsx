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
import {
  dedupeChatMessages,
  emptyChatState,
  loadChatState,
  saveChatState,
  type StoredChatConversation,
  type StoredChatState,
} from "@/lib/chat/chat-storage";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CHAT_MESSAGES } from "@/lib/i18n/messages/chat";
import { ChatAttachmentResults } from "../chat-attachment-results/chat-attachment-results";
import { ChatComposer } from "../chat-composer/chat-composer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import siteStyles from "@/components/site/site.module.css";
import { ChatHero } from "../chat-hero/chat-hero";
import { ChatModeSwitcher } from "../chat-mode-switcher/chat-mode-switcher";
import type { ChatConnectionPhase } from "../chat-session-panel/chat-session-panel";
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

function latestAttachment(messages: readonly ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const attachment = messages[index].attachments?.at(-1);
    if (attachment) return attachment;
  }

  return null;
}

function replaceStreamingMessage(
  messages: readonly ChatMessage[],
  streamId: string,
  finalMessage: ChatMessage,
) {
  const streamIndex = messages.findIndex((message) => message.id === streamId);
  if (streamIndex >= 0) {
    return messages.flatMap((message, index) => {
      if (index === streamIndex) return [finalMessage];
      return message.id === finalMessage.id ? [] : [message];
    });
  }

  const finalIndex = messages.findIndex(
    (message) => message.id === finalMessage.id,
  );
  if (finalIndex >= 0) {
    return messages.map((message, index) =>
      index === finalIndex ? finalMessage : message,
    );
  }

  return [...messages, finalMessage];
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
  const [storageReady, setStorageReady] = useState(false);
  const activeModeRef = useRef<ChatMode>("search");
  const conversationsRef = useRef<StoredChatState["conversations"]>({});
  const didRestoreStorage = useRef(false);
  const clearedModesRef = useRef(new Set<ChatMode>());
  const sessionController = useRef<AbortController | null>(null);
  const messageController = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (didRestoreStorage.current) return;
    didRestoreStorage.current = true;

    const stored = loadChatState() ?? emptyChatState();
    const restoredMode = stored.activeMode;
    const conversation = stored.conversations[restoredMode];
    const restoredMessages = conversation
      ? dedupeChatMessages(conversation.messages)
      : [];

    conversationsRef.current = stored.conversations;
    activeModeRef.current = restoredMode;
    setMode(restoredMode);
    setSessionId(conversation?.sessionId ?? null);
    setMessages(restoredMessages);
    setAttachment(
      conversation?.attachment ?? latestAttachment(restoredMessages),
    );
    setLastMessage(
      restoredMessages.findLast((message) => message.role === "user")
        ?.content ?? null,
    );
    setPhase(conversation ? "ready" : "starting");
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || sessionId) return;

    sessionController.current?.abort();
    messageController.current?.abort();
    const controller = new AbortController();
    sessionController.current = controller;

    void (async () => {
      // Let React Strict Mode run its first cleanup before opening a session.
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setPhase("starting");
      setMessages([]);
      setAttachment(null);
      setTool(null);
      setError(null);

      try {
        const session = await createChatSession({ mode, locale }, controller.signal);
        if (controller.signal.aborted) return;
        clearedModesRef.current.delete(mode);
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
  }, [copy.assistant.error, locale, mode, restartKey, sessionId, storageReady]);

  useEffect(() => {
    if (!storageReady || !sessionId) return;

    const persistConversation = () => {
      if (clearedModesRef.current.has(mode)) return;

      const conversation: StoredChatConversation = {
        attachment,
        messages: dedupeChatMessages(messages),
        sessionId,
        updatedAt: Date.now(),
      };
      conversationsRef.current = {
        ...conversationsRef.current,
        [mode]: conversation,
      };
      saveChatState({
        ...emptyChatState(activeModeRef.current),
        conversations: conversationsRef.current,
      });
    };

    const timer = window.setTimeout(persistConversation, 120);
    return () => {
      window.clearTimeout(timer);
      persistConversation();
    };
  }, [attachment, messages, mode, sessionId, storageReady]);

  useEffect(
    () => () => {
      sessionController.current?.abort();
      messageController.current?.abort();
    },
    [],
  );

  const quickReplies = useMemo<readonly QuickReply[]>(
    () =>
      copy.starterPrompts[mode].map((value, index) => ({
        label: copy.starterLabels[mode][index] ?? value,
        value,
      })),
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
    const streamCreatedAt = new Date().toISOString();
    const userMessage = localMessage("user", displayValue);
    let streamedText = "";
    let terminalError = false;
    let streamFinished = false;

    setLastMessage(content);
    setMessages((current) => dedupeChatMessages([...current, userMessage]));
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
            if (streamFinished) return;
            streamedText += event.data.text;
            const streamMessage: ChatMessage = {
              id: streamId,
              role: "assistant",
              content: streamedText,
              createdAt: streamCreatedAt,
            };
            setMessages((current) => {
              // Pure updater: React StrictMode may call it twice in development.
              if (!current.some((message) => message.id === streamId)) {
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
            if (streamFinished) return;
            streamFinished = true;
            setMessages((current) =>
              replaceStreamingMessage(current, streamId, event.data.message),
            );
            const finalAttachment = event.data.message.attachments?.at(-1);
            if (finalAttachment) setAttachment(finalAttachment);
            setPhase("ready");
            setTool(null);
            return;
          }
          streamFinished = true;
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

  function persistModeState(activeMode: ChatMode) {
    saveChatState({
      ...emptyChatState(activeMode),
      conversations: conversationsRef.current,
    });
  }

  function cacheCurrentConversation() {
    if (!sessionId || clearedModesRef.current.has(mode)) return;

    conversationsRef.current = {
      ...conversationsRef.current,
      [mode]: {
        attachment,
        messages: dedupeChatMessages(messages),
        sessionId,
        updatedAt: Date.now(),
      },
    };
  }

  function changeMode(nextMode: ChatMode) {
    if (nextMode === mode) return;

    sessionController.current?.abort();
    messageController.current?.abort();
    cacheCurrentConversation();

    const conversation = conversationsRef.current[nextMode];
    const restoredMessages = conversation
      ? dedupeChatMessages(conversation.messages)
      : [];

    activeModeRef.current = nextMode;
    persistModeState(nextMode);
    setMode(nextMode);
    setSessionId(conversation?.sessionId ?? null);
    setMessages(restoredMessages);
    setAttachment(
      conversation?.attachment ?? latestAttachment(restoredMessages),
    );
    setLastMessage(
      restoredMessages.findLast((message) => message.role === "user")
        ?.content ?? null,
    );
    setTool(null);
    setError(null);
    setPhase(conversation ? "ready" : "starting");
  }

  function restart() {
    sessionController.current?.abort();
    messageController.current?.abort();
    clearedModesRef.current.add(mode);
    const nextConversations = { ...conversationsRef.current };
    delete nextConversations[mode];
    conversationsRef.current = nextConversations;
    persistModeState(mode);
    setSessionId(null);
    setMessages([]);
    setAttachment(null);
    setLastMessage(null);
    setTool(null);
    setError(null);
    setPhase("starting");
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
    <div className={siteStyles.shell}>
      <SiteHeader contentId="chat-conversation" />
      <ChatHero copy={copy} />

      <main className={styles.main} id="chat-conversation">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          aria-label={copy.assistant.name}
          className={styles.conversation}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.conversationHeader}>
            <ChatModeSwitcher
              copy={copy}
              disabled={pending}
              mode={mode}
              onChange={changeMode}
            />
            <div className={styles.conversationMeta}>
              <p className={styles.status} data-phase={phase}>
                <span aria-hidden="true" />
                {tool ? copy.tools[tool] : copy.session.status[phase]}
              </p>
              <button disabled={pending} onClick={restart} type="button">
                <svg aria-hidden="true" viewBox="0 0 20 20">
                  <path d="M4 10a6 6 0 1 0 1.8-4.3M4 4v3.5h3.5" />
                </svg>
                {copy.actions.restart}
              </button>
            </div>
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
      </main>

      <SiteFooter />
    </div>
  );
}

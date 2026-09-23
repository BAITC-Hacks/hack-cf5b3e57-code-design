"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { QuickReplies, type QuickReply } from "../quick-replies/quick-replies";
import styles from "./chat-composer.module.css";

interface ChatComposerProps {
  copy: ChatMessages;
  disabled: boolean;
  focusKey: string;
  onSend: (value: string, displayValue?: string) => void;
  placeholder: string;
  quickReplies: readonly QuickReply[];
}

export function ChatComposer({
  copy,
  disabled,
  focusKey,
  onSend,
  placeholder,
  quickReplies,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus({ preventScroll: true });
  }, [disabled, focusKey]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleQuickReply(item: QuickReply) {
    if (disabled) return;
    onSend(item.value, item.label);
    setValue("");
  }

  return (
    <div className={styles.composer}>
      <QuickReplies disabled={disabled} items={quickReplies} onSelect={handleQuickReply} />

      <form onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="chat-answer">
          {copy.composer.label}
        </label>
        <input
          autoComplete="off"
          disabled={disabled}
          id="chat-answer"
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          ref={inputRef}
          value={value}
        />
        <button disabled={disabled || value.trim().length === 0} type="submit">
          <span>{disabled ? copy.composer.sending : copy.composer.send}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="m4 10 11-6-3.1 12-2.3-4.1L4 10Z" />
          </svg>
        </button>
      </form>
      <p>{copy.composer.hint}</p>
    </div>
  );
}

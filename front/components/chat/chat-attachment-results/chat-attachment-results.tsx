"use client";

import type { Ref } from "react";

import type { ChatAttachment, Locale } from "../../../../shared/contract";
import type { ChatMessages } from "@/lib/i18n/messages/chat";
import { ChatBundleResults } from "../chat-bundle-results/chat-bundle-results";
import { ChatResults } from "../chat-results/chat-results";

interface ChatAttachmentResultsProps {
  attachment: ChatAttachment;
  copy: ChatMessages;
  locale: Locale;
  sectionRef: Ref<HTMLElement>;
}

export function ChatAttachmentResults({
  attachment,
  copy,
  locale,
  sectionRef,
}: ChatAttachmentResultsProps) {
  if (attachment.type === "bundle") {
    return (
      <ChatBundleResults
        bundle={attachment.bundle}
        copy={copy}
        locale={locale}
        sectionRef={sectionRef}
      />
    );
  }

  return (
    <ChatResults
      copy={copy}
      locale={locale}
      result={attachment.match}
      sectionRef={sectionRef}
    />
  );
}

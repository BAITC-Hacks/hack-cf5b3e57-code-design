import type { Metadata } from "next";

import { ChatExperience } from "@/components/chat/chat-experience/chat-experience";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { CHAT_MESSAGES } from "@/lib/i18n/messages/chat";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = CHAT_MESSAGES[locale];

  return {
    title: { absolute: copy.pageTitle },
    description: copy.pageDescription,
  };
}

export default function ChatPage() {
  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <ChatExperience />
    </div>
  );
}

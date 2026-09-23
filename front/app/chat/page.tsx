import type { Metadata } from "next";

import { ChatExperience } from "@/components/chat/chat-experience/chat-experience";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { CHAT_MESSAGES } from "@/lib/i18n/messages/chat";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = CHAT_MESSAGES[locale];

  return {
    title: { absolute: copy.pageTitle.replace(/^(Тройка|Troika)/, "ToiMatch") },
    description: copy.pageDescription,
  };
}

export default function ChatPage() {
  return (
    <div className="tm-chat-page">
      <ChatExperience />
    </div>
  );
}

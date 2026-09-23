import type { Metadata } from "next";

import { ChatExperience } from "@/components/chat/chat-experience/chat-experience";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = {
    ru: {
      title: "Чат-помощник",
      description:
        "Опишите мероприятие своими словами — помощник уточнит детали и подберёт подрядчиков в Алматы или Астане, от ведущего до зала, с объяснением выбора.",
    },
    kk: {
      title: "Чат-көмекші",
      description:
        "Іс-шараны өз сөзіңізбен сипаттаңыз — көмекші мәліметтерді нақтылап, Алматы немесе Астанадан жүргізушіден залға дейін мердігерлерді таңдау себебімен ұсынады.",
    },
    en: {
      title: "Chat assistant",
      description:
        "Describe your event in your own words — the assistant asks what matters and suggests contractors in Almaty or Astana, from hosts to venues, with the reasons why.",
    },
  }[locale];

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/chat" },
  };
}

export default function ChatPage() {
  return (
    <div className="tm-chat-page">
      <ChatExperience />
    </div>
  );
}

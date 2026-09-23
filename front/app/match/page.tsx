import type { Metadata } from "next";

import { MatchExperience } from "@/components/match/match-experience/match-experience";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { MATCH_MESSAGES } from "@/lib/i18n/messages/match";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = MATCH_MESSAGES[locale];

  return {
    title: { absolute: copy.pageTitle.replace(/^(Тройка|Troika)/, "ToiMatch") },
    description: copy.pageDescription,
  };
}

export default function MatchPage() {
  return (
    <main className="tm-match-page" id="main-content">
      <MatchExperience />
    </main>
  );
}

import type { Metadata } from "next";

import { MatchExperience } from "@/components/match/match-experience/match-experience";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { MATCH_MESSAGES } from "@/lib/i18n/messages/match";
import pageStyles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = MATCH_MESSAGES[locale];

  return {
    title: { absolute: copy.pageTitle },
    description: copy.pageDescription,
  };
}

export default function MatchPage() {
  return (
    <main className={pageStyles.page} id="main-content">
      <div className={pageStyles.ambient} aria-hidden="true" />
      <MatchExperience />
    </main>
  );
}

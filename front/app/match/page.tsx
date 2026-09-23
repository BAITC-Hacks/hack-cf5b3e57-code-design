import type { Metadata } from "next";

import { MatchExperience } from "@/components/match/match-experience/match-experience";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = {
    ru: {
      title: "Подобрать подрядчика",
      description:
        "Укажите, кто нужен, город, дату, событие и бюджет — ToiMatch предложит до трёх подрядчиков в Алматы или Астане и объяснит каждый выбор фактами из каталога.",
    },
    kk: {
      title: "Мердігер таңдау",
      description:
        "Кім керек екенін, қаланы, күнді, іс-шараны және бюджетті көрсетіңіз — ToiMatch Алматы немесе Астанадан үш мердігерге дейін ұсынып, әр таңдауды каталогтағы деректермен түсіндіреді.",
    },
    en: {
      title: "Find a contractor",
      description:
        "Tell us who you need, the city, date, event and budget — ToiMatch suggests up to three contractors in Almaty or Astana and backs every choice with facts from the catalog.",
    },
  }[locale];

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/match" },
  };
}

export default function MatchPage() {
  return (
    <main className="tm-match-page" id="main-content">
      <MatchExperience />
    </main>
  );
}

import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { MatchExperience } from "@/components/match/match-experience/match-experience";
import type { MatchFormState } from "@/components/match/match-form/match-form";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { CATEGORIES, CITIES, EVENT_FORMATS, LANGUAGES } from "../../../shared/contract";

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

type SearchParams = Record<string, string | string[] | undefined>;

function pickParam(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

function pickListed(params: SearchParams, key: string, allowed: readonly string[]): string | undefined {
  const value = pickParam(params, key);
  if (!value) return undefined;
  return allowed.find((item) => item.toLowerCase() === value.toLowerCase());
}

function pickPositiveNumber(params: SearchParams, key: string): string | undefined {
  const value = pickParam(params, key);
  if (!value) return undefined;
  const parsed = Number(value.replace(/\s/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? String(Math.round(parsed)) : undefined;
}

function pickDate(params: SearchParams): string | undefined {
  const value = pickParam(params, "date");
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : undefined;
}

function parseInitialForm(params: SearchParams): Partial<MatchFormState> | undefined {
  const candidate: Partial<MatchFormState> = {
    budgetKzt: pickPositiveNumber(params, "budgetKzt"),
    category: pickListed(params, "category", CATEGORIES),
    city: pickListed(params, "city", CITIES),
    date: pickDate(params),
    durationHours: pickPositiveNumber(params, "durationHours"),
    eventType: pickListed(params, "eventType", EVENT_FORMATS),
    language: pickListed(params, "language", LANGUAGES),
  };
  const entries = Object.entries(candidate).filter(([, value]) => value !== undefined);
  return entries.length > 0 ? (Object.fromEntries(entries) as Partial<MatchFormState>) : undefined;
}

export default async function MatchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const initialForm = parseInitialForm(await searchParams);

  return (
    <>
      <SiteHeader />
      <main className="tm-match-page" id="main-content">
        <MatchExperience initialForm={initialForm} />
      </main>
      <SiteFooter />
    </>
  );
}

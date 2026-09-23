import type { MatchRequest } from "../../../../shared/contract";

export const DEMO_PRESETS = [
  {
    id: "host",
    request: {
      city: "Алматы",
      date: "2026-10-16",
      eventType: "корпоратив",
      category: "Ведущий",
      budgetKzt: 1_000_000,
      locale: "ru",
    },
  },
  {
    id: "florist",
    request: {
      city: "Алматы",
      date: "2026-10-15",
      eventType: "свадьба",
      category: "Флорист",
      budgetKzt: 300_000,
      locale: "ru",
    },
  },
  {
    id: "live-band",
    request: {
      city: "Астана",
      date: "2026-11-14",
      eventType: "свадьба",
      category: "Лайв-бэнд",
      budgetKzt: 1_500_000,
      locale: "ru",
    },
  },
  {
    id: "decorator",
    request: {
      city: "Алматы",
      date: "2026-11-14",
      eventType: "той",
      category: "Декоратор",
      budgetKzt: 3_000_000,
      locale: "ru",
    },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  request: MatchRequest;
}>;

export type DemoPreset = (typeof DEMO_PRESETS)[number];

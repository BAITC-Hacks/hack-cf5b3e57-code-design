import type { MatchRequest } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { ArrowIcon, CategoryIcon } from "../icons/icons";
import type { MatchFormState } from "../match-form/match-form";
import styles from "./demo-presets.module.css";

export type DemoId = "dense" | "florist" | "missing" | "busy";

export interface DemoPreset {
  id: DemoId;
  request: Omit<MatchRequest, "locale">;
}

export const DEMO_PRESETS: readonly DemoPreset[] = [
  { id: "dense", request: { budgetKzt: 1_000_000, category: "Ведущий", city: "Алматы", date: "2026-10-16", eventType: "корпоратив" } },
  { id: "florist", request: { budgetKzt: 300_000, category: "Флорист", city: "Алматы", date: "2026-10-15", eventType: "свадьба" } },
  { id: "missing", request: { budgetKzt: 1_500_000, category: "Лайв-бэнд", city: "Астана", date: "2026-11-14", eventType: "свадьба" } },
  { id: "busy", request: { budgetKzt: 3_000_000, category: "Декоратор", city: "Алматы", date: "2026-11-14", eventType: "той" } },
] as const;

interface DemoPresetsProps {
  copy: MatchMessages;
  form?: Pick<MatchFormState, "budgetKzt" | "category" | "city" | "date" | "eventType">;
  onSelect: (preset: DemoPreset) => void;
}

function isActive(preset: DemoPreset, form: DemoPresetsProps["form"]) {
  if (!form) return false;
  const { request } = preset;
  return (
    form.category === request.category &&
    form.city === request.city &&
    form.date === request.date &&
    form.eventType === request.eventType &&
    Number(form.budgetKzt) === request.budgetKzt
  );
}

export function DemoPresets({ copy, form, onSelect }: DemoPresetsProps) {
  return (
    <div className={styles.demos}>
      <div className={styles.intro}>
        <strong>{copy.demosTitle}</strong>
        <small>{copy.demosHint}</small>
      </div>
      <div className={styles.grid}>
        {DEMO_PRESETS.map((preset) => {
          const item = copy.demos[preset.id];
          return (
            <button aria-pressed={isActive(preset, form)} key={preset.id} onClick={() => onSelect(preset)} type="button">
              <span className={styles.icon} aria-hidden="true">
                <CategoryIcon category={preset.request.category} />
              </span>
              <span className={styles.text}>
                <strong>{item.title}</strong>
                <small>{item.hint}</small>
              </span>
              <ArrowIcon className={styles.arrow} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

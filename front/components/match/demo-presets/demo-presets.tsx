import type { MatchRequest } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { ArrowIcon } from "../icons/icons";
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
  onSelect: (preset: DemoPreset) => void;
}

export function DemoPresets({ copy, onSelect }: DemoPresetsProps) {
  return (
    <div className={styles.demos}>
      <div className={styles.intro}>
        <span>{copy.demoLabel}</span>
        <div>
          <strong>{copy.demosTitle}</strong>
          <small>{copy.demosHint}</small>
        </div>
      </div>
      <div className={styles.grid}>
        {DEMO_PRESETS.map((preset, index) => {
          const item = copy.demos[preset.id];
          return (
            <button key={preset.id} onClick={() => onSelect(preset)} type="button">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.hint}</small>
              </span>
              <ArrowIcon />
            </button>
          );
        })}
      </div>
    </div>
  );
}

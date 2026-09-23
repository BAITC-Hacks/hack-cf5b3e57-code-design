"use client";

import { DEMO_PRESETS } from "../shared/manager-data";
import type { DemoPreset } from "../shared/manager-data";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./demo-presets.module.css";

export function DemoPresets({ busy, onSelect }: { busy: boolean; onSelect: (preset: DemoPreset) => void }) {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].presets;
  return (
    <section className={styles.panel}>
      <div className={styles.heading}><span>{messages.title}</span><small>{messages.hint}</small></div>
      <div className={styles.grid}>
        {DEMO_PRESETS.map((preset, index) => (
          <button type="button" key={preset.id} onClick={() => onSelect(preset)} disabled={busy}>
            <span>{index + 1}</span><strong>{messages.items[index]?.label}</strong><small>{messages.items[index]?.hint}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

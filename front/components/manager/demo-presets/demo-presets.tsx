"use client";

import { DEMO_PRESETS } from "../shared/manager-data";
import type { DemoPreset } from "../shared/manager-data";
import { formatDayMonth, formatMoney } from "../shared/format";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./demo-presets.module.css";

export function DemoPresets({ busy, onSelect }: { busy: boolean; onSelect: (preset: DemoPreset) => void }) {
  const { locale } = useLocale();
  const { presets: messages, form } = MANAGER_MESSAGES[locale];
  return (
    <section className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-presets-title">
      <PanelHeading
        titleId="manager-presets-title"
        icon={<Icon><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></Icon>}
        title={messages.title}
        description={messages.hint}
      />
      <ul className={styles.list}>
        {DEMO_PRESETS.map((preset, index) => {
          const { request } = preset;
          const details = [
            form.cities[request.city] ?? request.city,
            form.events[request.eventType] ?? request.eventType,
            formatDayMonth(request.date, locale),
            formatMoney(request.budgetKzt, locale),
          ].join(" · ");
          return (
            <li key={preset.id}>
              <button type="button" data-demo-preset={preset.id} onClick={() => onSelect(preset)} disabled={busy}>
                <span className={styles.number} aria-hidden="true">{index + 1}</span>
                <span className={styles.text}>
                  <span className={styles.title}><strong>{messages.items[index]?.label}</strong><span>{messages.items[index]?.hint}</span></span>
                  <small>{details}</small>
                </span>
                <span className={styles.arrow} aria-hidden="true"><Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon></span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className={styles.note}><Icon><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icon>{messages.description}</p>
    </section>
  );
}

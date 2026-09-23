import type { FormEvent } from "react";

import { CustomSelect } from "@/components/shared/custom-select/custom-select";
import { CITIES, EVENT_FORMATS, LANGUAGES } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CategoryPicker } from "../category-picker/category-picker";
import { DemoPresets } from "../demo-presets/demo-presets";
import type { DemoPreset } from "../demo-presets/demo-presets";
import { ArrowIcon, SparkIcon } from "../icons/icons";
import styles from "./match-form.module.css";

export interface MatchFormState {
  budgetKzt: string;
  category: string;
  city: string;
  date: string;
  durationHours: string;
  eventType: string;
  language: string;
}

interface MatchFormProps {
  copy: MatchMessages;
  form: MatchFormState;
  notice: string | null;
  onChange: <Key extends keyof MatchFormState>(key: Key, value: MatchFormState[Key]) => void;
  onDemoSelect: (preset: DemoPreset) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  sectionRef: React.Ref<HTMLElement>;
}

export function MatchForm({
  copy,
  form,
  notice,
  onChange,
  onDemoSelect,
  onSubmit,
  pending,
  sectionRef,
}: MatchFormProps) {
  return (
    <section className={styles.section} ref={sectionRef} id="match-form">
      <div className={styles.heading}>
        <div>
          <p>{copy.formKicker}</p>
          <h2>{copy.formTitle}</h2>
        </div>
        <span className={styles.stepBadge}>01</span>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <CategoryPicker
          label={copy.categoryLegend}
          labels={copy.categories}
          onChange={(category) => onChange("category", category)}
          value={form.category}
        />

        <div className={styles.fields}>
          <label className={styles.field}>
            <span>{copy.city}</span>
            <CustomSelect
              onChange={(event) => onChange("city", event.target.value)}
              options={CITIES.map((city) => ({
                value: city,
                label: copy.cities[city],
              }))}
              value={form.city}
            />
          </label>

          <label className={styles.field}>
            <span>{copy.date}</span>
            <input max="2026-12-31" min="2026-09-23" onChange={(event) => onChange("date", event.target.value)} required type="date" value={form.date} />
          </label>

          <label className={styles.field}>
            <span>{copy.event}</span>
            <CustomSelect
              onChange={(event) => onChange("eventType", event.target.value)}
              options={EVENT_FORMATS.map((eventFormat) => ({
                value: eventFormat,
                label: copy.eventFormats[eventFormat],
              }))}
              value={form.eventType}
            />
          </label>

          <label className={styles.field}>
            <span>{copy.budget}</span>
            <input inputMode="numeric" min="1" onChange={(event) => onChange("budgetKzt", event.target.value)} required step="any" type="number" value={form.budgetKzt} />
          </label>

        </div>

        <details className={styles.advanced}>
          <summary>{copy.advancedFields}</summary>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>{copy.duration}</span>
              <input inputMode="numeric" max="48" min="1" onChange={(event) => onChange("durationHours", event.target.value)} placeholder={copy.durationPlaceholder} step="1" type="number" value={form.durationHours} />
            </label>

            <label className={styles.field}>
              <span>{copy.language}</span>
              <CustomSelect
                onChange={(event) => onChange("language", event.target.value)}
                options={[
                  { value: "", label: copy.languageAny },
                  ...LANGUAGES.map((language) => ({
                    value: language,
                    label: copy.languages[language],
                  })),
                ]}
                value={form.language}
              />
            </label>
          </div>
        </details>

        <div className={styles.footer}>
          <p aria-live="polite">{notice}</p>
          <button className={styles.submit} disabled={pending} type="submit">
            <SparkIcon />
            <span>{pending ? copy.submitBusy : copy.submit}</span>
            <ArrowIcon />
          </button>
        </div>
      </form>

      <DemoPresets copy={copy} onSelect={onDemoSelect} />
    </section>
  );
}

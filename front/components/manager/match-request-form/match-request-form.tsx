"use client";

import type { FormEvent } from "react";

import { CustomSelect } from "@/components/shared/custom-select/custom-select";
import { CATEGORIES, CITIES, EVENT_FORMATS, LANGUAGES } from "../../../../shared/contract";
import type { MatchRequest } from "../../../../shared/contract";
import { Icon } from "../shared/icon";
import { PanelHeading, panelStyles } from "../shared/panel-heading";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import styles from "./match-request-form.module.css";

export function MatchRequestForm({ request, busy, onChange, onRun, onCancel }: {
  request: MatchRequest;
  busy: boolean;
  onChange: (request: MatchRequest) => void;
  onRun: () => void;
  onCancel: () => void;
}) {
  const { locale, setLocale } = useLocale();
  const messages = MANAGER_MESSAGES[locale].form;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRun();
  }

  return (
    <section className={`${panelStyles.panel} ${styles.panel}`} aria-labelledby="manager-request-title">
      <PanelHeading
        titleId="manager-request-title"
        icon={<Icon><path d="M4 6h16M4 12h10M4 18h7" /><path d="m17 14 3 3-3 3" /></Icon>}
        title={messages.title}
        description={messages.description}
      />
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.wide}><span>{messages.category}</span><CustomSelect value={request.category} onChange={(event) => onChange({ ...request, category: event.target.value })} options={CATEGORIES.map((value) => ({ value, label: messages.categories[value] ?? value }))} /></label>
        <div className={styles.grid}>
          <label><span>{messages.city}</span><CustomSelect value={request.city} onChange={(event) => onChange({ ...request, city: event.target.value })} options={CITIES.map((value) => ({ value, label: messages.cities[value] ?? value }))} /></label>
          <label><span>{messages.date}</span><input type="date" value={request.date} min="2026-09-23" max="2026-12-31" required onChange={(event) => onChange({ ...request, date: event.target.value })} /></label>
        </div>
        <div className={styles.grid}>
          <label><span>{messages.event}</span><CustomSelect value={request.eventType} onChange={(event) => onChange({ ...request, eventType: event.target.value })} options={EVENT_FORMATS.map((value) => ({ value, label: messages.events[value] ?? value }))} /></label>
          <label><span>{messages.budget}</span><input type="number" inputMode="numeric" value={request.budgetKzt || ""} min={1} step="any" required onChange={(event) => onChange({ ...request, budgetKzt: Number(event.target.value) })} /></label>
        </div>
        <details className={styles.optional}>
          <summary>{messages.optional}<Icon><path d="m6 9 6 6 6-6" /></Icon></summary>
          <div className={styles.grid}>
            <label><span>{messages.duration}</span><input type="number" inputMode="numeric" value={request.durationHours ?? ""} min={1} max={24} placeholder={messages.optionalPlaceholder} onChange={(event) => onChange({ ...request, durationHours: event.target.value ? Number(event.target.value) : undefined })} /></label>
            <label><span>{messages.contractorLanguage}</span><CustomSelect value={request.language ?? ""} onChange={(event) => onChange({ ...request, language: event.target.value || undefined })} options={[{ value: "", label: messages.optionalPlaceholder }, ...LANGUAGES.map((value) => ({ value, label: messages.languages[value] ?? value }))]} /></label>
          </div>
          <label className={styles.wide}><span>{messages.explanationLanguage}</span><CustomSelect value={request.locale ?? locale} onChange={(event) => { const nextLocale = event.target.value as NonNullable<MatchRequest["locale"]>; setLocale(nextLocale); onChange({ ...request, locale: nextLocale }); }} options={[{ value: "ru", label: messages.russian }, { value: "kk", label: messages.kazakh }, { value: "en", label: messages.english }]} /></label>
        </details>
        <div className={styles.actions}>
          <button className={styles.run} type="submit" disabled={busy} aria-busy={busy}>
            <span>{messages.run}</span>
            {busy ? <span className={styles.spinner} aria-hidden="true" /> : <Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>}
          </button>
          {busy && <button className={styles.cancel} type="button" onClick={onCancel}>{messages.cancel}</button>}
        </div>
      </form>
    </section>
  );
}

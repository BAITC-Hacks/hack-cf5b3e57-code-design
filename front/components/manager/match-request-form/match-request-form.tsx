"use client";

import type { FormEvent } from "react";

import { CATEGORIES, CITIES, EVENT_FORMATS, LANGUAGES } from "../../../../shared/contract";
import type { MatchRequest } from "../../../../shared/contract";
import { Icon } from "../shared/icon";
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
    <section className={styles.panel}>
      <div className={styles.heading}>
        <span className={styles.icon}><Icon><path d="M4 6h16M4 12h10M4 18h7" /><path d="m17 14 3 3-3 3" /></Icon></span>
        <div><span className={styles.index}>{messages.section}</span><h2>{messages.title}</h2></div>
      </div>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.wide}><span>{messages.category}</span><select value={request.category} onChange={(event) => onChange({ ...request, category: event.target.value })}>{CATEGORIES.map((value) => <option key={value} value={value}>{messages.categories[value] ?? value}</option>)}</select></label>
        <div className={styles.grid}>
          <label><span>{messages.city}</span><select value={request.city} onChange={(event) => onChange({ ...request, city: event.target.value })}>{CITIES.map((value) => <option key={value} value={value}>{messages.cities[value] ?? value}</option>)}</select></label>
          <label><span>{messages.date}</span><input type="date" value={request.date} min="2026-09-23" max="2026-12-31" required onChange={(event) => onChange({ ...request, date: event.target.value })} /></label>
        </div>
        <div className={styles.grid}>
          <label><span>{messages.event}</span><select value={request.eventType} onChange={(event) => onChange({ ...request, eventType: event.target.value })}>{EVENT_FORMATS.map((value) => <option key={value} value={value}>{messages.events[value] ?? value}</option>)}</select></label>
          <label><span>{messages.budget}</span><input type="number" value={request.budgetKzt || ""} min={1} step="any" required onChange={(event) => onChange({ ...request, budgetKzt: Number(event.target.value) })} /></label>
        </div>
        <details className={styles.optional}>
          <summary>{messages.optional}</summary>
          <div className={styles.grid}>
            <label><span>{messages.duration}</span><input type="number" value={request.durationHours ?? ""} min={1} max={24} placeholder={messages.optionalPlaceholder} onChange={(event) => onChange({ ...request, durationHours: event.target.value ? Number(event.target.value) : undefined })} /></label>
            <label><span>{messages.contractorLanguage}</span><select value={request.language ?? ""} onChange={(event) => onChange({ ...request, language: event.target.value || undefined })}><option value="">{messages.optionalPlaceholder}</option>{LANGUAGES.map((value) => <option key={value} value={value}>{messages.languages[value] ?? value}</option>)}</select></label>
          </div>
          <label className={styles.wide}><span>{messages.explanationLanguage}</span><select value={request.locale ?? locale} onChange={(event) => { const nextLocale = event.target.value as NonNullable<MatchRequest["locale"]>; setLocale(nextLocale); onChange({ ...request, locale: nextLocale }); }}><option value="ru">{messages.russian}</option><option value="kk">{messages.kazakh}</option><option value="en">{messages.english}</option></select></label>
        </details>
        <div className={styles.actions}>
          <button className={styles.run} type="submit" disabled={busy}><span>{messages.run}</span><Icon><path d="m8 5 8 7-8 7V5Z" /></Icon></button>
          {busy && <button className={styles.cancel} type="button" onClick={onCancel}>{messages.cancel}</button>}
        </div>
      </form>
    </section>
  );
}

"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { Locale, MatchRequest, MatchResponse } from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MATCH_MESSAGES } from "@/lib/i18n/messages/match";
import { MatchApiError, requestMatch } from "@/lib/match-api";
import { CompareDates } from "../compare-dates/compare-dates";
import { DEMO_PRESETS } from "../demo-presets/demo-presets";
import type { DemoPreset } from "../demo-presets/demo-presets";
import { MatchForm } from "../match-form/match-form";
import type { MatchFormState } from "../match-form/match-form";
import { MatchHero } from "../match-hero/match-hero";
import { MatchResults } from "../match-results/match-results";
import { MatchStatus } from "../match-status/match-status";
import { Mascot } from "../mascot/mascot";
import styles from "./match-experience.module.css";

const INITIAL_FORM = toFormState(DEMO_PRESETS[0].request);

function toFormState(request: Omit<MatchRequest, "locale">): MatchFormState {
  return {
    budgetKzt: String(request.budgetKzt),
    category: request.category,
    city: request.city,
    date: request.date,
    durationHours: request.durationHours ? String(request.durationHours) : "",
    eventType: request.eventType,
    language: request.language ?? "",
  };
}

function toMatchRequest(form: MatchFormState, locale: Locale): MatchRequest {
  const duration = Number(form.durationHours);

  return {
    budgetKzt: Number(form.budgetKzt),
    category: form.category,
    city: form.city,
    date: form.date,
    eventType: form.eventType,
    locale,
    ...(form.durationHours && Number.isFinite(duration) ? { durationHours: duration } : {}),
    ...(form.language ? { language: form.language } : {}),
  };
}

export function MatchExperience() {
  const { locale } = useLocale();
  const copy = MATCH_MESSAGES[locale];
  const [form, setForm] = useState<MatchFormState>(INITIAL_FORM);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  function setField<Key extends keyof MatchFormState>(key: Key, value: MatchFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyDemo(preset: DemoPreset) {
    setForm(toFormState(preset.request));
    setNotice(copy.demoApplied);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }

  async function submitRequest(request: MatchRequest) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setResult(null);
    setError(null);
    setNotice(null);
    setLoadingStep(0);

    const progressTimer = window.setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, copy.loadingSteps.length - 1));
    }, 900);

    try {
      const response = await requestMatch(request, controller.signal);
      setResult(response);
      window.requestAnimationFrame(() => {
        resultRef.current?.focus({ preventScroll: true });
        resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof MatchApiError ? requestError.message : copy.errors.generic);
    } finally {
      window.clearInterval(progressTimer);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setPending(false);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitRequest(toMatchRequest(form, locale));
  }

  return (
    <div className={styles.root}>
      <a className={styles.skipLink} href="#match-form">{copy.skip}</a>

      <div className={styles.shell}>
        <MatchHero copy={copy} />
        <Mascot pose="hello" speech={copy.mascotHello} name={copy.mascotName} />
        <MatchForm
          copy={copy}
          form={form}
          notice={notice}
          onChange={setField}
          onDemoSelect={applyDemo}
          onSubmit={handleSubmit}
          pending={pending}
          sectionRef={formRef}
        />

        <div className={styles.liveRegion} aria-live="polite" aria-atomic="true">
          {pending ? copy.loadingSteps[loadingStep] : error ?? result?.summary ?? ""}
        </div>

        {pending && <Mascot pose="thinking" speech={copy.loadingSteps[loadingStep]} name={copy.mascotName} />}

        <MatchStatus
          copy={copy}
          error={error}
          loadingStep={loadingStep}
          onRetry={() => void submitRequest(toMatchRequest(form, locale))}
          pending={pending}
        />

        {!pending && result && (
          <MatchResults copy={copy} locale={locale} result={result} sectionRef={resultRef} />
        )}

        <CompareDates copy={copy} locale={locale} />

        <section className={styles.how} aria-labelledby="match-how-title">
          <h2 id="match-how-title">{copy.howTitle}</h2>
          <ol>
            {copy.howSteps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}


"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  FunnelStep,
  MatchCard,
  MatchRequest,
  MatchResponse,
  SseEventMap,
  SseEventType,
} from "../../../../shared/contract";
import { useLocale } from "@/lib/i18n/locale-provider";
import { MANAGER_MESSAGES } from "@/lib/i18n/messages/manager";
import { collectMatchResult, openMatchStream } from "@/lib/manager-stream";
import { ComparisonPanel } from "../comparison-panel";
import { CriteriaPanel } from "../criteria-panel";
import { CriticPanel } from "../critic-panel";
import { DemoPresets } from "../demo-presets";
import { FunnelView } from "../funnel-view";
import { JsonPanel } from "../json-panel";
import { ManagerHero } from "../manager-hero";
import { ManagerResults } from "../manager-results";
import { ManagerShell } from "../manager-shell";
import { MatchRequestForm } from "../match-request-form";
import { PipelineTimeline } from "../pipeline-timeline";
import { DEMO_PRESETS } from "../shared/manager-data";
import type { DemoPreset } from "../shared/manager-data";
import type { DateComparison, RunStatus, TimelineItem } from "../shared/manager-types";
import styles from "./manager-workspace.module.css";

/** "2026-10-16" + 7 → "2026-10-23" (UTC, no timezone drift). */
function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

export function ManagerWorkspace() {
  const { locale } = useLocale();
  const messages = MANAGER_MESSAGES[locale];
  const [request, setRequest] = useState<MatchRequest>({ ...DEMO_PRESETS[0].request, locale });
  const [status, setStatus] = useState<RunStatus>("idle");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [rankedIds, setRankedIds] = useState<string[]>([]);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [critic, setCritic] = useState<SseEventMap["critic"] | null>(null);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState<DateComparison | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  // Date B follows the form date (+7 days) until the manager picks it explicitly.
  const [customCompareDate, setCustomCompareDate] = useState<string | null>(null);
  const [comparedDates, setComparedDates] = useState<[string, string] | null>(null);
  const streamCloseRef = useRef<null | (() => void)>(null);
  const compareCloseRef = useRef<null | (() => void)>(null);
  const generationRef = useRef(0);
  const eventIdRef = useRef(0);
  const timelineRef = useRef<HTMLElement>(null);

  const stopConnections = useCallback(() => {
    streamCloseRef.current?.();
    compareCloseRef.current?.();
    streamCloseRef.current = null;
    compareCloseRef.current = null;
  }, []);

  useEffect(() => () => {
    generationRef.current += 1;
    stopConnections();
  }, [stopConnections]);

  const appendTimeline = useCallback((type: SseEventType, title: string, detail: string) => {
    eventIdRef.current += 1;
    const id = eventIdRef.current;
    const timeLocale = locale === "kk" ? "kk-KZ" : locale === "en" ? "en-US" : "ru-RU";
    const time = new Intl.DateTimeFormat(timeLocale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date());
    setTimeline((items) => [...items, { id, type, title, detail, time }]);
  }, [locale]);

  const failRun = useCallback((message: string) => {
    setStatus("error");
    setError(message);
    streamCloseRef.current = null;
  }, []);

  const runMatch = useCallback((nextRequest: MatchRequest) => {
    generationRef.current += 1;
    const generation = generationRef.current;
    stopConnections();
    const localizedRequest = { ...nextRequest, locale };
    setRequest(localizedRequest);
    setStatus("connecting"); setTimeline([]); setCriteria([]); setFunnel([]); setRankedIds([]); setCards([]); setCritic(null); setResult(null); setError(null);
    setComparison(null); setComparisonError(null); setIsComparing(false); eventIdRef.current = 0;
    const current = () => generationRef.current === generation;
    streamCloseRef.current = openMatchStream(localizedRequest, {
      open: () => { if (current()) setStatus("running"); },
      criteria: (payload) => { if (!current()) return; setCriteria(payload.criteria); appendTimeline("criteria", messages.pipeline.criteriaTitle, messages.pipeline.criteriaDetail(payload.criteria.length)); },
      filter_step: (payload) => { if (!current()) return; setFunnel((steps) => [...steps, payload]); appendTimeline("filter_step", messages.steps[payload.step], messages.pipeline.filterDetail(payload.before, payload.after, payload.removedReason)); },
      ranked: (payload) => { if (!current()) return; setRankedIds(payload.ids); appendTimeline("ranked", messages.pipeline.rankedTitle, payload.ids.length ? messages.pipeline.rankedOrder(payload.ids) : messages.pipeline.rankedEmpty); },
      card: (payload) => { if (!current()) return; setCards((items) => [...items, payload]); appendTimeline("card", messages.pipeline.cardTitle(payload.anonName), messages.pipeline.cardDetail(payload.factsUsed.length)); },
      critic: (payload) => { if (!current()) return; setCritic(payload); appendTimeline("critic", payload.ok ? messages.pipeline.criticOk : messages.pipeline.criticProblems, payload.ok ? messages.pipeline.criticOkDetail : messages.pipeline.criticProblemsDetail(payload.problems.length)); },
      done: (payload) => { if (!current()) return; setResult(payload); setCriteria(payload.criteria); setFunnel(payload.funnel); setCards(payload.cards); setStatus("done"); streamCloseRef.current = null; appendTimeline("done", messages.pipeline.doneTitle, messages.pipeline.doneDetail(messages.cards.outcomes[payload.outcome].label, payload.cards.length)); },
      error: () => { if (current()) failRun(messages.errors.connection); },
      connectionError: () => { if (current()) failRun(messages.errors.connection); },
      parseError: () => { if (current()) failRun(messages.errors.parse); },
    });
  }, [appendTimeline, failRun, locale, messages, stopConnections]);

  // The live pipeline renders below the request form — bring it into view when a run starts.
  function revealTimeline() {
    const node = timelineRef.current;
    if (typeof window === "undefined" || !node) return;
    const top = node.getBoundingClientRect().top;
    if (top >= 80 && top < window.innerHeight * 0.6) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Leave room for the sticky header.
    window.scrollTo({ top: Math.max(0, top + window.scrollY - 96), behavior: reduced ? "auto" : "smooth" });
  }

  function startRun(nextRequest: MatchRequest) {
    runMatch(nextRequest);
    revealTimeline();
  }

  function selectPreset(preset: DemoPreset) {
    startRun({ ...preset.request, locale });
  }

  function cancelRun() {
    generationRef.current += 1;
    stopConnections();
    setIsComparing(false);
    setStatus("cancelled");
    setError(null);
  }

  async function compareDates() {
    generationRef.current += 1;
    const generation = generationRef.current;
    stopConnections();
    setStatus((current) => current === "running" || current === "connecting" ? "cancelled" : current);
    setIsComparing(true); setComparison(null); setComparisonError(null);
    const dates: [string, string] = [request.date, compareDate];
    setComparedDates(dates);
    const first = collectMatchResult({ ...request, date: dates[0], locale });
    const second = collectMatchResult({ ...request, date: dates[1], locale });
    compareCloseRef.current = () => { first.cancel(); second.cancel(); };
    try {
      const [firstResult, secondResult] = await Promise.all([first.result, second.result]);
      if (generationRef.current === generation) setComparison({ first: firstResult, second: secondResult });
    } catch (caught) {
      if (generationRef.current === generation && (!(caught instanceof Error) || caught.name !== "AbortError")) setComparisonError(messages.comparison.failed);
    } finally {
      if (generationRef.current === generation) { setIsComparing(false); compareCloseRef.current = null; }
    }
  }

  const compareDate = customCompareDate ?? addDays(request.date, 7);
  const streaming = status === "connecting" || status === "running";
  const busy = streaming || isComparing;
  const localizedRequest: MatchRequest = { ...request, locale };
  return (
    <ManagerShell>
      <ManagerHero status={status} />
      <div className={styles.request}>
        <MatchRequestForm request={localizedRequest} busy={busy} onChange={setRequest} onRun={() => startRun(localizedRequest)} onCancel={cancelRun} />
        <DemoPresets busy={busy} onSelect={selectPreset} />
      </div>
      <div className={styles.live}>
        <PipelineTimeline ref={timelineRef} timeline={timeline} streaming={streaming} error={error} onRetry={() => runMatch(localizedRequest)} />
        <div className={styles.side}>
          <FunnelView steps={funnel} pending={streaming} />
          <CriteriaPanel criteria={criteria} rankedIds={rankedIds} cards={cards} finished={status === "done"} />
          <CriticPanel critic={critic} cards={cards} finished={status === "done"} />
        </div>
      </div>
      <ManagerResults cards={cards} result={result} />
      <ComparisonPanel comparedDates={comparedDates} comparing={isComparing} comparison={comparison} error={comparisonError} firstDate={request.date} onCompare={compareDates} onSecondDateChange={setCustomCompareDate} secondDate={compareDate} />
      <JsonPanel result={result} />
    </ManagerShell>
  );
}

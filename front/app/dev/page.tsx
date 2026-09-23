'use client';

import { useEffect, useState } from 'react';
import type {
  ContractorListResponse,
  MatchRequest,
  MatchResponse,
} from '@shared/contract';
import {
  CATEGORIES,
  CITIES,
  EVENT_FORMATS,
  LANGUAGES,
} from '@shared/contract';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
      <h2 className="font-semibold text-lg">{title}</h2>
      {children}
    </section>
  );
}

function Pre({ data }: { data: unknown }) {
  return (
    <pre className="text-xs bg-zinc-100 dark:bg-zinc-900 rounded p-3 overflow-auto max-h-96 whitespace-pre-wrap break-all">
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

function HealthPanel() {
  const [data, setData] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const res = await fetch(`${API}/api/v1/health`);
      setData(await res.json());
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Section title="Health">
      <button
        onClick={load}
        className="self-start rounded bg-zinc-900 text-white text-sm px-3 py-1.5 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Refresh
      </button>
      {err ? <div className="text-red-500 text-sm">{err}</div> : <Pre data={data} />}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Каталог
// ---------------------------------------------------------------------------

function CatalogPanel() {
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [data, setData] = useState<ContractorListResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const params = new URLSearchParams({ limit: '5' });
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      const res = await fetch(`${API}/api/v1/contractors?${params}`);
      const json = (await res.json()) as ContractorListResponse;
      setData(json);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <Section title="Каталог">
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col text-xs">
          Город
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border rounded px-2 py-1 bg-transparent"
          >
            <option value="">все</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          Категория
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-2 py-1 bg-transparent"
          >
            <option value="">все</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={load}
          className="rounded bg-zinc-900 text-white text-sm px-3 py-1.5 dark:bg-zinc-100 dark:text-zinc-900"
        >
          GET /contractors
        </button>
      </div>
      {err && <div className="text-red-500 text-sm">{err}</div>}
      {data && (
        <div className="text-sm">
          <div className="mb-2">
            total: <b>{data.total}</b>, показано: <b>{data.items.length}</b>
          </div>
          <Pre data={data.items} />
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

function MatchPanel() {
  const [req, setReq] = useState<MatchRequest>({
    city: 'Алматы',
    date: '2026-10-06',
    eventType: 'корпоратив',
    category: 'Ведущий',
    budgetKzt: 1000000,
  });
  const [data, setData] = useState<MatchResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/match`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));
      setData(json as MatchResponse);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const patch = <K extends keyof MatchRequest>(k: K, v: MatchRequest[K]) =>
    setReq((r) => ({ ...r, [k]: v }));

  return (
    <Section title="Match (умный подбор)">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <label className="flex flex-col">
          Город
          <select
            value={req.city}
            onChange={(e) => patch('city', e.target.value)}
            className="border rounded px-2 py-1 bg-transparent"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Дата
          <input
            type="date"
            value={req.date}
            onChange={(e) => patch('date', e.target.value)}
            className="border rounded px-2 py-1 bg-transparent"
          />
        </label>
        <label className="flex flex-col">
          Тип события
          <select
            value={req.eventType}
            onChange={(e) => patch('eventType', e.target.value)}
            className="border rounded px-2 py-1 bg-transparent"
          >
            {EVENT_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Категория
          <select
            value={req.category}
            onChange={(e) => patch('category', e.target.value)}
            className="border rounded px-2 py-1 bg-transparent"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Бюджет ₸
          <input
            type="number"
            value={req.budgetKzt}
            onChange={(e) => patch('budgetKzt', Number(e.target.value))}
            className="border rounded px-2 py-1 bg-transparent"
          />
        </label>
        <label className="flex flex-col">
          Язык (опц.)
          <select
            value={req.language ?? ''}
            onChange={(e) => patch('language', e.target.value || undefined)}
            className="border rounded px-2 py-1 bg-transparent"
          >
            <option value="">—</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="self-start rounded bg-zinc-900 text-white text-sm px-3 py-1.5 dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
      >
        {loading ? '…' : 'POST /match'}
      </button>
      {err && <div className="text-red-500 text-sm">{err}</div>}
      {data && (
        <div className="text-sm flex flex-col gap-2">
          <div>
            outcome: <b>{data.outcome}</b>
          </div>
          <div>
            criteria: <i>{data.criteria.join(' · ')}</i>
          </div>
          <div>summary: {data.summary}</div>
          <div>
            карточек: <b>{data.cards.length}</b>
          </div>
          {data.cards.map((c) => (
            <div key={c.id} className="border rounded p-2 flex flex-col gap-1">
              <div className="font-medium">
                {c.anonName}{' '}
                <span className="text-xs text-zinc-500">
                  {c.id} · {c.category} · {c.city} · {c.priceFromKzt.toLocaleString('ru-RU')} ₸
                </span>
              </div>
              <div>{c.reason}</div>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 list-disc pl-5">
                {c.factsUsed.map((f, i) => (
                  <li key={i}>
                    {f.verified ? '✓' : '⊙'} {f.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <details>
            <summary className="text-xs cursor-pointer">funnel + raw</summary>
            <Pre data={{ funnel: data.funnel, raw: data }} />
          </details>
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

interface ChatLogEntry {
  time: string;
  event: string;
  data: unknown;
}

function ChatPanel() {
  const [mode, setMode] = useState<'search' | 'bundle'>('search');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [log, setLog] = useState<ChatLogEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const push = (event: string, data: unknown) =>
    setLog((l) => [...l, { time: new Date().toLocaleTimeString(), event, data }]);

  const createSession = async () => {
    setErr(null);
    setLog([]);
    try {
      const res = await fetch(`${API}/api/v1/chat/session`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      setSessionId(json.sessionId);
      push('session', json);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const send = async () => {
    if (!sessionId || !content.trim()) return;
    setErr(null);
    push('user', { content });
    const payload = content;
    setContent('');
    try {
      const res = await fetch(`${API}/api/v1/chat/${sessionId}/message`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({ content: payload }),
      });
      if (!res.body) throw new Error('no body');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      // разбираем SSE построчно: event: X \n data: Y \n\n
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let sepIdx: number;
        while ((sepIdx = buf.indexOf('\n\n')) !== -1) {
          const chunk = buf.slice(0, sepIdx);
          buf = buf.slice(sepIdx + 2);
          let event = 'message';
          let data = '';
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          try {
            push(event, JSON.parse(data));
          } catch {
            push(event, data);
          }
        }
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const loadHistory = async () => {
    if (!sessionId) return;
    setErr(null);
    try {
      const res = await fetch(`${API}/api/v1/chat/${sessionId}`);
      const json = await res.json();
      push('history', json);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <Section title="Chat">
      <div className="flex gap-2 items-end text-xs flex-wrap">
        <label className="flex flex-col">
          Режим
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'search' | 'bundle')}
            className="border rounded px-2 py-1 bg-transparent"
          >
            <option value="search">search (одна категория)</option>
            <option value="bundle">bundle (весь пакет)</option>
          </select>
        </label>
        <button
          onClick={createSession}
          className="rounded bg-zinc-900 text-white text-sm px-3 py-1.5 dark:bg-zinc-100 dark:text-zinc-900"
        >
          POST /chat/session
        </button>
        <button
          onClick={loadHistory}
          disabled={!sessionId}
          className="rounded border text-sm px-3 py-1.5 disabled:opacity-50"
        >
          GET /chat/:id
        </button>
        {sessionId && (
          <span className="text-xs text-zinc-500">session: {sessionId}</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="сообщение…"
          disabled={!sessionId}
          className="border rounded px-3 py-1.5 flex-1 bg-transparent disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!sessionId || !content.trim()}
          className="rounded bg-zinc-900 text-white text-sm px-3 py-1.5 dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
        >
          Send (SSE)
        </button>
      </div>
      {err && <div className="text-red-500 text-sm">{err}</div>}
      <div className="text-xs flex flex-col gap-1 max-h-96 overflow-auto">
        {log.map((l, i) => (
          <div key={i} className="border-b border-zinc-200 dark:border-zinc-800 py-1">
            <span className="text-zinc-500">{l.time}</span>{' '}
            <span className="font-mono font-semibold">{l.event}</span>
            <Pre data={l.data} />
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DevPage() {
  return (
    <main className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">DEV · тест бекенда</h1>
        <p className="text-sm text-zinc-500">
          API: <code>{API}</code> · контракт: <code>shared/contract.ts</code>
        </p>
      </header>
      <HealthPanel />
      <CatalogPanel />
      <MatchPanel />
      <ChatPanel />
    </main>
  );
}

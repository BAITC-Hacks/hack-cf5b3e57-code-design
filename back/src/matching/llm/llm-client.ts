import type { CriterionKey } from '../criteria';
import type { CardFact, FactKey } from '../types';

export interface EvidenceOption {
  id: string;
  criterionKey: CriterionKey;
  factKeys: FactKey[];
  /** Server-rendered, source-backed clause. The model may select, not edit it. */
  text: string;
}

export interface ExplainInput {
  criteria: string[];
  request: {
    city: string;
    date: string;
    eventType: string;
    category: string;
    budgetKzt: number;
    durationHours?: number;
    language?: string;
    locale?: 'ru' | 'kk' | 'en';
  };
  candidate: {
    id: string;
    anonName: string;
    priceFromKzt: number;
    languages: string[];
    eventFormats: string[];
    maxHours: number | null;
    description: string;
    signals: string[];
    specialization: string | null;
  };
  /** The LLM chooses one of these validated clauses; it cannot invent claims. */
  options: EvidenceOption[];
  /** Critic feedback for the single allowed retry. */
  feedback?: string[];
}

export interface ExplainOutput {
  selectedId: string;
}

export interface CriteriaInput {
  request: ExplainInput['request'];
  poolSize: number;
}

/**
 * Единая точка LLM-вызовов. Реальный адаптер и MOCK живут за одним интерфейсом,
 * чтобы пайплайн ничего не знал про провайдера.
 */
export interface LlmClient {
  criteria(input: CriteriaInput): Promise<string[]>;
  explain(input: ExplainInput): Promise<ExplainOutput>;
  critic(reasons: { id: string; reason: string; facts: CardFact[] }[]): Promise<{
    ok: boolean;
    problems: { id: string; problem: string }[];
  }>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');

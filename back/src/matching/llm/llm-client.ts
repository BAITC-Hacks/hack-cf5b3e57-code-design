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
  /** Признаки, которыми этот кандидат ОТЛИЧАЕТСЯ от двух других в топе. */
  differentiators: string[];
}

export interface ExplainOutput {
  reason: string;
  factsUsed: string[];
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
  critic(reasons: { id: string; reason: string }[]): Promise<{
    ok: boolean;
    problems: { id: string; problem: string }[];
  }>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');

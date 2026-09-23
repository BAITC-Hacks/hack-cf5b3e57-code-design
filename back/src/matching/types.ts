export type MatchOutcome =
  | 'found'
  | 'no_category_in_city'
  | 'all_filtered_out';

export type FactKey =
  | 'budget'
  | 'format'
  | 'language'
  | 'hours'
  | 'signal'
  | 'description';

export interface CardFact {
  key: FactKey;
  label: string;
  verified: boolean;
}

export interface CardFlags {
  synthetic: boolean;
  priceImputed: boolean;
  cityImputed: boolean;
}

export interface MatchCard {
  id: string;
  anonName: string;
  category: string;
  city: string;
  priceFromKzt: number;
  reason: string;
  factsUsed: CardFact[];
  flags: CardFlags;
}

export interface FunnelStep {
  step:
    | 'city'
    | 'category'
    | 'date'
    | 'format'
    | 'budget'
    | 'language'
    | 'hours';
  before: number;
  after: number;
  removedReason: string;
}

export interface MatchResponse {
  outcome: MatchOutcome;
  criteria: string[];
  cards: MatchCard[];
  funnel: FunnelStep[];
  summary: string;
}

/**
 * Итог фильтра: кто прошёл + сколько отсеяно на каждом шаге и почему.
 * Ранжирование и объяснение работают только с `survivors`.
 */
export interface FilterResult {
  survivors: string[];
  funnel: FunnelStep[];
  totalBeforeAny: number;
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { parse } from 'csv-parse/sync';
import request from 'supertest';
import type { App } from 'supertest/types';
import { humanDate } from '../src/matching/copy/nouns';
import { ExplainerService } from '../src/matching/explainer.service';
import { FilterService } from '../src/matching/filter.service';
import {
  LLM_CLIENT,
  type ExplainOutput,
  type LlmClient,
} from '../src/matching/llm/llm-client';
import { MockLlmClient } from '../src/matching/llm/mock-llm.client';
import { MatchingController } from '../src/matching/matching.controller';
import { MatchingService } from '../src/matching/matching.service';
import { RankingService } from '../src/matching/ranking.service';
import type { MatchCard, MatchResponse } from '../src/matching/types';
import { PrismaService } from '../src/prisma/prisma.service';

type SeedRow = {
  id: string;
  anon_name: string;
  categories: string;
  city: string;
  city_imputed: string;
  synthetic: string;
  price_from_kzt: string;
  price_imputed: string;
  event_formats: string;
  languages: string;
  max_hours: string;
  busy_dates: string;
  description: string;
};

type ContractorFixture = {
  id: string;
  anonName: string;
  categories: string[];
  city: string;
  cityImputed: boolean;
  synthetic: boolean;
  priceFromKzt: number;
  priceImputed: boolean;
  eventFormats: string[];
  languages: string[];
  maxHours: number | null;
  busyDates: string[];
  description: string;
  enrichment: null;
};

type Query = {
  where?: Record<string, unknown>;
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  take?: number;
};

const list = (value: string): string[] =>
  value === '' ? [] : value.split('|').map((item) => item.trim());

const csv = readFileSync(
  join(__dirname, '..', 'prisma', 'seed-data', 'contractors.csv'),
  'utf8',
);
const rows = parse<SeedRow>(csv, {
  bom: true,
  columns: true,
  skip_empty_lines: true,
  trim: true,
});
const fixture: ContractorFixture[] = rows.map((row) => ({
  id: row.id,
  anonName: row.anon_name,
  categories: list(row.categories),
  city: row.city,
  cityImputed: row.city_imputed === 'True',
  synthetic: row.synthetic === 'True',
  priceFromKzt: Number(row.price_from_kzt),
  priceImputed: row.price_imputed === 'True',
  eventFormats: list(row.event_formats),
  languages: list(row.languages),
  maxHours: row.max_hours === '' ? null : Number(row.max_hours),
  busyDates: list(row.busy_dates),
  description: row.description,
  enrichment: null,
}));
const byId = new Map(fixture.map((contractor) => [contractor.id, contractor]));

/** The fake implements the Prisma query operators used by matching over the real seed CSV. */
function matches(
  row: ContractorFixture,
  where?: Record<string, unknown>,
): boolean {
  if (!where) return true;
  for (const [field, expected] of Object.entries(where)) {
    if (field === 'AND' || field === 'OR' || field === 'NOT') {
      const clauses = Array.isArray(expected) ? expected : [expected];
      const results = clauses.map((clause) =>
        matches(row, clause as Record<string, unknown>),
      );
      if (field === 'AND' && !results.every(Boolean)) return false;
      if (field === 'OR' && !results.some(Boolean)) return false;
      if (field === 'NOT' && results.some(Boolean)) return false;
      continue;
    }

    const actual = row[field as keyof ContractorFixture];
    if (expected !== null && typeof expected === 'object') {
      const operation = expected as Record<string, unknown>;
      if ('has' in operation && !Array.isArray(actual)) return false;
      if (
        'has' in operation &&
        !(actual as string[]).includes(operation.has as string)
      ) {
        return false;
      }
      if (
        'hasSome' in operation &&
        !(operation.hasSome as string[]).some((item) =>
          (actual as string[]).includes(item),
        )
      ) {
        return false;
      }
      if ('in' in operation && !(operation.in as unknown[]).includes(actual)) {
        return false;
      }
      if ('lte' in operation && !(Number(actual) <= Number(operation.lte))) {
        return false;
      }
      if ('gte' in operation && !(Number(actual) >= Number(operation.gte))) {
        return false;
      }
      if ('equals' in operation && actual !== operation.equals) return false;
      if ('not' in operation && actual === operation.not) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

function project(
  row: ContractorFixture,
  query: Query,
): Record<string, unknown> {
  if (!query.select) return { ...row };
  return Object.fromEntries(
    Object.entries(query.select)
      .filter(([, selected]) => selected === true)
      .map(([field]) => [field, row[field as keyof ContractorFixture]]),
  );
}

function createPrismaFake() {
  const cache: Record<string, unknown>[] = [];
  const queryRows = (query: Query = {}) => {
    const selected = fixture.filter((row) => matches(row, query.where));
    const orderBy = Array.isArray(query.orderBy)
      ? query.orderBy[0]
      : query.orderBy;
    if (orderBy) {
      const [field, direction] = Object.entries(orderBy)[0];
      selected.sort((a, b) => {
        const left = a[field as keyof ContractorFixture];
        const right = b[field as keyof ContractorFixture];
        const result = String(left).localeCompare(String(right), undefined, {
          numeric: true,
        });
        return direction === 'desc' ? -result : result;
      });
    }
    return (
      query.take === undefined ? selected : selected.slice(0, query.take)
    ).map((row) => project(row, query));
  };
  return {
    contractor: {
      findMany: (query?: Query) => Promise.resolve(queryRows(query)),
      findFirst: (query?: Query) =>
        Promise.resolve(queryRows({ ...query, take: 1 })[0] ?? null),
      findUnique: (query?: Query) =>
        Promise.resolve(queryRows({ ...query, take: 1 })[0] ?? null),
      count: (query?: Query) => Promise.resolve(queryRows(query).length),
    },
    explanationCache: {
      findMany: (query?: Query) =>
        Promise.resolve(
          cache.filter((entry) => {
            const where = query?.where ?? {};
            return Object.entries(where).every(([field, expected]) => {
              if (
                expected &&
                typeof expected === 'object' &&
                'in' in expected
              ) {
                return (expected.in as unknown[]).includes(entry[field]);
              }
              return entry[field] === expected;
            });
          }),
        ),
      create: ({ data }: { data: Record<string, unknown> }) => {
        cache.push(data);
        return Promise.resolve(data);
      },
      upsert: ({
        where,
        create,
        update,
      }: {
        where: Record<string, unknown>;
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const match = cache.find((entry) =>
          Object.entries(where).every(([key, value]) => entry[key] === value),
        );
        if (match) return Promise.resolve(Object.assign(match, update));
        cache.push(create);
        return Promise.resolve(create);
      },
    },
  };
}

const dense = {
  city: 'Алматы',
  date: '2026-10-16',
  eventType: 'корпоратив',
  category: 'Ведущий',
  budgetKzt: 1_000_000,
};

async function createApp(
  llm: LlmClient = new MockLlmClient(),
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    controllers: [MatchingController],
    providers: [
      MatchingService,
      FilterService,
      RankingService,
      ExplainerService,
      { provide: PrismaService, useValue: createPrismaFake() },
      { provide: LLM_CLIENT, useValue: llm },
    ],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return app;
}

async function match(
  app: INestApplication<App>,
  body: object,
): Promise<MatchResponse> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/match')
    .send(body)
    .expect(201);
  return response.body as MatchResponse;
}

function expectCardsGrounded(cards: MatchCard[], req: typeof dense): void {
  expect(cards.length).toBeLessThanOrEqual(3);
  for (const card of cards) {
    const source = byId.get(card.id);
    expect(source).toBeDefined();
    expect(card.anonName).toBe(source!.anonName);
    expect(card.city).toBe(req.city);
    expect(source!.categories).toContain(req.category);
    expect(source!.busyDates).not.toContain(req.date);
    expect(source!.eventFormats).toContain(req.eventType);
    expect(card.priceFromKzt).toBe(source!.priceFromKzt);
    expect(card.priceFromKzt).toBeLessThanOrEqual(req.budgetKzt);
    expect(card.reason.trim().length).toBeGreaterThan(35);
    expect(card.reason).toContain(humanDate(req.date));
    const sentenceCount = card.reason
      .split(/[.!?]+/)
      .filter((part) => part.trim()).length;
    expect(sentenceCount).toBeGreaterThanOrEqual(1);
    expect(sentenceCount).toBeLessThanOrEqual(2);
    expect(card.factsUsed.length).toBeGreaterThan(0);
    expect(card.factsUsed.some((fact) => fact.verified)).toBe(true);
    for (const fact of card.factsUsed) {
      if (fact.verified) continue;
      if (fact.key === 'budget') {
        expect(source!.priceImputed).toBe(true);
        expect(card.flags.priceImputed).toBe(true);
      } else if (fact.key === 'hours') {
        expect(source!.maxHours).toBeNull();
      } else {
        expect(['description', 'signal']).toContain(fact.key);
        expect(fact.label).toMatch(/описан|со слов/i);
      }
    }
    expect(card.flags).toEqual({
      synthetic: source!.synthetic,
      priceImputed: source!.priceImputed,
      cityImputed: source!.cityImputed,
    });
  }
  const withoutNames = cards.map((card) =>
    card.reason
      .toLowerCase()
      .replaceAll(card.anonName.toLowerCase(), '')
      .trim(),
  );
  expect(new Set(withoutNames).size).toBe(cards.length);
}

describe('POST /api/v1/match — Word/SCOPE acceptance cases (MOCK + 66 CSV rows)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    expect(fixture).toHaveLength(66);
    expect(new Set(fixture.map((row) => row.id)).size).toBe(66);
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns <= 3 grounded, non-interchangeable cards for the dense category within 10 s', async () => {
    const started = performance.now();
    const result = await match(app, dense);
    const elapsedMs = performance.now() - started;

    expect(elapsedMs).toBeLessThan(10_000);
    expect(result.outcome).toBe('found');
    expect(result.cards).toHaveLength(3);
    expect(result.criteria.length).toBeGreaterThanOrEqual(2);
    expect(result.funnel.find((step) => step.step === 'category')?.after).toBe(
      10,
    );
    expect(result.funnel.at(-1)?.after).toBe(4);
    expectCardsGrounded(result.cards, dense);
  }, 15_000);

  it('changes the shortlist with the date and never recommends someone busy that day', async () => {
    const october16 = await match(app, dense);
    const october23Request = { ...dense, date: '2026-10-23' };
    const october23 = await match(app, october23Request);
    expect(october23.outcome).toBe('found');
    expect(october23.cards).toHaveLength(3);
    expect(october16.cards.map((card) => card.id)).not.toEqual(
      october23.cards.map((card) => card.id),
    );
    expectCardsGrounded(october23.cards, october23Request);
    expect(october16.cards.map((card) => card.reason).join(' ')).toMatch(
      /свобод|16 октября|2026-10-16/i,
    );
    expect(october23.cards.map((card) => card.reason).join(' ')).toMatch(
      /свобод|23 октября|2026-10-23/i,
    );
  });

  it('returns the two rare-category contractors and explains why there are fewer than three', async () => {
    const req = {
      city: 'Алматы',
      date: '2026-10-15',
      eventType: 'свадьба',
      category: 'Флорист',
      budgetKzt: 300_000,
    };
    const result = await match(app, req);
    expect(result.outcome).toBe('found');
    expect(result.cards.map((card) => card.id)).toEqual(
      expect.arrayContaining(['HK-39372', 'HK-90001']),
    );
    expect(result.cards).toHaveLength(2);
    expect(result.summary).toMatch(/2|дв[аеи]/i);
    expectCardsGrounded(result.cards, req);
  });

  it('distinguishes no category in the city from an over-filtered category', async () => {
    const absent = await match(app, {
      city: 'Астана',
      date: '2026-11-14',
      eventType: 'свадьба',
      category: 'Лайв-бэнд',
      budgetKzt: 1_500_000,
    });
    expect(absent.outcome).toBe('no_category_in_city');
    expect(absent.cards).toEqual([]);
    expect(absent.summary.trim().length).toBeGreaterThan(25);
    expect(absent.summary).toMatch(/нет|отсутств/i);

    const allBusy = await match(app, {
      city: 'Алматы',
      date: '2026-11-14',
      eventType: 'той',
      category: 'Декоратор',
      budgetKzt: 3_000_000,
    });
    expect(allBusy.outcome).toBe('all_filtered_out');
    expect(allBusy.cards).toEqual([]);
    expect(allBusy.funnel.find((step) => step.step === 'category')?.after).toBe(
      3,
    );
    expect(allBusy.funnel.find((step) => step.step === 'date')?.after).toBe(0);
    expect(allBusy.summary).toMatch(/занят|дата|свобод/i);
    // Once every candidate is unavailable, the explanation must not also
    // count those same profiles as rejected for price or format.
    expect(allBusy.summary).not.toMatch(/дороже|бюджет/i);
  });

  it('repeats the same card order and explanations for an identical request', async () => {
    const first = await match(app, dense);
    const repeated = await match(app, dense);
    expect(repeated.outcome).toBe(first.outcome);
    expect(repeated.cards.map((card) => [card.id, card.reason])).toEqual(
      first.cards.map((card) => [card.id, card.reason]),
    );
  });

  it('streams an inspectable pipeline and a final done event', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/match/stream')
      .query(dense)
      .expect(200);
    expect(response.headers['content-type']).toMatch(/text\/event-stream/);
    const eventTypes = [...response.text.matchAll(/^event: ([^\r\n]+)/gm)].map(
      (match) => match[1],
    );
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        'criteria',
        'filter_step',
        'ranked',
        'card',
        'critic',
        'done',
      ]),
    );
    expect(eventTypes.at(-1)).toBe('done');
  });
});

describe('POST /api/v1/match — untrusted model output', () => {
  it('never publishes invented prose even when the critic rejects every proposal', async () => {
    const fallback = new MockLlmClient();
    const injectedClaim =
      'Этот подрядчик выступал на Марсе и получил миллион наград.';
    const explain = jest.fn(
      (input: Parameters<LlmClient['explain']>[0]): Promise<ExplainOutput> =>
        Promise.resolve({
          selectedId: input.options[0]?.id ?? 'unknown-option',
          reason: injectedClaim,
        } as ExplainOutput),
    );
    const critic = jest.fn((reasons: Parameters<LlmClient['critic']>[0]) =>
      Promise.resolve({
        ok: false,
        problems: reasons.map(({ id }) => ({
          id,
          problem: 'generic or unverified',
        })),
      }),
    );
    const app = await createApp({
      criteria: (input) => fallback.criteria(input),
      explain,
      critic,
    });
    try {
      const result = await match(app, dense);
      expect(result.outcome).toBe('found');
      expect(result.cards).toHaveLength(3);
      expectCardsGrounded(result.cards, dense);
      expect(result.cards.map((card) => card.reason).join(' ')).not.toContain(
        injectedClaim,
      );
      expect(critic).toHaveBeenCalled();
      expect(explain).toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});

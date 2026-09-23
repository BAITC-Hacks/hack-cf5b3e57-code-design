import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import { ChatService, type ChatStreamEvent } from '../src/chat/chat.service';
import { InjectionGuard } from '../src/chat/guards/injection.guard';
import {
  OpenAiChatClient,
  type ChatCompletionResult,
} from '../src/chat/openai-chat.client';
import {
  ToolsService,
  type EventBundle,
} from '../src/chat/tools/tools.service';
import type { MatchRequestDto } from '../src/matching/dto/match-request.dto';
import type { MatchResponse } from '../src/matching/types';
import type { MatchingService } from '../src/matching/matching.service';
import type { PrismaService } from '../src/prisma/prisma.service';

jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

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

type Contractor = {
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
};

const contractors: Contractor[] = parse<SeedRow>(
  readFileSync(
    join(__dirname, '..', 'prisma', 'seed-data', 'contractors.csv'),
    'utf8',
  ),
  { bom: true, columns: true, skip_empty_lines: true, trim: true },
).map((row) => ({
  id: row.id,
  anonName: row.anon_name,
  categories: row.categories.split('|'),
  city: row.city,
  cityImputed: row.city_imputed === 'True',
  synthetic: row.synthetic === 'True',
  priceFromKzt: Number(row.price_from_kzt),
  priceImputed: row.price_imputed === 'True',
  eventFormats: row.event_formats.split('|'),
  languages: row.languages.split('|'),
  maxHours: row.max_hours === '' ? null : Number(row.max_hours),
  busyDates: row.busy_dates === '' ? [] : row.busy_dates.split('|'),
}));
const sourceIds = new Set(contractors.map((row) => row.id));

function sourceBackedMatch(req: MatchRequestDto): MatchResponse {
  const inCategory = contractors.filter(
    (row) => row.city === req.city && row.categories.includes(req.category),
  );
  const eligible = inCategory
    .filter(
      (row) =>
        !row.busyDates.includes(req.date) &&
        row.eventFormats.includes(req.eventType) &&
        row.priceFromKzt <= req.budgetKzt &&
        (!req.language || row.languages.includes(req.language)),
    )
    .sort(
      (left, right) =>
        left.priceFromKzt - right.priceFromKzt ||
        left.id.localeCompare(right.id),
    );
  return {
    outcome:
      eligible.length > 0
        ? 'found'
        : inCategory.length === 0
          ? 'no_category_in_city'
          : 'all_filtered_out',
    criteria: ['дата', 'формат', 'бюджет'],
    cards: eligible.slice(0, 3).map((row) => ({
      id: row.id,
      anonName: row.anonName,
      category: req.category,
      city: row.city,
      priceFromKzt: row.priceFromKzt,
      reason: `Свободен ${req.date}; берёт ${req.eventType}; цена ${row.priceFromKzt} ₸.`,
      factsUsed: [
        { key: 'date', label: `Свободен ${req.date}`, verified: true },
      ],
      flags: {
        synthetic: row.synthetic,
        priceImputed: row.priceImputed,
        cityImputed: row.cityImputed,
      },
    })),
    funnel: [],
    summary:
      eligible.length > 0
        ? `Подходят ${eligible.length} подрядчиков.`
        : `Нет подходящих подрядчиков категории ${req.category}.`,
  };
}

function createFakePrisma() {
  const sessions = new Map<
    string,
    { id: string; mode: string; locale: string }
  >();
  const messages: {
    id: string;
    sessionId: string;
    role: string;
    content: string;
    attachments: unknown;
    createdAt: Date;
  }[] = [];
  return {
    contractor: {
      findMany: (query: {
        where: {
          city: string;
          categories: { has: string };
          eventFormats?: { has: string };
          NOT?: { busyDates: { has: string } };
          languages?: { has: string };
        };
        take?: number;
      }) => {
        const rows = contractors
          .filter(
            (row) =>
              row.city === query.where.city &&
              row.categories.includes(query.where.categories.has) &&
              (!query.where.eventFormats ||
                row.eventFormats.includes(query.where.eventFormats.has)) &&
              (!query.where.NOT ||
                !row.busyDates.includes(query.where.NOT.busyDates.has)) &&
              (!query.where.languages ||
                row.languages.includes(query.where.languages.has)),
          )
          .sort((left, right) => left.priceFromKzt - right.priceFromKzt)
          .map((row) => ({ priceFromKzt: row.priceFromKzt }));
        return Promise.resolve(
          query.take === undefined ? rows : rows.slice(0, query.take),
        );
      },
    },
    chatSession: {
      create: ({ data }: { data: { mode: string; locale: string } }) => {
        const session = { id: `session-${sessions.size + 1}`, ...data };
        sessions.set(session.id, session);
        return Promise.resolve(session);
      },
      findUnique: ({ where }: { where: { id: string } }) =>
        Promise.resolve(sessions.get(where.id) ?? null),
    },
    chatMessage: {
      create: ({
        data,
      }: {
        data: {
          sessionId: string;
          role: string;
          content: string;
          attachments: unknown;
        };
      }) => {
        const message = {
          id: `message-${messages.length + 1}`,
          sessionId: data.sessionId,
          role: data.role,
          content: data.content,
          attachments: data.attachments,
          createdAt: new Date(2026, 8, 23, 12, 0, messages.length),
        };
        messages.push(message);
        return Promise.resolve(message);
      },
      findMany: ({
        where,
        orderBy,
        take,
      }: {
        where: { sessionId: string };
        orderBy: { createdAt: 'asc' | 'desc' }[];
        take?: number;
      }) => {
        const selected = messages.filter(
          (message) => message.sessionId === where.sessionId,
        );
        if (orderBy[0]?.createdAt === 'desc') selected.reverse();
        return Promise.resolve(
          take === undefined ? selected : selected.slice(0, take),
        );
      },
    },
  };
}

function createHarness() {
  const prisma = createFakePrisma();
  const matching = {
    run: jest.fn((req: MatchRequestDto) =>
      Promise.resolve(sourceBackedMatch(req)),
    ),
  } as unknown as MatchingService;
  const tools = new ToolsService(matching, prisma as unknown as PrismaService);
  const execute = jest.spyOn(tools, 'execute');
  const openai = new OpenAiChatClient({
    get: (key: string) => (key === 'MOCK' ? '1' : undefined),
  } as ConstructorParameters<typeof OpenAiChatClient>[0]);
  expect(openai.isMock()).toBe(true);
  const chat = new ChatService(
    prisma as unknown as PrismaService,
    new InjectionGuard(),
    openai,
    tools,
  );
  return { chat, execute, openai };
}

async function collect(
  stream: AsyncGenerator<ChatStreamEvent>,
): Promise<ChatStreamEvent[]> {
  const events: ChatStreamEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe('bundle chat in MOCK mode', () => {
  beforeAll(() => expect(contractors).toHaveLength(66));

  it('estimates first and stops before bundle creation when budget is insufficient', async () => {
    const { chat, execute } = createHarness();
    const { sessionId } = await chat.createSession({ mode: 'bundle' });
    const events = await collect(
      chat.streamMessage(
        sessionId,
        'Свадьба в Алматы 2026-10-15, бюджет 100000 тенге.',
      ),
    );
    expect(events.some((event) => event.type === 'error')).toBe(false);
    expect(
      events
        .filter((event) => event.type === 'tool_start')
        .map((event) => event.data.name),
    ).toEqual(['estimate_bundle_minimum']);
    expect(execute.mock.calls.map(([name]) => name)).toEqual([
      'estimate_bundle_minimum',
    ]);
    expect(events.some((event) => event.type === 'attachment')).toBe(false);
    const done = events.find((event) => event.type === 'done');
    expect(done).toBeDefined();
    if (done?.type !== 'done') throw new Error('missing done event');
    expect(done.data.message.content).toMatch(/нужно минимум|нужен минимум/i);
    expect(done.data.message.content).toMatch(/100\s*000/u);
    expect(done.data.message.attachments).toBeUndefined();
  });

  it('attaches a source-backed bundle and marks an absent category honestly', async () => {
    const { chat, execute } = createHarness();
    const { sessionId } = await chat.createSession({ mode: 'bundle' });
    const events = await collect(
      chat.streamMessage(
        sessionId,
        'Свадьба в Астана 2026-10-15, бюджет 10000000 тенге.',
      ),
    );
    expect(events.some((event) => event.type === 'error')).toBe(false);
    expect(
      events
        .filter((event) => event.type === 'tool_start')
        .map((event) => event.data.name),
    ).toEqual(['estimate_bundle_minimum', 'build_event_bundle']);
    expect(execute.mock.calls.map(([name]) => name)).toEqual([
      'estimate_bundle_minimum',
      'build_event_bundle',
    ]);
    const attachments = events.filter(
      (event): event is Extract<ChatStreamEvent, { type: 'attachment' }> =>
        event.type === 'attachment',
    );
    expect(attachments).toHaveLength(1);
    const attachment = attachments[0].data;
    expect(attachment.type).toBe('bundle');
    if (attachment.type !== 'bundle')
      throw new Error('not a bundle attachment');
    const bundle: EventBundle = attachment.bundle;
    expect(bundle.city).toBe('Астана');
    expect(bundle.date).toBe('2026-10-15');
    expect(bundle.totalBudgetKzt).toBe(10_000_000);
    expect(bundle.required.map((item) => item.category)).toEqual([
      'Ведущий',
      'Банкетный зал',
      'Фотограф',
      'Декоратор',
    ]);
    const decorator = bundle.required.find(
      (item) => item.category === 'Декоратор',
    );
    expect(decorator?.match.outcome).toBe('no_category_in_city');
    expect(decorator?.match.cards).toEqual([]);
    const allocated = [...bundle.required, ...bundle.recommended].reduce(
      (total, item) => total + item.allocatedBudgetKzt,
      0,
    );
    expect(allocated).toBeLessThanOrEqual(bundle.totalBudgetKzt);
    for (const item of [...bundle.required, ...bundle.recommended]) {
      expect(item.allocatedBudgetKzt).toBeGreaterThanOrEqual(0);
      expect(item.match.cards.length).toBeLessThanOrEqual(3);
      for (const card of item.match.cards) {
        expect(sourceIds.has(card.id)).toBe(true);
        expect(card.category).toBe(item.category);
        expect(card.city).toBe(bundle.city);
        expect(card.priceFromKzt).toBeLessThanOrEqual(item.allocatedBudgetKzt);
      }
    }
    const done = events.find((event) => event.type === 'done');
    expect(done).toBeDefined();
    if (done?.type !== 'done') throw new Error('missing done event');
    expect(done.data.message.attachments).toEqual([attachment]);
    const history = await chat.getHistory(sessionId);
    expect(history.messages.at(-1)?.attachments).toEqual([attachment]);
  });

  it('does not repeat a model-invented contractor ID in final prose', async () => {
    const { chat, openai } = createHarness();
    const invented =
      'Добавил в пакет подрядчика HK-99999 — он идеально подходит.';
    const toolCall = {
      id: 'mock_build_event_bundle',
      type: 'function' as const,
      function: {
        name: 'build_event_bundle',
        arguments: JSON.stringify({
          city: 'Астана',
          date: '2026-10-15',
          eventType: 'свадьба',
          totalBudgetKzt: 10_000_000,
          requiredCategories: [
            'Ведущий',
            'Банкетный зал',
            'Фотограф',
            'Декоратор',
          ],
          recommendedCategories: ['Лайв-бэнд'],
        }),
      },
    };
    const toolResponse: ChatCompletionResult = {
      content: invented,
      toolCalls: [toolCall],
      assistantMessage: {
        role: 'assistant',
        content: invented,
        tool_calls: [toolCall],
      },
    };
    const inventedResponse: ChatCompletionResult = {
      content: invented,
      toolCalls: [],
      assistantMessage: { role: 'assistant', content: invented },
    };
    const complete = jest
      .spyOn(openai, 'complete')
      .mockResolvedValueOnce(toolResponse)
      .mockResolvedValueOnce(inventedResponse);

    const { sessionId } = await chat.createSession({ mode: 'bundle' });
    const events = await collect(
      chat.streamMessage(
        sessionId,
        'Свадьба в Астана 2026-10-15, бюджет 10000000 тенге.',
      ),
    );
    expect(events.some((event) => event.type === 'error')).toBe(false);
    const attachment = events.find((event) => event.type === 'attachment');
    expect(attachment).toBeDefined();
    const done = events.find((event) => event.type === 'done');
    if (done?.type !== 'done') throw new Error('missing done event');
    expect(done.data.message.content).not.toContain('HK-99999');
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

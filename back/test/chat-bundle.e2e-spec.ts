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

function completedBundle(events: ChatStreamEvent[]): {
  bundle: EventBundle;
  content: string;
} {
  expect(events.some((event) => event.type === 'error')).toBe(false);
  const done = events.find((event) => event.type === 'done');
  if (done?.type !== 'done') throw new Error('missing done event');
  const attachment = done.data.message.attachments?.find(
    (item) => item.type === 'bundle',
  );
  if (attachment?.type !== 'bundle')
    throw new Error('missing bundle attachment');
  return {
    bundle: attachment.bundle,
    content: done.data.message.content,
  };
}

function foundRequired(bundle: EventBundle): number {
  return bundle.required.filter((item) => item.match.cards.length > 0).length;
}

describe('bundle chat in MOCK mode', () => {
  beforeAll(() => expect(contractors).toHaveLength(66));

  it('uses the date and 5m budget from the first natural-language message without repeated questions', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
    try {
      const { chat, execute } = createHarness();
      const { sessionId } = await chat.createSession({ mode: 'bundle' });
      const events = await collect(
        chat.streamMessage(
          sessionId,
          'Привет. Я хочу организовать свадьбу в Астане на 17 октября. Бюджет 5 млн',
        ),
      );

      expect(events.some((event) => event.type === 'error')).toBe(false);
      expect(execute.mock.calls.map(([name]) => name)).toEqual([
        'estimate_bundle_minimum',
        'build_event_bundle',
      ]);
      const estimate = (await execute.mock.results[0].value) as {
        totalMinKzt: number;
      };
      expect(estimate.totalMinKzt).toBeLessThan(5_000_000);
      expect(execute).toHaveBeenCalledWith(
        'build_event_bundle',
        expect.objectContaining({
          city: 'Астана',
          date: '2026-10-17',
          eventType: 'свадьба',
          totalBudgetKzt: 5_000_000,
        }),
      );

      const attachment = events.find(
        (event): event is Extract<ChatStreamEvent, { type: 'attachment' }> =>
          event.type === 'attachment',
      );
      expect(attachment?.data.type).toBe('bundle');
      if (attachment?.data.type !== 'bundle') {
        throw new Error('missing bundle attachment');
      }
      const { bundle } = attachment.data;
      expect(bundle.city).toBe('Астана');
      expect(bundle.date).toBe('2026-10-17');
      expect(bundle.totalBudgetKzt).toBe(5_000_000);

      for (const item of [...bundle.required, ...bundle.recommended]) {
        for (const card of item.match.cards) {
          const source = contractors.find((row) => row.id === card.id);
          expect(source).toBeDefined();
          expect(source?.city).toBe('Астана');
          expect(source?.categories).toContain(item.category);
          expect(source?.eventFormats).toContain('свадьба');
          expect(source?.busyDates).not.toContain('2026-10-17');
          expect(card.priceFromKzt).toBeLessThanOrEqual(
            item.allocatedBudgetKzt,
          );
        }
      }

      const done = events.find((event) => event.type === 'done');
      if (done?.type !== 'done') throw new Error('missing done event');
      expect(done.data.message.attachments).toEqual([attachment.data]);
      expect(done.data.message.content).not.toMatch(
        /какой.{0,30}бюджет|сколько часов|какой язык|поднять бюджет|нужно минимум/iu,
      );

      for (const message of [
        '5 часов',
        'русский',
        'У меня же уже 5 миллионов бюджет',
      ]) {
        const followUp = await collect(chat.streamMessage(sessionId, message));
        expect(followUp.some((event) => event.type === 'error')).toBe(false);
        const latestBuildCall = execute.mock.calls
          .filter(([name]) => name === 'build_event_bundle')
          .at(-1);
        expect(latestBuildCall?.[1]).toEqual(
          expect.objectContaining({
            city: 'Астана',
            date: '2026-10-17',
            totalBudgetKzt: 5_000_000,
          }),
        );
        const followUpDone = followUp.find((event) => event.type === 'done');
        if (followUpDone?.type !== 'done') {
          throw new Error('missing follow-up done event');
        }
        expect(followUpDone.data.message.content).not.toMatch(
          /какой.{0,30}бюджет|сколько часов|какой язык|поднять бюджет|нужно минимум/iu,
        );
        const followUpBundle = followUpDone.data.message.attachments?.find(
          (item) => item.type === 'bundle',
        );
        expect(followUpBundle?.type).toBe('bundle');
        if (followUpBundle?.type === 'bundle') {
          expect(followUpBundle.bundle.date).toBe('2026-10-17');
          expect(followUpBundle.bundle.totalBudgetKzt).toBe(5_000_000);
        }
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it('preserves date and city when the budget arrives in the next message', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
    try {
      const { chat, execute } = createHarness();
      const { sessionId } = await chat.createSession({ mode: 'bundle' });
      const first = await collect(
        chat.streamMessage(sessionId, 'Планирую свадьбу в Астане 17 октября'),
      );
      expect(first.some((event) => event.type === 'error')).toBe(false);
      expect(execute).not.toHaveBeenCalled();
      const firstDone = first.find((event) => event.type === 'done');
      if (firstDone?.type !== 'done') throw new Error('missing first done');
      expect(firstDone.data.message.content).toMatch(/бюджет/i);
      expect(firstDone.data.message.content).not.toMatch(
        /какую дату|в каком городе/i,
      );

      const second = await collect(chat.streamMessage(sessionId, '5 млн'));
      expect(second.some((event) => event.type === 'error')).toBe(false);
      expect(execute.mock.calls.map(([name]) => name)).toEqual([
        'estimate_bundle_minimum',
        'build_event_bundle',
      ]);
      expect(execute).toHaveBeenCalledWith(
        'build_event_bundle',
        expect.objectContaining({
          city: 'Астана',
          date: '2026-10-17',
          eventType: 'свадьба',
          totalBudgetKzt: 5_000_000,
        }),
      );
      const secondDone = second.find((event) => event.type === 'done');
      if (secondDone?.type !== 'done') throw new Error('missing second done');
      const bundle = secondDone.data.message.attachments?.find(
        (attachment) => attachment.type === 'bundle',
      );
      expect(bundle?.type).toBe('bundle');
      if (bundle?.type === 'bundle') {
        expect(bundle.bundle.date).toBe('2026-10-17');
        expect(bundle.bundle.totalBudgetKzt).toBe(5_000_000);
      }
    } finally {
      jest.useRealTimers();
    }
  });

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
    const { chat, execute, openai } = createHarness();
    const invented =
      'Добавил в пакет подрядчика HK-99999 — он идеально подходит.';
    const toolCall = {
      id: 'mock_build_event_bundle',
      type: 'function' as const,
      function: {
        name: 'build_event_bundle',
        arguments: JSON.stringify({
          city: 'Астана',
          date: '2026-10-10',
          eventType: 'свадьба',
          totalBudgetKzt: 1_000_000,
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
        'Свадьба в Астане 2026-10-17, бюджет 5000000 тенге.',
      ),
    );
    expect(events.some((event) => event.type === 'error')).toBe(false);
    const attachment = events.find((event) => event.type === 'attachment');
    expect(attachment).toBeDefined();
    expect(execute).toHaveBeenCalledWith(
      'build_event_bundle',
      expect.objectContaining({
        city: 'Астана',
        date: '2026-10-17',
        totalBudgetKzt: 5_000_000,
      }),
    );
    if (
      attachment?.type === 'attachment' &&
      attachment.data.type === 'bundle'
    ) {
      expect(attachment.data.bundle.date).toBe('2026-10-17');
      expect(attachment.data.bundle.totalBudgetKzt).toBe(5_000_000);
      for (const item of [
        ...attachment.data.bundle.required,
        ...attachment.data.bundle.recommended,
      ]) {
        for (const card of item.match.cards) {
          expect(sourceIds.has(card.id)).toBe(true);
        }
      }
    }
    const done = events.find((event) => event.type === 'done');
    if (done?.type !== 'done') throw new Error('missing done event');
    expect(done.data.message.content).not.toContain('HK-99999');
    // Complete requests execute with server-verified slots, not model tool args.
    expect(complete).not.toHaveBeenCalled();
  });

  it('honors an excluded required category across repeated turns and restores it when asked', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
    try {
      const { chat, execute } = createHarness();
      const { sessionId } = await chat.createSession({ mode: 'bundle' });
      const first = completedBundle(
        await collect(
          chat.streamMessage(
            sessionId,
            'Свадьба в Астане 17 октября, бюджет 5 млн ₸',
          ),
        ),
      );
      expect(first.bundle.required.map((item) => item.category)).toEqual([
        'Ведущий',
        'Банкетный зал',
        'Фотограф',
        'Декоратор',
      ]);
      expect(foundRequired(first.bundle)).toBe(3);
      expect(
        first.bundle.required.find((item) => item.category === 'Ведущий')?.match
          .cards.length,
      ).toBeGreaterThan(0);

      const excluded = completedBundle(
        await collect(chat.streamMessage(sessionId, 'Мне не нужен декоратор')),
      );
      expect(excluded.bundle.required.map((item) => item.category)).toEqual([
        'Ведущий',
        'Банкетный зал',
        'Фотограф',
      ]);
      expect(foundRequired(excluded.bundle)).toBe(3);
      expect(excluded.bundle.city).toBe('Астана');
      expect(excluded.bundle.date).toBe('2026-10-17');
      expect(excluded.bundle.totalBudgetKzt).toBe(5_000_000);
      expect(excluded.content).not.toMatch(
        /3 из 4 обязательных|декоратор\s*[—-]\s*не найден/iu,
      );
      expect(excluded.content.length).toBeLessThan(1_000);
      expect(execute.mock.calls.at(-1)).toEqual([
        'build_event_bundle',
        expect.objectContaining({
          requiredCategories: ['Ведущий', 'Банкетный зал', 'Фотограф'],
          city: 'Астана',
          date: '2026-10-17',
          totalBudgetKzt: 5_000_000,
        }),
      ]);

      const callsBeforeRepeat = execute.mock.calls.length;
      const repeated = await collect(
        chat.streamMessage(
          sessionId,
          'Я же говорю, что мне не нужен декоратор',
        ),
      );
      expect(repeated.some((event) => event.type === 'error')).toBe(false);
      expect(execute.mock.calls).toHaveLength(callsBeforeRepeat);
      const repeatedDone = repeated.find((event) => event.type === 'done');
      if (repeatedDone?.type !== 'done')
        throw new Error('missing repeated-action done event');
      expect(repeatedDone.data.message.content.length).toBeLessThan(300);
      expect(repeatedDone.data.message.content).toMatch(/декоратор/iu);

      const newDate = completedBundle(
        await collect(chat.streamMessage(sessionId, 'А на 18 октября?')),
      );
      expect(newDate.bundle.city).toBe('Астана');
      expect(newDate.bundle.date).toBe('2026-10-18');
      expect(newDate.bundle.totalBudgetKzt).toBe(5_000_000);
      expect(newDate.bundle.required.map((item) => item.category)).toEqual([
        'Ведущий',
        'Банкетный зал',
        'Фотограф',
      ]);
      expect(execute.mock.calls.at(-1)).toEqual([
        'build_event_bundle',
        expect.objectContaining({
          city: 'Астана',
          date: '2026-10-18',
          totalBudgetKzt: 5_000_000,
          requiredCategories: ['Ведущий', 'Банкетный зал', 'Фотограф'],
        }),
      ]);

      const restored = completedBundle(
        await collect(
          chat.streamMessage(sessionId, 'Добавь декоратора обратно'),
        ),
      );
      expect(restored.bundle.required.map((item) => item.category)).toEqual([
        'Ведущий',
        'Банкетный зал',
        'Фотограф',
        'Декоратор',
      ]);
      expect(restored.bundle.date).toBe('2026-10-18');
    } finally {
      jest.useRealTimers();
    }
  });

  it('handles the reported Almaty date change and decorator opt-out without resetting the request', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-23T00:00:00.000Z'));
    try {
      const { chat, execute } = createHarness();
      const { sessionId } = await chat.createSession({ mode: 'bundle' });
      const first = completedBundle(
        await collect(
          chat.streamMessage(
            sessionId,
            'Пакет на свадьбу · Алматы · 16 октября · 5 млн ₸',
          ),
        ),
      );
      expect(first.bundle.city).toBe('Алматы');
      expect(first.bundle.date).toBe('2026-10-16');
      expect(first.bundle.totalBudgetKzt).toBe(5_000_000);

      const second = await collect(
        chat.streamMessage(sessionId, 'А на 17 октября?'),
      );
      expect(second.some((event) => event.type === 'error')).toBe(false);
      expect(execute.mock.calls.at(-1)).toEqual([
        'estimate_bundle_minimum',
        expect.objectContaining({
          city: 'Алматы',
          date: '2026-10-17',
          requiredCategories: [
            'Ведущий',
            'Банкетный зал',
            'Фотограф',
            'Декоратор',
          ],
        }),
      ]);
      const secondDone = second.find((event) => event.type === 'done');
      if (secondDone?.type !== 'done')
        throw new Error('missing second done event');
      expect(secondDone.data.message.content).toMatch(/6\s*500\s*000/iu);
      expect(secondDone.data.message.content).not.toMatch(
        /поднять бюджет до 5\s*000\s*000/iu,
      );
      expect(secondDone.data.message.attachments).toBeUndefined();

      const excluded = completedBundle(
        await collect(chat.streamMessage(sessionId, 'Мне не нужен декоратор')),
      );
      expect(excluded.bundle.city).toBe('Алматы');
      expect(excluded.bundle.date).toBe('2026-10-17');
      expect(excluded.bundle.totalBudgetKzt).toBe(5_000_000);
      expect(excluded.bundle.required.map((item) => item.category)).toEqual([
        'Ведущий',
        'Банкетный зал',
        'Фотограф',
      ]);
      expect(foundRequired(excluded.bundle)).toBe(3);
      expect(excluded.content).not.toMatch(/\bдекоратор\s*[—-]\s*не найден/iu);
      expect(execute.mock.calls.at(-1)).toEqual([
        'build_event_bundle',
        expect.objectContaining({
          city: 'Алматы',
          date: '2026-10-17',
          totalBudgetKzt: 5_000_000,
          requiredCategories: ['Ведущий', 'Банкетный зал', 'Фотограф'],
        }),
      ]);

      const reducedBudget = await collect(
        chat.streamMessage(sessionId, 'У меня сократился бюджет до 4млн'),
      );
      expect(reducedBudget.some((event) => event.type === 'error')).toBe(false);
      expect(execute.mock.calls.at(-1)).toEqual([
        'estimate_bundle_minimum',
        expect.objectContaining({
          city: 'Алматы',
          date: '2026-10-17',
          requiredCategories: ['Ведущий', 'Банкетный зал', 'Фотограф'],
        }),
      ]);
      const reducedDone = reducedBudget.find((event) => event.type === 'done');
      if (reducedDone?.type !== 'done')
        throw new Error('missing reduced-budget done event');
      expect(reducedDone.data.message.content).toMatch(/4\s*700\s*000/iu);
      expect(reducedDone.data.message.content).toMatch(/4\s*000\s*000/iu);
      expect(reducedDone.data.message.attachments).toBeUndefined();

      const callsBeforeRepeatedRemoval = execute.mock.calls.length;
      const repeatedRemoval = await collect(
        chat.streamMessage(sessionId, 'Убрать категорию декораторов'),
      );
      expect(repeatedRemoval.some((event) => event.type === 'error')).toBe(
        false,
      );
      expect(execute.mock.calls).toHaveLength(callsBeforeRepeatedRemoval);
      expect(repeatedRemoval.some((event) => event.type === 'tool_start')).toBe(
        false,
      );
      const removalDone = repeatedRemoval.find(
        (event) => event.type === 'done',
      );
      if (removalDone?.type !== 'done')
        throw new Error('missing repeated-removal done event');
      expect(removalDone.data.message.content).toMatch(/декоратор/iu);
      expect(removalDone.data.message.content).toMatch(
        /уже исключен|уже исключена/iu,
      );
      expect(removalDone.data.message.content.length).toBeLessThan(160);
      expect(removalDone.data.message.attachments).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('search chat in MOCK mode — slot extraction and memory', () => {
  const doneText = (events: ChatStreamEvent[]): string => {
    const done = events.find((event) => event.type === 'done');
    if (done?.type !== 'done') throw new Error('missing done event');
    return done.data.message.content;
  };

  it('reads city, budget and category from one free-form message', async () => {
    const { chat, execute } = createHarness();
    const { sessionId } = await chat.createSession({ mode: 'search' });
    const events = await collect(
      chat.streamMessage(
        sessionId,
        'мне нужен банкет на 120 гостей в астане бютжет 2000000',
      ),
    );
    expect(events.some((event) => event.type === 'error')).toBe(false);
    const text = doneText(events);
    expect(text).not.toMatch(/в каком городе/i);
    expect(text).not.toMatch(/какой бюджет/i);
    expect(text).toContain('Астана');
    expect(text).toMatch(/2\s000\s000/u);
    expect(execute).not.toHaveBeenCalled();
  });

  it('keeps earlier slots across turns and runs the match once complete', async () => {
    const { chat, execute } = createHarness();
    const { sessionId } = await chat.createSession({ mode: 'search' });
    const first = await collect(
      chat.streamMessage(sessionId, 'Нужен ведущий в Алматы'),
    );
    expect(doneText(first)).not.toMatch(/в каком городе/i);
    const second = await collect(
      chat.streamMessage(
        sessionId,
        'на корпоратив 16 октября, бюджет 1 000 000',
      ),
    );
    expect(second.some((event) => event.type === 'error')).toBe(false);
    const toolStart = second.find((event) => event.type === 'tool_start');
    if (toolStart?.type !== 'tool_start') throw new Error('no tool_start');
    expect(toolStart.data.name).toBe('search_contractors');
    expect(toolStart.data.args).toMatchObject({
      city: 'Алматы',
      eventType: 'корпоратив',
      category: 'Ведущий',
      budgetKzt: 1_000_000,
    });
    expect(String(toolStart.data.args.date)).toMatch(/^\d{4}-10-16$/);
    expect(execute).toHaveBeenCalledWith(
      'search_contractors',
      expect.objectContaining({ city: 'Алматы' }),
    );
  });
});

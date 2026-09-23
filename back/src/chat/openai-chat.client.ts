import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

export interface ChatCompletionResult {
  content: string;
  toolCalls: ChatCompletionMessageToolCall[];
  assistantMessage: ChatCompletionAssistantMessageParam;
  tokensIn?: number;
  tokensOut?: number;
}

interface MockSlots {
  city?: string;
  date?: string;
  eventType?: string;
  category?: string;
  budgetKzt?: number;
  guests?: number;
  language?: string;
}

@Injectable()
export class OpenAiChatClient {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY')?.trim() ?? '';
    const mock = config.get<string>('MOCK') === '1' || apiKey === '';
    this.client = mock
      ? null
      : new OpenAI({ apiKey, timeout: 15_000, maxRetries: 1 });
    this.model = config.get<string>('MODEL_MAIN') || 'gpt-4o-mini';
  }

  async complete(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
    toolChoice: 'auto' | 'none' = 'auto',
  ): Promise<ChatCompletionResult> {
    if (!this.client) return this.mockCompletion(messages);

    const tokenLimit = this.model.startsWith('gpt-5')
      ? { max_completion_tokens: 400 }
      : { max_tokens: 400 };
    const temperature = this.model.startsWith('gpt-5')
      ? {}
      : { temperature: 0.3 };
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...(tools.length > 0 ? { tools, tool_choice: toolChoice } : {}),
      ...temperature,
      ...tokenLimit,
    });
    const message = response.choices[0]?.message;
    if (!message) throw new Error('OpenAI returned no message');
    const toolCalls = (message.tool_calls ?? []).filter(
      (
        call,
      ): call is Extract<ChatCompletionMessageToolCall, { type: 'function' }> =>
        call.type === 'function',
    );

    return {
      content: message.content ?? '',
      toolCalls,
      assistantMessage: {
        role: 'assistant',
        content: message.content,
        tool_calls: toolCalls,
      },
      tokensIn: response.usage?.prompt_tokens,
      tokensOut: response.usage?.completion_tokens,
    };
  }

  isMock(): boolean {
    return this.client === null;
  }

  private mockCompletion(
    messages: ChatCompletionMessageParam[],
  ): ChatCompletionResult {
    const toolMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'tool');
    if (toolMessage) {
      const result = this.parseJson(String(toolMessage.content));
      const text = this.mockFinalText(result);
      return this.textResult(text);
    }

    const systemText = String(
      messages.find((message) => message.role === 'system')?.content ?? '',
    );
    const mode = systemText.includes('ПОЛНЫЙ ПАКЕТ') ? 'bundle' : 'search';
    const userMessages = messages
      .filter((message) => message.role === 'user')
      .map((message) =>
        String(message.content).replace(/<\/?user_message>/g, ''),
      );
    // Session memory: every user turn is parsed on its own and merged in
    // order, so a later value replaces an earlier one but nothing known is
    // ever dropped just because the latest message did not repeat it.
    const parsed = userMessages.reduce<MockSlots>((known, message) => {
      const next = this.parseRequest(message);
      for (const [key, value] of Object.entries(next)) {
        if (value !== undefined)
          (known as Record<string, unknown>)[key] = value;
      }
      return known;
    }, {});

    const missing = this.missingSlotQuestion(parsed, mode);
    if (missing) return this.textResult(missing);

    const city = parsed.city as string;
    const date = parsed.date as string;
    const eventType = parsed.eventType as string;
    const budgetKzt = parsed.budgetKzt as number;
    if (mode === 'bundle') {
      const categories = this.bundleCategories(eventType);
      return this.toolResult('build_event_bundle', {
        city,
        date,
        eventType,
        totalBudgetKzt: budgetKzt,
        requiredCategories: categories.required,
        recommendedCategories: categories.recommended,
        ...(parsed.language ? { language: parsed.language } : {}),
      });
    }
    return this.toolResult('search_contractors', {
      city,
      date,
      eventType,
      category: parsed.category || 'Ведущий',
      budgetKzt,
      ...(parsed.language ? { language: parsed.language } : {}),
    });
  }

  private textResult(content: string): ChatCompletionResult {
    return {
      content,
      toolCalls: [],
      assistantMessage: { role: 'assistant', content },
    };
  }

  private toolResult(
    name: string,
    args: Record<string, unknown>,
  ): ChatCompletionResult {
    const toolCall: Extract<
      ChatCompletionMessageToolCall,
      { type: 'function' }
    > = {
      id: `mock_${name}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    };
    return {
      content: '',
      toolCalls: [toolCall],
      assistantMessage: {
        role: 'assistant',
        content: null,
        tool_calls: [toolCall],
      },
    };
  }

  private missingSlotQuestion(
    slots: MockSlots,
    mode: 'bundle' | 'search',
  ): string | null {
    const known: string[] = [];
    if (slots.city) known.push(slots.city);
    if (slots.eventType) known.push(slots.eventType);
    if (slots.category) known.push(slots.category.toLowerCase());
    if (slots.date) known.push(slots.date);
    if (slots.guests) known.push(`${slots.guests} гостей`);
    if (slots.budgetKzt)
      known.push(`бюджет ${slots.budgetKzt.toLocaleString('ru-RU')} ₸`);
    const prefix = known.length > 0 ? `Понял: ${known.join(', ')}. ` : '';

    let question: string | null = null;
    if (!slots.city) {
      question =
        'В каком городе планируется мероприятие: Алматы, Астана или Зарубежье?';
    } else if (!slots.eventType) {
      question =
        'Какое мероприятие планируется: свадьба, той, корпоратив, конференция, юбилей или день рождения?';
    } else if (mode === 'search' && !slots.category) {
      question =
        'Какой подрядчик нужен: ведущий, банкетный зал, фотограф, видеограф, декоратор, флорист, лайв-бэнд?';
    } else if (!slots.date) {
      question =
        'На какую дату запланировано мероприятие? Например: 16 октября или 2026-10-16.';
    } else if (!slots.budgetKzt) {
      question = 'Какой бюджет вы планируете в тенге?';
    }
    return question ? `${prefix}${question}` : null;
  }

  private parseRequest(text: string): MockSlots {
    let rest = text
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[\u00a0\u202f]/g, ' ');

    // Date first, and strip it so its digits never become a budget.
    const date = this.extractDate(rest);
    if (date) rest = rest.replace(date.raw, ' ');

    let guests: number | undefined;
    const guestMatch = rest.match(
      /(\d[\d ]*)\s*(?:гост[а-я]*|человек[а-я]*|чел\.?|персон[а-я]*|guests?|people|pax)/,
    );
    if (guestMatch) {
      guests = Number(guestMatch[1].replace(/\s/g, ''));
      rest = rest.replace(guestMatch[0], ' ');
    }

    const city = /алмат[ыаеу]|алма-?ат|almaty|alma-?ata/.test(rest)
      ? 'Алматы'
      : /астан[аеуыо]|нур-?султан|astana|nur-?sultan/.test(rest)
        ? 'Астана'
        : /зарубеж|за рубеж|за границ|abroad/.test(rest)
          ? 'Зарубежье'
          : undefined;

    const eventRules: [RegExp, string][] = [
      [/свад|wedding/, 'свадьба'],
      [/корпоратив|корпорат|corporate/, 'корпоратив'],
      [/конференц|conference/, 'конференция'],
      [/юбиле|anniversary/, 'юбилей'],
      [/(?:день|дня|дне|днем) рожд|birthday/, 'день рождения'],
      [/(?<![а-я])(?:той|тоя|тою|тоем|тойға|тойга)(?![а-я])/, 'той'],
    ];
    const eventType = eventRules.find(([re]) => re.test(rest))?.[1];

    const categoryRules: [RegExp, string][] = [
      [/ведущ[а-я]* церемон/, 'Ведущий церемонии'],
      [/ансамбл/, 'Национальный ансамбль'],
      [/танц/, 'Танцевальный коллектив'],
      [/шоу/, 'Шоу-программа'],
      [/загородн/, 'Загородная площадка'],
      [/ресторан/, 'Ресторан'],
      [/отел/, 'Отель'],
      [
        /банкет|(?<![а-я])зал(?:а|у|е|ом|ы|ов)?(?![а-я])|venue|hall/,
        'Банкетный зал',
      ],
      [/ведущ|тамад|(?<![a-z])(?:host|mc)(?![a-z])/, 'Ведущий'],
      [/фото|photo/, 'Фотограф'],
      [/видео|video/, 'Видеограф'],
      [/декор|оформлен/, 'Декоратор'],
      [/флорист|цвет|букет|florist|flower/, 'Флорист'],
      [/инструментал|саксофон|скрипач|пианист/, 'Инструменталист'],
      [/лайв|live|бэнд|бенд|band|групп|музыкант|кавер/, 'Лайв-бэнд'],
    ];
    const category = categoryRules.find(([re]) => re.test(rest))?.[1];

    const budgetKzt = this.extractBudget(rest);

    const language = /казах/i.test(text)
      ? 'Казахский'
      : /англ/i.test(text)
        ? 'Английский'
        : /рус/i.test(text)
          ? 'Русский'
          : undefined;
    return {
      city,
      date: date?.iso,
      eventType,
      category,
      budgetKzt,
      guests,
      language,
    };
  }

  private extractDate(text: string): { raw: string; iso: string } | undefined {
    const build = (
      raw: string,
      day: number,
      month: number,
      yearRaw?: string,
    ): { raw: string; iso: string } | undefined => {
      if (month < 0 || month > 11 || day < 1 || day > 31) return undefined;
      const now = new Date();
      let year = yearRaw
        ? Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw)
        : now.getFullYear();
      if (
        !yearRaw &&
        Date.UTC(year, month, day) <
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
      ) {
        year++;
      }
      const date = new Date(Date.UTC(year, month, day));
      if (date.getUTCDate() !== day || date.getUTCMonth() !== month)
        return undefined;
      return { raw, iso: date.toISOString().slice(0, 10) };
    };

    const iso = text.match(/(?<!\d)(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/);
    if (iso) return build(iso[0], Number(iso[3]), Number(iso[2]) - 1, iso[1]);

    const months = [
      'январ',
      'феврал',
      'март',
      'апрел',
      'ма[йя]',
      'июн',
      'июл',
      'август',
      'сентябр',
      'октябр',
      'ноябр',
      'декабр',
    ];
    const named = text.match(
      new RegExp(
        `(?<!\\d)([0-3]?\\d)\\s*(${months.join('|')})[а-я]*(?:\\s+(\\d{4}))?`,
      ),
    );
    if (named) {
      const month = months.findIndex((m) => new RegExp(`^${m}`).test(named[2]));
      return build(named[0], Number(named[1]), month, named[3]);
    }

    const dotted = text.match(
      /(?<![\d.,])([0-3]?\d)[./]([01]?\d)(?:[./](\d{4}|\d{2}))?(?![\d.,])(?!\s*(?:млн|миллион|тыс|k|к|m)(?![а-я]))/,
    );
    if (dotted)
      return build(
        dotted[0],
        Number(dotted[1]),
        Number(dotted[2]) - 1,
        dotted[3],
      );
    return undefined;
  }

  private extractBudget(text: string): number | undefined {
    const num = '(\\d{1,3}(?:[ .,]\\d{3})+|\\d+(?:[.,]\\d+)?)';
    const unit =
      '(млрд|млн\\.?|миллион[а-я]*|mln|тыс\\.?|тысяч[а-я]*|к(?![а-я])|k(?![a-z]))';
    const currency = '(?:₸|тг|тенге|kzt)';
    const toAmount = (raw: string, scale?: string): number => {
      let value = /^\d{1,3}(?:[ .,]\d{3})+$/.test(raw)
        ? Number(raw.replace(/[ .,]/g, ''))
        : Number(raw.replace(',', '.'));
      if (scale) {
        if (scale.startsWith('млрд')) value *= 1_000_000_000;
        else if (/^(млн|миллион|mln)/.test(scale)) value *= 1_000_000;
        else value *= 1_000;
      }
      return Math.round(value);
    };
    const valid = (value: number): boolean =>
      Number.isFinite(value) && value >= 10_000;
    const collect = (re: RegExp): number[] =>
      [...text.matchAll(re)].map((m) => toAmount(m[1], m[2])).filter(valid);

    // 1) keyword-led: "бюджет 2 000 000", "бютжет 2 млн", "до 500к"
    const keyed = collect(
      new RegExp(
        `(?:бюджет[а-я]*|бютжет[а-я]*|budget|(?<![а-я])до|(?<![а-я])за)\\s*[:\\-–—]?\\s*${num}\\s*${unit}?`,
        'g',
      ),
    );
    if (keyed.length > 0) return keyed.at(-1);

    // 2) unit/currency-led: "2 млн тенге", "500 тыс", "1 000 000 ₸"
    const united = [
      ...collect(new RegExp(`${num}\\s*${unit}`, 'g')),
      ...collect(new RegExp(`${num}\\s*()${currency}`, 'g')),
    ];
    if (united.length > 0) return united.at(-1);

    // 3) a bare big number with no other meaning in this message
    return collect(new RegExp(`${num}()`, 'g')).at(-1);
  }

  private bundleCategories(eventType: string): {
    required: string[];
    recommended: string[];
  } {
    const map: Record<string, { required: string[]; recommended: string[] }> = {
      свадьба: {
        required: ['Ведущий', 'Банкетный зал', 'Фотограф', 'Декоратор'],
        recommended: ['Флорист', 'Видеограф', 'Ведущий церемонии', 'Лайв-бэнд'],
      },
      той: {
        required: ['Ведущий', 'Банкетный зал', 'Национальный ансамбль'],
        recommended: ['Декоратор', 'Флорист', 'Танцевальный коллектив'],
      },
      корпоратив: {
        required: ['Ведущий', 'Банкетный зал', 'Фотограф'],
        recommended: ['Лайв-бэнд', 'Видеограф', 'Шоу-программа'],
      },
      конференция: {
        required: ['Банкетный зал', 'Ведущий'],
        recommended: ['Фотограф', 'Видеограф'],
      },
      юбилей: {
        required: ['Ведущий', 'Банкетный зал'],
        recommended: ['Фотограф', 'Лайв-бэнд', 'Декоратор', 'Флорист'],
      },
      'день рождения': {
        required: ['Ведущий', 'Банкетный зал'],
        recommended: ['Фотограф', 'Лайв-бэнд', 'Декоратор', 'Флорист'],
      },
    };
    return map[eventType] ?? map.свадьба;
  }

  private parseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private mockFinalText(result: unknown): string {
    if (!result || typeof result !== 'object') {
      return 'Подбор завершён. Результат прикреплён к сообщению.';
    }
    if ('cards' in result && Array.isArray(result.cards)) {
      const names = result.cards
        .map((card) =>
          card && typeof card === 'object' && 'anonName' in card
            ? String(card.anonName)
            : '',
        )
        .filter(Boolean);
      if (names.length === 0) {
        const summary =
          'summary' in result
            ? String(result.summary)
            : 'Подходящих вариантов нет.';
        return `${summary} Попробуйте изменить дату, бюджет или категорию.`;
      }
      return `Нашёл подходящих подрядчиков: ${names.join(', ')}. В карточках — проверенные причины выбора.`;
    }
    if ('required' in result) {
      return 'Собрал полный пакет мероприятия. Результаты по обязательным и рекомендуемым категориям прикреплены ниже.';
    }
    return 'Подбор завершён. Результат прикреплён к сообщению.';
  }
}

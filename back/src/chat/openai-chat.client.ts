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
    const combined = userMessages.join('\n');
    const parsed = this.parseRequest(combined);
    const ready =
      parsed.city &&
      parsed.date &&
      parsed.eventType &&
      parsed.budgetKzt &&
      (mode === 'bundle' || parsed.category);

    if (!ready && userMessages.length === 1) {
      return this.textResult(
        'В каком городе планируется мероприятие: Алматы, Астана или Зарубежье?',
      );
    }
    if (!ready && userMessages.length === 2) {
      return this.textResult(
        'На какую дату запланировано мероприятие? Укажите её в формате YYYY-MM-DD.',
      );
    }
    if (!ready && userMessages.length === 3) {
      return this.textResult('Какой общий бюджет вы планируете в тенге?');
    }

    const city = parsed.city || 'Алматы';
    const date = parsed.date || '2026-10-10';
    const eventType = parsed.eventType || 'свадьба';
    const budgetKzt = parsed.budgetKzt || 1_000_000;
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

  private parseRequest(text: string): {
    city?: string;
    date?: string;
    eventType?: string;
    category?: string;
    budgetKzt?: number;
    language?: string;
  } {
    const city = ['Алматы', 'Астана', 'Зарубежье'].find((value) =>
      new RegExp(value, 'i').test(text),
    );
    const eventType = [
      'свадьба',
      'той',
      'корпоратив',
      'конференция',
      'юбилей',
      'день рождения',
    ].find((value) => new RegExp(value, 'i').test(text));
    const categories = [
      'Ведущий церемонии',
      'Национальный ансамбль',
      'Танцевальный коллектив',
      'Банкетный зал',
      'Шоу-программа',
      'Ведущий',
      'Фотограф',
      'Видеограф',
      'Декоратор',
      'Флорист',
      'Лайв-бэнд',
    ];
    const category = categories.find((value) =>
      new RegExp(value, 'i').test(text),
    );
    const date = text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    const currencyBudgets = [
      ...text.matchAll(/\b(\d[\d\s]{3,})\s*(?:₸|тг|тенге)\b/gi),
    ];
    const plainNumbers = [...text.matchAll(/\b(\d[\d\s]{3,})\b/g)];
    const budgetMatch = currencyBudgets.at(-1)?.[1] ?? plainNumbers.at(-1)?.[1];
    const budgetKzt = budgetMatch
      ? Number(budgetMatch.replace(/\s/g, ''))
      : undefined;
    const language = /казах/i.test(text)
      ? 'Казахский'
      : /англ/i.test(text)
        ? 'Английский'
        : /рус/i.test(text)
          ? 'Русский'
          : undefined;
    return { city, date, eventType, category, budgetKzt, language };
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

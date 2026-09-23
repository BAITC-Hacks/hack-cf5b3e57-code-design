import type { ChatCompletionTool } from 'openai/resources/chat/completions';

const cities = ['Алматы', 'Астана', 'Зарубежье'];
const eventTypes = [
  'свадьба',
  'той',
  'корпоратив',
  'конференция',
  'юбилей',
  'день рождения',
];

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_contractors',
      description: 'Найти до трёх подрядчиков одной категории.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', enum: cities },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          eventType: { type: 'string', enum: eventTypes },
          category: { type: 'string' },
          budgetKzt: { type: 'integer' },
          durationHours: { type: 'integer' },
          language: { type: 'string' },
        },
        required: ['city', 'date', 'eventType', 'category', 'budgetKzt'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'build_event_bundle',
      description: 'Собрать полный пакет подрядчиков для мероприятия.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', enum: cities },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          eventType: { type: 'string', enum: eventTypes },
          totalBudgetKzt: { type: 'integer' },
          requiredCategories: { type: 'array', items: { type: 'string' } },
          recommendedCategories: { type: 'array', items: { type: 'string' } },
          language: { type: 'string' },
        },
        required: [
          'city',
          'date',
          'eventType',
          'totalBudgetKzt',
          'requiredCategories',
        ],
        additionalProperties: false,
      },
    },
  },
];

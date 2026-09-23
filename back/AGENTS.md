# AGENTS.md — back/

> Читай ПОСЛЕ корневого [../AGENTS.md](../AGENTS.md). Здесь — только специфика бек-подпроекта.

## Что это

NestJS 11 + Prisma 6 + PostgreSQL 16. Слушает `PORT=3001`. Отвечает по `/api/v1/*` согласно контракту в [../shared/contract.ts](../shared/contract.ts).

## Локальный запуск

```bash
# из корня
docker compose up -d postgres

# из back/
npm install --legacy-peer-deps        # если ещё не
npx prisma migrate deploy             # применить миграции
npx prisma db seed                    # залить 66 подрядчиков
npm run start:dev                     # nest в watch
```

Проверка перед коммитом:

```bash
npm run build           # tsc должен пройти
npx prisma db seed      # идемпотентно, всегда 66
```

## Модули

```
back/src/
├── prisma/             PrismaModule, PrismaService (глобально)
├── matching/           основной модуль задачи
│   ├── dto/            class-validator DTO для входа
│   ├── types.ts        внутренние типы бекa
│   ├── filter.service.ts     детерминированный фильтр (код)
│   ├── ranking.service.ts    детерминированное ранжирование (код)
│   ├── explainer.service.ts  объяснение + кэш в БД
│   ├── critic.service.ts     проверка объяснений
│   ├── matching.service.ts   оркестратор пайплайна
│   ├── matching.controller.ts    POST /match + SSE /match/stream
│   └── llm/            LlmClient интерфейс + NvidiaLlmClient + MockLlmClient
├── enrichment/         офлайн-скрипт агент → Enrichment (запускается разово)
└── app.module.ts
```

Правила:
- **Логика решения — в коде**, не в LLM. Фильтр и ранжирование строго детерминированные. LLM — только объяснение и критик.
- **Кэш объяснений** в `ExplanationCache` по `(requestHash, contractorId)`. Гарантирует, что повторный запуск с теми же параметрами даёт тот же текст.
- Каждый шаг пайплайна эмитит SSE-событие (см. типы в контракте). Клиент видит таймлайн.
- Все LLM-вызовы через `LlmClient`. Реальный провайдер и MOCK за одним интерфейсом.

## Prisma

- Схема — [prisma/schema.prisma](prisma/schema.prisma). Три модели: `Contractor`, `Enrichment`, `ExplanationCache`.
- Массивы (`categories`, `eventFormats`, `languages`, `busyDates`) — нативные Postgres `String[]`. Фильтр использует `.has()` / `.hasSome()` — не грузим всё в память.
- Миграции коммитим (`prisma/migrations/`). Reset БД — **только с явного разрешения человека**, никогда не в проде.
- Сид: [prisma/seed.ts](prisma/seed.ts), идемпотентный, 66 строк из [prisma/seed-data/contractors.csv](prisma/seed-data/contractors.csv).

## LLM: NVIDIA NIM

- Base URL: `https://integrate.api.nvidia.com/v1` — OpenAI-совместимый, используем `openai` SDK с `baseURL` override.
- Chat model: рекомендация — `meta/llama-3.3-70b-instruct` или `nvidia/llama-3.1-nemotron-70b-instruct`. Точное имя — через env `MODEL_MAIN`.
- Embeddings: `nvidia/nv-embedqa-e5-v5` (если включим второй этап).
- Ключ: `NVIDIA_API_KEY` в `.env`. Никогда не в коде, никогда в коммит.

### MOCK-режим

Включён, если `MOCK=1` ИЛИ `NVIDIA_API_KEY` пуст. `MockLlmClient` возвращает шаблонные ответы из фактов пайплайна с задержкой 200–400мс. **Пайплайн должен полностью проходить в MOCK** — жюри увидит демо без сети.

## Endpoints

Согласно контракту:

- `POST   /api/v1/match`         — синхронный, `MatchRequest` → `MatchResponse`.
- `GET    /api/v1/match/stream`  — SSE, query = `MatchRequest`. События: `criteria` → `filter_step*` → `ranked` → `card*` → `critic` → `done`.
- `GET    /api/v1/contractors/:id` — полный профиль (опционально, для деталей).
- `GET    /api/v1/health`        — `{ ok: true, mock: boolean }`.

Валидация — `class-validator` через глобальный `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).

## Что НЕ делаем в беке

- Не роняем LLM-провал: если NVIDIA не ответила / timeout — падаем в MOCK на этот вызов, а не 500. Пайплайн должен доехать до `done`.
- Не считаем эмбеддинги в hot path: только офлайн, результат кешируется в `Enrichment`.
- Не кладём бизнес-логику в контроллер: только парсинг/валидация → `MatchingService`.

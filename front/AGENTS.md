# AGENTS.md — front/

> Читай ПОСЛЕ корневого [../AGENTS.md](../AGENTS.md). Здесь — только фронт-специфика.

## Что это

Next.js (App Router) + TypeScript strict + TailwindCSS. Слушает `PORT=3000`. Ходит в бек по `/api/v1/*` (см. `NEXT_PUBLIC_API_URL`, по умолчанию `http://localhost:3001`).

## Два экрана (из SCOPE)

- `/` — **витрина заказчика**: форма (город, дата, тип мероприятия, категория, бюджет, ± длительность, ± язык) → до 3 карточек. Каждая карточка: имя, категория, город, цена, 1–2 предложения объяснения, факты с ✓/⊙, бейджи `synthetic` / `city imputed` / `price imputed`. Плашка исхода и «почему меньше трёх».
- `/manager` — **рабочее место менеджера**: тот же запрос + таймлайн шагов пайплайна (стримится по SSE), воронка отсева, проверка фактов по каждой карточке, кнопка «сравнить с другой датой».

Синхронный вариант (`POST /api/v1/match`) — для `/`. SSE (`GET /api/v1/match/stream`) — для `/manager`.

## Контракт — единственный источник правды

Все типы запросов, ответов, SSE-событий и справочники (города, форматы, категории, языки) — из `../shared/contract.ts`:

```ts
import type {
  MatchRequest,
  MatchResponse,
  MatchCard,
  FunnelStep,
  SseEventMap,
} from '../../shared/contract';
import { CITIES, EVENT_FORMATS, CATEGORIES, LANGUAGES } from '../../shared/contract';
```

Никаких своих типов, повторяющих контракт. Изменить контракт — только через PR с апрувом обеих сторон.

## Локальный запуск

```bash
# из front/
npm install
npm run dev
# UI на http://localhost:3000
```

Бек должен быть поднят на `:3001` (через `docker compose up -d` или локально).

Перед коммитом:

```bash
npm run lint && npm run build
```

## Что показать жюри (DoD)

- Пустой результат — **словами**, не пустым экраном и не ошибкой. Три исхода различимы явно: `found` / `no_category_in_city` / `all_filtered_out`.
- Объяснения не взаимозаменяемы: карточки одного запроса нельзя перепутать между собой.
- Один и тот же запрос на две разные даты → разная выдача, и в объяснении видно, что дело в занятости.
- Стриминг шагов в `/manager` — жюри должен ВИДЕТЬ, что происходит в пайплайне.

## Что НЕ делаем на фронте

- Не дублируем логику фильтра/ранжирования — это всё бек.
- Не хардкодим список категорий/городов/форматов: берём из `shared/contract.ts`.
- Красивый UI не важнее объяснений: если выбор — оформление или ясная плашка про пустой результат, берём ясность.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

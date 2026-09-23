# shared/

Единый источник правды между `front/` и `back/`.

## Что здесь

- **`contract.ts`** — API-контракт: типы запроса/ответа, SSE-события,
  справочники и DTO защищённой админ-панели. Импортится из обеих сторон.

## Как импортить

Из `back/` (Nest, tsconfig в `back/tsconfig.json`):

```ts
import type { MatchRequest, MatchResponse } from '../../shared/contract';
```

Из `front/` (Next, App Router):

```ts
import type { MatchRequest, MatchResponse } from '../../shared/contract';
```

## Правила

1. **Никаких зависимостей** здесь: только чистые TS-типы и `as const`-массивы.
2. Изменение контракта — только через PR с апрувом обоих подпроектов.
3. Тип поля меняется — сначала правим `contract.ts`, потом обе стороны, коммитим одним PR.

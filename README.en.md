# ToiMatch — evidence-based event contractor matching

> HackAlem AI 2026 · track 06 "Creative Industries" · Firebird task "Smart Contractor Matching" (#79-lite) · team Code & Design (Yan Pinchuk, Nikita Kostrov, Ivan Lysov)

[Русский](README.md) · [Қазақша](README.kk.md) · **English**

**Backup demo video (2:36):** [docs/demo/toimatch-demo.mp4](docs/demo/toimatch-demo.mp4) — the full check scenario with captions (Russian UI).

## How to run
You only need Docker (with Docker Compose v2). No keys required.

```bash
git clone https://github.com/BAITC-Hacks/hack-cf5b3e57-code-design.git
cd hack-cf5b3e57-code-design
docker compose up --build
```

One command starts PostgreSQL, applies migrations, loads the seed (66 contractors), and starts the API and the frontend. The first build takes a few minutes.

- Website: http://localhost:3000 (matching — http://localhost:3000/match)
- API: http://localhost:3001/api/v1/health → `{"ok":true,"mock":true}`

To stop and wipe the database: `docker compose down -v`.

### Example environment variables
Everything works without a `.env` file. To use a live model, copy [`.env.example`](.env.example) to `.env` in the project root (the file is in `.gitignore`), add your key, and set `MOCK=0`. The command is the same: `docker compose up --build`.

```env
# .env.example (project root, for Docker Compose)
MOCK=1                      # 1 — no model; 0 — OpenAI (key required)
OPENAI_API_KEY=             # optional
MODEL_MAIN=gpt-4o-mini
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For running without Docker there are separate examples: [`back/.env.example`](back/.env.example) and [`front/.env.example`](front/.env.example).

```env
# back/.env.example
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/hackaton?schema=public"
PORT=3001
MOCK=1
OPENAI_API_KEY=
MODEL_MAIN=gpt-4o-mini

# front/.env.example
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**By default Docker runs without a key (`MOCK=1`)**: explanations are built deterministically from the same verified facts, and no network access is needed. For a live model, pass `OPENAI_API_KEY` through the environment and set `MOCK=0`; never commit the key to the repository.

### Running with a live model (optional)
Requires Node.js 22+. The database stays in Docker; the backend and frontend run locally:

```bash
docker compose up -d postgres
cd back
cp .env.example .env        # set OPENAI_API_KEY and MOCK=0
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev           # API at http://localhost:3001
```

In a second terminal:
```bash
cd front
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### Environment variables
| Variable | Where | Purpose | Required |
|---|---|---|---|
| `DATABASE_URL` | `back/.env` | PostgreSQL connection | yes, value from `back/.env.example` |
| `PORT` | `back/.env` | API port | no, 3001 |
| `OPENAI_API_KEY` | `back/.env` / Compose environment | live model explanations and chat when `MOCK=0` | **no** — MOCK works without a key |
| `MODEL_MAIN` | `back/.env` | OpenAI model | no, `gpt-4o-mini` |
| `MOCK` | `back/.env` / compose | `1` — force no model; `0` with a key — OpenAI | no; `1` by default in Docker |
| `BACKEND_URL` | `front/.env.local` | API address for the Next.js server | no, `http://localhost:3001` (in Docker — `http://backend:3001`) |
| `NEXT_PUBLIC_API_URL` | `front/.env.local` | API address for the browser (stream on `/manager`) | no, `http://localhost:3001` |

There are no real keys in the repository: `.env` and `.env.local` are in `.gitignore`; the repository contains only `.env.example`, `back/.env.example` and `front/.env.example`.

## The problem and who it is for
An event client in Kazakhstan opens a catalog of contractors in their city and drowns in similar-looking profiles: the descriptions are all alike ("charisma", "top 10"), and it is unclear what to trust or what to look at. A venue manager manually puts together 3 options for the client and explains the choice.

**Value in numbers.**
- *Time.* Today, for a single request, a manager opens 10–50 profiles in the category for the city and checks each one's calendar, price, event format and language. By our estimate this takes tens of minutes. ToiMatch responds in 15–250 ms (measured in no-key mode) and immediately shows why each option was chosen and who was filtered out.
- *Who benefits.* The client, who chooses faster, and the venue or agency, which can offer matching as a service to its clients. The catalog gets honest results: the service does not show unavailable or unsuitable contractors.

Given a city, date, event type, category and budget, ToiMatch returns **up to three contractors**, each with an **explanation of why this one**. First the service tells you **what to look for** in this case (hosting language, experience with this format, hours on site), then explains each card against those points, and every fact in an explanation is checked against the catalog data.

## What is implemented
- Matching `POST /api/v1/match`: fact-based filtering, deterministic ranking, explanations, three explicit outcomes: `found`, `no_category_in_city`, `all_filtered_out`.
- Step-by-step pipeline stream `GET /api/v1/match/stream` (SSE) for the venue screen.
- Catalog `GET /api/v1/contractors` with filters, and profile `GET /api/v1/contractors/:id`.
- Explanation cache in PostgreSQL: same request — same text and order.
- Chat with search mode and full event package mode: before building a package it calculates the minimum budget, honestly shows empty categories, and takes the final names and reasons from tool results rather than from free-form model text.
- No-key mode (MOCK): the whole scenario works without network access and without our accounts.
- Frontend (Next.js): catalog `/`, matching `/match`, venue workspace `/manager` (the old `/admin` address redirects there), profile `/contractor/[id]`, chat assistant `/chat`; interface in Russian, Kazakh and English; Nurlan the mascot assistant.

## How it works — from request to result
1. The client chooses who they need (category), city, date, event and budget; duration and language are optional.
2. **Filter (code):** city → category → available on this date → takes this format → within budget → language → hours. At each step we count how many candidates dropped out and why (the funnel).
3. **Ranking (code):** deterministic order by measurable request criteria, ties broken by `id`.
4. **Explanations:** the server builds verifiable reason options from catalog fields, differences from the other cards, and exact excerpts from profiles. OpenAI picks the best-fitting option but does not write free text about the contractor; without a key the choice is deterministic.
5. **Fact check (code):** each reason is checked against the selected card before it is shown and cached. Substituted prices and quotes from descriptions are clearly marked; an unverified explanation is replaced with a safe option.
6. **Response:** the outcome, up to three cards, the funnel, and a plain-language "why this many" sentence.

## Technologies, models and APIs
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Onest font.
- Backend: NestJS 11, Prisma 6, PostgreSQL 16, Docker Compose.
- LLM: OpenAI `gpt-4o-mini` (the `MODEL_MAIN` variable) picks the explanation option and takes part in verification; without a key — a deterministic client (`back/src/matching/llm/mock-llm.client.ts`). The final text is always built by the server from verified data.
- Images: contractor photos and the mascot were generated with OpenAI `gpt-image-2`; mascot animation — fal.ai (Kling v3); logo — fal.ai (Recraft V4.1, SVG).
- Shared frontend/backend type contract: [`shared/contract.ts`](shared/contract.ts).

## Architecture
```
Browser (Next.js: /, /match, /manager, /contractor/[id], /chat)
   │  POST /api/v1/match          GET /api/v1/match/stream (SSE)      GET /api/v1/contractors
   ▼
NestJS (back/src/matching)
   ├─ FilterService     — filter and funnel (deterministic)
   ├─ RankingService    — ordering, tie-break by id
   ├─ ExplainerService  — verifiable explanation options, critic, cache
   └─ LlmClient         — OpenAI or MockLlmClient (no key)
   ▼
PostgreSQL (Prisma): contractors · enrichments · explanation_cache
```

## Screens
**Matching `/match`** — request 1: three cards, each with its own explanation and verified facts.

![Matching result on /match](docs/screenshots/match.jpg)

**Venue workspace `/manager`** — the same request: step-by-step decision stream and the filtering funnel.

![Decision stream and funnel on /manager](docs/screenshots/manager.jpg)

## How to test (jury scenario)
All requests work without a key. Buttons with these examples are available on the `/match` page.

| # | Request | Expected result |
|---|---|---|
| 1 | Host · Almaty · corporate event · 16.10.2026 · up to 1,000,000 ₸ | `found`: 3 cards out of 4 matches; funnel 10 → 5 available → 5 take corporate events → 4 within budget |
| 1b | Same, on 23.10.2026 | A different top three: some hosts are booked on 23.10 |
| 2 | Florist · Almaty · wedding · 15.10.2026 · up to 300,000 ₸ | `found`, fewer than three: there are only 2 florists in Almaty |
| 3a | Live band · Astana · wedding · 14.11.2026 · up to 1,500,000 ₸ | `no_category_in_city`: there are no live bands in Astana |
| 3b | Decorator · Almaty · toi · 14.11.2026 · up to 3,000,000 ₸ | `all_filtered_out`: all 3 are booked on 14.11 and none of them decorates a toi |

Re-running the same request in MOCK mode returns the same order and the same texts. Each card shown has an individual reason with verifiable date and price information; a profile excerpt is labeled «со слов подрядчика» ("according to the contractor"), and a substituted price is labeled «ценовой ориентир» ("price guide"). An empty city/category and filtering out after the filters are distinguished in `outcome` and in the response text.

The venue screen `/manager` shows the same matching step by step (the funnel in real time) and a table: each explanation fact → catalog field → ✓.

## Data and integrations
- Catalog: the organizers' dataset — 66 anonymized profiles, 13 of them synthetic (`synthetic: true`), availability calendar 23.09–31.12.2026. Loaded by the seed from [`back/prisma/seed-data/contractors.csv`](back/prisma/seed-data/contractors.csv). Cards mark synthetic profiles, as well as prices and cities filled in during dataset preparation.
- External API: OpenAI only (if a key is set). Example request:

```http
POST /api/v1/match
Content-Type: application/json

{"city":"Алматы","date":"2026-10-15","eventType":"свадьба","category":"Флорист","budgetKzt":300000}
```
The response contains `outcome`, `summary`, `criteria`, up to three `cards` with individual `reason`, `factsUsed` and data reliability flags, plus a `funnel` with the reasons for filtering at each step.

> Note: request values use the catalog's Russian identifiers, and response examples are shown as returned by the service (text in Russian).

## What we used off the shelf
- Open-source libraries: Next.js (MIT), React (MIT), Tailwind CSS (MIT), NestJS (MIT), Prisma (Apache-2.0), class-validator (MIT), Onest (SIL OFL).
- Contractor dataset — from the organizers (Firebird).
- **Contractor photos are AI-generated** (OpenAI gpt-image-2), the people are fictional; on the website each photo is labeled as an AI illustration («Фото: ИИ-иллюстрация»).
- Nurlan the mascot — AI-generated (gpt-image-2), animation — fal.ai (Kling v3); logo — fal.ai (Recraft V4.1).
- AI development tools: Claude Code and OpenAI Codex. All solution code was written on 23.09.2026 starting at 13:00 — this is visible in the commit history.

## Limitations
- Without a key, explanations are chosen deterministically from verified options; with a key, OpenAI helps pick an option, falling back to a safe choice on failure.
- The interface is fully available in Russian, Kazakh and English. Explanations are complete in Russian. In Kazakh and English, the final sentences still contain Russian category and city names and dates in YYYY-MM-DD format.
- By default Docker runs without a model; for a live model, pass the key through the environment and set `MOCK=0`.
- No booking, payments, authentication or notifications — these are out of scope.
- The catalog is small (66 profiles), so in rare categories we honestly show fewer than three.

## Live version
There is no deployed version: the jury runs the project locally with a single command, `docker compose up --build` (see "How to run").

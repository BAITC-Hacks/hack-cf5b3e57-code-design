import assert from "node:assert/strict";

const apiBase = (process.env.API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const frontBase = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function readJson(url, options) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json();
  assert.equal(response.status, 200, `${url}: ${JSON.stringify(body)}`);
  return body;
}

async function match(name, request, expectedOutcome, expectedCount) {
  const started = performance.now();
  const result = await readJson(`${apiBase}/api/v1/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const elapsedMs = Math.round(performance.now() - started);

  assert.equal(result.outcome, expectedOutcome, `${name}: outcome`);
  assert.equal(result.cards.length, expectedCount, `${name}: card count`);
  assert.ok(result.cards.length <= 3, `${name}: more than three cards`);
  assert.ok(elapsedMs < 10_000, `${name}: exceeded the 10-second demo limit`);
  for (const card of result.cards) {
    assert.ok(card.id && card.anonName && card.reason?.trim(), `${name}: incomplete card`);
  }
  assert.equal(
    new Set(result.cards.map((card) => card.reason)).size,
    result.cards.length,
    `${name}: interchangeable explanations`,
  );
  console.log(`PASS ${name}: ${result.outcome}, ${result.cards.length} card(s), ${elapsedMs} ms`);
  return result;
}

async function main() {
  const health = await readJson(`${apiBase}/api/v1/health`);
  assert.equal(health.ok, true);
  console.log(`PASS backend health: mock=${health.mock}`);

  const catalog = await readJson(`${apiBase}/api/v1/contractors?limit=1`);
  assert.equal(catalog.total, 66, "catalog must contain 66 contractors");
  console.log("PASS catalog: 66 contractors");

  const page = await fetch(`${frontBase}/match`, {
    signal: AbortSignal.timeout(12_000),
  });
  assert.equal(page.status, 200, "frontend /match unavailable");
  assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  console.log("PASS frontend: /match HTTP 200");

  const hostRequest = {
    city: "Алматы",
    date: "2026-10-16",
    eventType: "корпоратив",
    category: "Ведущий",
    budgetKzt: 1_000_000,
  };
  const firstDate = await match("dense category · 16 October", hostRequest, "found", 3);
  const repeated = await match("same request again", hostRequest, "found", 3);
  assert.deepEqual(
    repeated.cards.map(({ id, reason }) => ({ id, reason })),
    firstDate.cards.map(({ id, reason }) => ({ id, reason })),
    "same request must preserve order and explanations",
  );
  console.log("PASS deterministic order and explanations");

  const secondDate = await match(
    "dense category · 23 October",
    { ...hostRequest, date: "2026-10-23" },
    "found",
    3,
  );
  assert.notDeepEqual(
    secondDate.cards.map((card) => card.id),
    firstDate.cards.map((card) => card.id),
    "changing the date must change the recommended trio",
  );
  for (const result of [firstDate, secondDate]) {
    for (const card of result.cards) {
      const dateFact = card.factsUsed?.find((fact) => fact.key === "date");
      const dateLabel = dateFact?.label?.match(/\d{1,2}.*$/u)?.[0];
      assert.equal(dateFact?.verified, true, `${card.id}: date is not verified`);
      assert.ok(dateLabel && card.reason.includes(dateLabel), `${card.id}: date missing from reason`);
      assert.match(card.reason, /свобод|бос|available/iu, `${card.id}: availability not explained`);
    }
  }
  console.log("PASS date changes the selected contractors");

  await match(
    "rare category",
    {
      city: "Алматы",
      date: "2026-10-15",
      eventType: "свадьба",
      category: "Флорист",
      budgetKzt: 300_000,
    },
    "found",
    2,
  );
  await match(
    "category missing in city",
    {
      city: "Астана",
      date: "2026-11-14",
      eventType: "свадьба",
      category: "Лайв-бэнд",
      budgetKzt: 1_500_000,
    },
    "no_category_in_city",
    0,
  );
  await match(
    "all candidates unavailable",
    {
      city: "Алматы",
      date: "2026-11-14",
      eventType: "той",
      category: "Декоратор",
      budgetKzt: 3_000_000,
    },
    "all_filtered_out",
    0,
  );
}

main().catch((error) => {
  console.error("FAIL smoke test:", error);
  process.exitCode = 1;
});

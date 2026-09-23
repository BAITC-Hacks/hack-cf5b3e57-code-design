import type { CardFact } from "../../../../shared/contract";

/** Literal, case-insensitive matches only; overlapping facts share one underline. */
export function highlightReason(reason: string, facts: CardFact[]) {
  const matchedFacts = new Set<number>();
  const ranges: { start: number; end: number }[] = [];

  facts.forEach((fact, index) => {
    if (!fact.verified || !fact.label.trim()) return;
    const literal = fact.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const match of reason.matchAll(new RegExp(literal, "giu"))) {
      matchedFacts.add(index);
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  });

  ranges.sort((left, right) => left.start - right.start || right.end - left.end);
  const merged: typeof ranges = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }

  const parts: { text: string; verified: boolean; start: number }[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) parts.push({ text: reason.slice(cursor, range.start), verified: false, start: cursor });
    parts.push({ text: reason.slice(range.start, range.end), verified: true, start: range.start });
    cursor = range.end;
  }
  if (cursor < reason.length) parts.push({ text: reason.slice(cursor), verified: false, start: cursor });

  return { parts, remainingFacts: facts.filter((_, index) => !matchedFacts.has(index)) };
}

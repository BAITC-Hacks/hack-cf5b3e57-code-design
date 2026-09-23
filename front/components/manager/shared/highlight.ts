import type { CardFact } from "../../../../shared/contract";

export type ReasonPart = { text: string; verified: boolean; start: number };

/** Splits the explanation into parts, marking literal matches of verified fact labels. */
export function splitReason(reason: string, facts: CardFact[]): ReasonPart[] {
  const ranges: { start: number; end: number }[] = [];
  for (const fact of facts) {
    const label = fact.label.trim();
    if (!fact.verified || !label) continue;
    const pattern = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
    for (const match of reason.matchAll(pattern)) ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  ranges.sort((left, right) => left.start - right.start || right.end - left.end);

  const merged: typeof ranges = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }

  const parts: ReasonPart[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) parts.push({ text: reason.slice(cursor, range.start), verified: false, start: cursor });
    parts.push({ text: reason.slice(range.start, range.end), verified: true, start: range.start });
    cursor = range.end;
  }
  if (cursor < reason.length) parts.push({ text: reason.slice(cursor), verified: false, start: cursor });
  return parts;
}

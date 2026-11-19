/**
 * Word-level text comparison, used to highlight what changed on a card:
 * - v2 upgrades: "Deal 8 → 11 damage."
 * - Chain-boosted numbers in hand: "Deal 10 damage." with 10 highlighted.
 *
 * Card text is generated from data (describe.ts), so comparing the base and
 * changed text finds every difference without hand-written upgrade notes.
 */

export type DiffSegment =
  | { kind: 'same'; text: string }
  /** A word that changed. `from` is the old word when one was directly replaced, e.g. a number. */
  | { kind: 'changed'; text: string; from?: string }
  /** A word that only exists in the old text (e.g. a keyword the v2 drops). */
  | { kind: 'removed'; text: string };

/** Splits into words, keeping trailing punctuation attached, e.g. ["Deal", "8", "damage."]. */
function words(text: string): string[] {
  return text.split(/\s+/).filter((w) => w !== '');
}

/**
 * Longest common subsequence of two word lists, as a table:
 * lcs[i][j] = LCS length of a[i..] and b[j..].
 */
function lcsTable(a: readonly string[], b: readonly string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = table[i] as number[];
      row[j] = a[i] === b[j] ? (table[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(table[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  return table;
}

/** Compares old and new text word by word. Segments come out in reading order of the new text. */
export function diffWords(oldText: string, newText: string): DiffSegment[] {
  const a = words(oldText);
  const b = words(newText);
  const table = lcsTable(a, b);
  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    const oldWord = a[i];
    const newWord = b[j];
    if (oldWord !== undefined && oldWord === newWord) {
      segments.push({ kind: 'same', text: newWord });
      i++;
      j++;
    } else if (oldWord !== undefined && newWord !== undefined && (table[i + 1]?.[j + 1] ?? 0) === (table[i]?.[j] ?? 0)) {
      // Both words differ and skipping both keeps the best match: a direct replacement.
      segments.push({ kind: 'changed', text: newWord, from: oldWord });
      i++;
      j++;
    } else if (newWord !== undefined && (oldWord === undefined || (table[i]?.[j + 1] ?? 0) >= (table[i + 1]?.[j] ?? 0))) {
      segments.push({ kind: 'changed', text: newWord });
      j++;
    } else if (oldWord !== undefined) {
      segments.push({ kind: 'removed', text: oldWord });
      i++;
    }
  }
  return segments;
}

/** True if any word differs. */
export function hasChanges(segments: readonly DiffSegment[]): boolean {
  return segments.some((s) => s.kind !== 'same');
}

/** Leading whole number of a word, e.g. "11" from "11," (null if it doesn't start with one). */
function leadingNumber(word: string): number | null {
  const match = /^(\d+)/.exec(word);
  return match === null ? null : Number(match[1]);
}

/**
 * Short summaries of number changes for a badge, e.g. ["+3 damage", "+1 Vuln"].
 * Each changed number is labeled with the word after it.
 */
export function numberChanges(segments: readonly DiffSegment[]): string[] {
  const changes: string[] = [];
  segments.forEach((segment, index) => {
    if (segment.kind !== 'changed' || segment.from === undefined) return;
    const before = leadingNumber(segment.from);
    const after = leadingNumber(segment.text);
    if (before === null || after === null || before === after) return;
    const next = segments[index + 1];
    const label = next === undefined ? '' : ` ${next.text.replace(/[.,:]$/, '')}`;
    changes.push(`${after > before ? '+' : '−'}${Math.abs(after - before)}${label}`);
  });
  return changes;
}

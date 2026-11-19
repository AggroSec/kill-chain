import { describe, expect, it } from 'vitest';
import attribution from '../assets/ATTRIBUTION.md?raw';
import { CONTENT } from './content';
import { CREDITS } from './credits';
import { glossarySections, termsOnCard } from './glossary';

describe('glossary', () => {
  it('has a non-empty explanation for every entry, including every status', () => {
    const sections = glossarySections(Object.values(CONTENT.statuses));
    const terms = sections.flatMap((s) => s.entries);
    for (const entry of terms) expect(entry.text.length, entry.term).toBeGreaterThan(10);
    for (const status of Object.values(CONTENT.statuses)) expect(terms.map((t) => t.term)).toContain(status.name);
  });

  it('explains the keywords and statuses a card uses', () => {
    const ransomware = CONTENT.cards.ransomware;
    const kernel = CONTENT.cards['kernel-exploit'];
    if (ransomware === undefined || kernel === undefined) throw new Error('missing card');
    expect(termsOnCard(ransomware, CONTENT.statuses).map((t) => t.term)).toEqual(['Noisy']);
    expect(termsOnCard(kernel, CONTENT.statuses).map((t) => t.term)).toEqual(['Exploit', 'Vuln']);
  });
});

describe('credits', () => {
  it('credits every icon author listed in ATTRIBUTION.md', () => {
    const authors = new Set([...attribution.matchAll(/^\| `[^`]+` \([^)]*\) \| ([^|]+) \|/gm)].map((m) => (m[1] ?? '').trim()));
    expect(authors.size).toBeGreaterThan(0);
    const creditText = CREDITS.map((c) => c.text).join(' ');
    for (const author of authors) expect(creditText).toContain(author);
  });
});

import { describe, expect, it } from 'vitest';
import { upgradedId } from '../engine';
import { CONTENT } from '../data/content';
import { upgradeSummary } from './upgradeSummary';

function summary(id: string): string {
  const base = CONTENT.cards[id];
  const v2 = CONTENT.cards[upgradedId(id)];
  if (base === undefined || v2 === undefined) throw new Error(id);
  return upgradeSummary(base, v2, CONTENT);
}

describe('upgradeSummary', () => {
  it('leads with cost cuts', () => {
    expect(summary('keylogging')).toBe('−1 Cost');
    expect(summary('zero-day-exploit')).toMatch(/^−1 Cost/);
  });

  it('summarises number changes with what they apply to', () => {
    expect(summary('ransomware')).toBe('+4 damage, +2 damage');
    expect(summary('impair-defenses')).toBe('+3 Block, Alert −3→−4');
  });

  it('has a summary for every upgradable card', () => {
    for (const [id, card] of Object.entries(CONTENT.cards)) {
      if (id.endsWith('+') || card.v2 === undefined) continue;
      expect(summary(id), id).not.toBe('');
      expect(summary(id), id).not.toBe('Upgraded');
    }
  });
});

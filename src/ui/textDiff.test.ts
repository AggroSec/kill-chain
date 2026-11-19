import { describe, expect, it } from 'vitest';
import { diffWords, hasChanges } from './textDiff';

describe('diffWords', () => {
  it('marks a replaced number with its old value', () => {
    expect(diffWords('Deal 8 damage.', 'Deal 11 damage.')).toEqual([
      { kind: 'same', text: 'Deal' },
      { kind: 'changed', text: '11', from: '8' },
      { kind: 'same', text: 'damage.' },
    ]);
  });

  it('marks added and removed words', () => {
    const dropped = diffWords('Gain 5 Block. Noisy 1.', 'Gain 5 Block.');
    expect(dropped.filter((s) => s.kind === 'removed').map((s) => s.text)).toEqual(['Noisy', '1.']);
    const added = diffWords('Gain 5 Block.', 'Gain 5 Block. Draw 1 card.');
    expect(added.filter((s) => s.kind === 'changed').map((s) => s.text)).toEqual(['Draw', '1', 'card.']);
    expect(hasChanges(added)).toBe(true);
  });

  it('finds no changes in identical text', () => {
    expect(hasChanges(diffWords('Apply 3 Vuln.', 'Apply 3 Vuln.'))).toBe(false);
  });
});

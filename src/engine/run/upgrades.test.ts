import { describe, expect, it } from 'vitest';
import { RUN_TEST_CONTENT } from '../__fixtures__/runContent';
import { baseCardId, canUpgrade, isUpgraded, upgradedId } from './upgrades';

const cards = RUN_TEST_CONTENT.cards;

describe('v2 upgrades', () => {
  it('names upgraded ids with a "+"', () => {
    expect(upgradedId('pub-a')).toBe('pub-a+');
    expect(isUpgraded('pub-a+')).toBe(true);
    expect(isUpgraded('pub-a')).toBe(false);
    expect(baseCardId('pub-a+')).toBe('pub-a');
    expect(baseCardId('pub-a')).toBe('pub-a');
  });

  it('builds a v2 card that only changes the listed fields', () => {
    const v2 = cards['pub-a+'];
    expect(v2?.name).toBe('pub-a v2');
    expect(v2?.cost).toBe(0);
    expect(v2?.effects).toEqual(cards['pub-a']?.effects);
    expect(v2?.v2).toBeUndefined();
    expect(cards['t-strike+']?.effects).toEqual([{ kind: 'damage', amount: 9 }]);
  });

  it('replaces the whole keyword set when the v2 lists keywords', () => {
    expect(cards['priv-a+']?.keywords).toEqual({});
  });

  it('only upgrades cards that have a v2 and are not upgraded yet', () => {
    expect(canUpgrade(cards, 'pub-a')).toBe(true);
    expect(canUpgrade(cards, 'pub-a+')).toBe(false);
    expect(canUpgrade(cards, 'pub-b')).toBe(false);
    expect(cards['pub-b+']).toBeUndefined();
  });
});

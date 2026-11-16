import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data/content';
import { describeCard, describeIntent } from './describe';

function cardText(id: string): string {
  const card = CONTENT.cards[id];
  if (card === undefined) throw new Error(`no card ${id}`);
  return describeCard(card, CONTENT);
}

describe('card text is generated from data', () => {
  it('covers damage, block and keywords', () => {
    expect(cardText('brute-force')).toBe('Deal 6 damage.');
    expect(cardText('obfuscate')).toBe('Gain 5 Block.');
    expect(cardText('exploit-public-app')).toBe(
      'Deal 6 damage. Exploit: consume all Vuln, deal 4 damage per stack. Noisy 2.',
    );
  });

  it('covers conditions, statuses and implants', () => {
    expect(cardText('spearphishing')).toBe('Deal 9 damage. If Quiet: Draw 1 card.');
    expect(cardText('pretexting')).toBe('Apply 2 Throttled. Lower Alert by 1.');
    expect(cardText('insider-contact')).toBe(
      'Implant: at the start of your turn: Lower Alert by 1. Gain 3 Block.',
    );
    expect(cardText('help-desk-pretext')).toBe('Apply 1 Stalled. Burner.');
  });

  it('every card produces non-empty text', () => {
    for (const card of Object.values(CONTENT.cards)) {
      expect(describeCard(card, CONTENT).length, card.id).toBeGreaterThan(0);
    }
  });
});

describe('intent text', () => {
  it('joins effects', () => {
    expect(
      describeIntent(
        [
          { kind: 'attack', damage: 5 },
          { kind: 'raiseAlert', amount: 2 },
        ],
        CONTENT,
      ),
    ).toBe('Attack 5 + Alert +2');
    expect(describeIntent([{ kind: 'attack', damage: 3, hits: 2 }], CONTENT)).toBe('Attack 3x2');
  });
});

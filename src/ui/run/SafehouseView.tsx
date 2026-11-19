/** Safehouse: Lay Low, Weaponize (upgrade a card) or Go Dark (Wipe a card). One per visit. */
import { useState } from 'react';
import { canUpgrade, layLowAmount } from '../../engine';
import { NODE_NAMES, TERMS } from '../../data/terms';
import { DeckPicker } from './DeckPicker';
import type { PhaseProps } from './phaseProps';

type Picking = 'weaponize' | 'goDark' | null;

export function SafehouseView({ run, content, act, can }: PhaseProps) {
  const [picking, setPicking] = useState<Picking>(null);
  if (run.phase.kind !== 'safehouse') return null;

  const anyUpgradable = run.deck.some((id) => canUpgrade(content.cards, id));
  const canWipeAny = can({ type: 'GO_DARK', deckIndex: 0 });

  if (picking !== null) {
    const isWeaponize = picking === 'weaponize';
    return (
      <DeckPicker
        title={isWeaponize ? TERMS.weaponize : TERMS.goDark}
        confirmLabel={isWeaponize ? TERMS.weaponize : TERMS.wipe}
        showUpgrades={isWeaponize}
        deck={run.deck}
        content={content}
        canPick={(i) => (isWeaponize ? can({ type: 'WEAPONIZE', deckIndex: i }) : can({ type: 'GO_DARK', deckIndex: i }))}
        onPick={(i) => {
          setPicking(null);
          act(isWeaponize ? { type: 'WEAPONIZE', deckIndex: i } : { type: 'GO_DARK', deckIndex: i });
        }}
        onClose={() => setPicking(null)}
      />
    );
  }

  return (
    <section className="panel">
      <h2>{NODE_NAMES.safehouse}</h2>
      <button type="button" className="option" onClick={() => act({ type: 'LAY_LOW' })}>
        <strong>{TERMS.layLow}</strong>
        <span className="muted">
          Recover up to {layLowAmount(run, content)} {TERMS.opsec} ({run.opsec}/{run.maxOpsec} now).
        </span>
      </button>
      <button type="button" className="option" disabled={!anyUpgradable} onClick={() => setPicking('weaponize')}>
        <strong>{TERMS.weaponize}</strong>
        <span className="muted">{anyUpgradable ? `Upgrade 1 card to${TERMS.upgradedSuffix}.` : TERMS.noUpgrades}</span>
      </button>
      <button type="button" className="option" disabled={!canWipeAny} onClick={() => setPicking('goDark')}>
        <strong>{TERMS.goDark}</strong>
        <span className="muted">{canWipeAny ? `${TERMS.wipe} 1 card from your ${TERMS.arsenal}, ${TERMS.free.toLowerCase()}.` : TERMS.minArsenal}</span>
      </button>
    </section>
  );
}

/** Loot after a fight: what you got, then pick 1 card (tap, then confirm) or skip. */
import { useState } from 'react';
import { getClass } from '../../data/content';
import { TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';
import type { PhaseProps } from './phaseProps';

export function LootView({ run, content, act }: PhaseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  if (run.phase.kind !== 'loot') return null;
  const { loot } = run.phase;
  const tool = loot.toolId === null ? undefined : content.tools[loot.toolId];
  const selectedId = selected === null ? undefined : loot.cardChoices[selected];

  return (
    <section className="panel">
      <h2>{loot.bonus === true ? `${getClass(run.classId).passiveName}: ${TERMS.bonusPick}` : TERMS.loot}</h2>
      {loot.bonus === true && <p className="muted">{getClass(run.classId).passiveText}</p>}
      {loot.crypto > 0 && (
        <p className="loot-crypto">
          +{loot.crypto} {TERMS.crypto}
        </p>
      )}
      {tool !== undefined && (
        <p>
          {TERMS.tool}: <strong>{tool.name}</strong>. {tool.description}
        </p>
      )}
      {loot.cardChoices.length > 0 && <p className="muted">{TERMS.pickCard}</p>}
      <div className="card-grid">
        {loot.cardChoices.map((cardId, index) => {
          const def = content.cards[cardId];
          if (def === undefined) return null;
          return (
            <button
              key={cardId}
              type="button"
              className={selected === index ? 'card-button selected' : 'card-button'}
              aria-pressed={selected === index}
              onClick={() => setSelected(selected === index ? null : index)}
            >
              <CardFace def={def} content={content} />
            </button>
          );
        })}
      </div>
      {selected !== null && selectedId !== undefined && (
        <button
          type="button"
          className="primary"
          onClick={() => {
            setSelected(null);
            act({ type: 'PICK_LOOT_CARD', index: selected });
          }}
        >
          {TERMS.take} {content.cards[selectedId]?.name}
        </button>
      )}
      <button type="button" className="secondary" onClick={() => act({ type: 'SKIP_LOOT' })}>
        {loot.cardChoices.length > 0 ? TERMS.skipLoot : TERMS.done}
      </button>
    </section>
  );
}

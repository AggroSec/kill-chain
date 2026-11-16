/** Loot after a fight: what you got, then pick 1 card or skip. */
import { TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';
import type { PhaseProps } from './phaseProps';

export function LootView({ run, content, act }: PhaseProps) {
  if (run.phase.kind !== 'loot') return null;
  const { loot } = run.phase;
  const tool = loot.toolId === null ? undefined : content.tools[loot.toolId];
  return (
    <section className="panel">
      <h2>{TERMS.loot}</h2>
      {loot.crypto > 0 && (
        <p>
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
            <button key={cardId} type="button" className={`card card-${def.type}`} onClick={() => act({ type: 'PICK_LOOT_CARD', index })}>
              <CardFace def={def} content={content} />
            </button>
          );
        })}
      </div>
      <button type="button" className="secondary" onClick={() => act({ type: 'SKIP_LOOT' })}>
        {loot.cardChoices.length > 0 ? TERMS.skipLoot : TERMS.done}
      </button>
    </section>
  );
}

/** Full details for one enemy, opened by tapping it with no card selected. */
import { getEnemyDef, previewIntent } from '../../engine';
import type { CombatState, ContentRegistry } from '../../engine';
import { TERMS } from '../../data/terms';
import { describeIntent } from '../describe';

interface EnemySheetProps {
  state: CombatState;
  index: number;
  content: ContentRegistry;
  onClose: () => void;
}

export function EnemySheet({ state, index, content, onClose }: EnemySheetProps) {
  const enemy = state.enemies[index];
  if (enemy === undefined) return null;
  const def = getEnemyDef(content, enemy.defId);
  const intent = previewIntent(state, index, content);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet" role="dialog" aria-label={def.name} onClick={(e) => e.stopPropagation()}>
        <div className="topbar">
          <h2>{def.name}</h2>
          <button type="button" className="secondary small-button" onClick={onClose}>
            {TERMS.close}
          </button>
        </div>
        <p className="muted">{def.description}</p>
        <p>
          {TERMS.integrity} {enemy.integrity}/{enemy.maxIntegrity}
          {enemy.block > 0 && ` · ${TERMS.block} ${enemy.block}`}
        </p>
        {intent !== null && (
          <p className="intent">
            {TERMS.intent}: {intent.stalled ? TERMS.stalled : `${intent.moveName}: ${describeIntent(intent.effects, content)}`}
          </p>
        )}
        {Object.entries(enemy.statuses).length > 0 && (
          <ul className="status-list">
            {Object.entries(enemy.statuses).map(([id, stacks]) => {
              const status = content.statuses[id];
              return (
                <li key={id}>
                  <strong>
                    {status?.name ?? id} {stacks}
                  </strong>
                  : {status?.description}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

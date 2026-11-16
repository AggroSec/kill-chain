/** One enemy: Integrity, block, statuses and its next intent. Tap to target it. */
import { getEnemyDef, isEnemyAlive, previewIntent } from '../engine';
import type { CombatState, ContentRegistry } from '../engine';
import { TERMS } from '../data/terms';
import { describeIntent } from './describe';
import { StatusChips } from './StatusChips';

interface EnemyPanelProps {
  state: CombatState;
  index: number;
  content: ContentRegistry;
  isTarget: boolean;
  onSelect: () => void;
}

export function EnemyPanel({ state, index, content, isTarget, onSelect }: EnemyPanelProps) {
  const enemy = state.enemies[index];
  if (enemy === undefined) return null;
  const def = getEnemyDef(content, enemy.defId);
  const alive = isEnemyAlive(enemy);
  const intent = previewIntent(state, index, content);

  const classes = ['enemy', alive ? '' : 'defeated', isTarget && alive ? 'targeted' : ''].join(' ');
  return (
    <button type="button" className={classes} onClick={onSelect} disabled={!alive} aria-pressed={isTarget}>
      <h2>
        {def.name}
        {isTarget && alive && <span className="target-tag"> · {TERMS.target}</span>}
      </h2>
      <div>
        {TERMS.integrity} {enemy.integrity}/{enemy.maxIntegrity}
        {enemy.block > 0 && ` · ${TERMS.block} ${enemy.block}`}
      </div>
      <StatusChips statuses={enemy.statuses} content={content} />
      {intent !== null && state.outcome === 'ongoing' && (
        <div className="intent">
          {TERMS.intent}: {intent.stalled ? TERMS.stalled : `${intent.moveName} (${describeIntent(intent.effects, content)})`}
        </div>
      )}
      <div className="muted small">{def.description}</div>
    </button>
  );
}

/**
 * One enemy as a compact panel, so three fit side by side on a phone
 * (AggroSec, M4 planning #17): name, Integrity bar, block, statuses and a
 * short intent line. Tap it to target it with the selected card, or to
 * inspect it when no card is selected.
 */
import { getEnemyDef, isEnemyAlive, previewIntent } from '../../engine';
import type { CombatState, ContentRegistry } from '../../engine';
import { TERMS } from '../../data/terms';
import { shortIntent } from '../describe';
import { StatusChips } from '../StatusChips';

interface EnemyPanelProps {
  state: CombatState;
  index: number;
  content: ContentRegistry;
  /** A card that needs a target is selected, and this enemy can be targeted. */
  targetable: boolean;
  onTap: () => void;
}

export function EnemyPanel({ state, index, content, targetable, onTap }: EnemyPanelProps) {
  const enemy = state.enemies[index];
  if (enemy === undefined) return null;
  const def = getEnemyDef(content, enemy.defId);
  const alive = isEnemyAlive(enemy);
  const intent = alive && state.outcome === 'ongoing' ? previewIntent(state, index, content) : null;
  const percent = Math.max(0, (enemy.integrity / enemy.maxIntegrity) * 100);

  const classes = ['enemy', alive ? '' : 'defeated', targetable ? 'targetable' : ''];
  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onTap}
      disabled={!alive}
      aria-label={`${def.name}, ${TERMS.integrity} ${enemy.integrity} of ${enemy.maxIntegrity}`}
    >
      <span className="enemy-name">{def.name}</span>
      <span className="bar integrity-bar" aria-hidden="true">
        <span className="bar-fill" style={{ width: `${percent}%` }} />
        <span className="bar-label">
          {enemy.integrity}/{enemy.maxIntegrity}
        </span>
      </span>
      {enemy.block > 0 && (
        <span className="enemy-block">
          ⛨ {enemy.block}
        </span>
      )}
      {intent !== null && (
        <span className={intent.stalled ? 'intent stalled' : 'intent'}>
          {intent.stalled ? TERMS.stalled : shortIntent(intent.effects, content).join(' ')}
        </span>
      )}
      <StatusChips statuses={enemy.statuses} content={content} />
    </button>
  );
}

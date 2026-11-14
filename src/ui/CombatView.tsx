/**
 * Bare-bones combat screen. It only renders engine state and sends actions;
 * all rules live in src/engine.
 */
import { getCardDef, getEnemyDef, getMove, isEnemyAlive, whyCantPlay } from '../engine';
import type { CombatAction, CombatState, ContentRegistry } from '../engine';
import { TERMS } from '../data/terms';
import { describeCardEffects, describeIntent } from './describe';

interface CombatViewProps {
  state: CombatState;
  seed: number;
  content: ContentRegistry;
  onAction: (action: CombatAction) => void;
  onNewFight: () => void;
}

const OUTCOME_LABEL = {
  won: TERMS.runWon,
  lost: TERMS.runLost,
  turnCap: TERMS.turnCap,
} as const;

export function CombatView({ state, seed, content, onAction, onNewFight }: CombatViewProps) {
  const { player } = state;
  // Milestone 1 has one enemy, so cards target the first one still standing.
  const targetIndex = Math.max(0, state.enemies.findIndex(isEnemyAlive));

  return (
    <main className="combat">
      <header className="topbar">
        <h1>{TERMS.gameTitle}</h1>
        <span>
          {TERMS.turn} {state.turn}
        </span>
      </header>

      <section className="enemies">
        {state.enemies.map((enemy) => {
          const def = getEnemyDef(content, enemy.defId);
          const intent = getMove(def, enemy.intentMoveId);
          return (
            <div key={enemy.uid} className={isEnemyAlive(enemy) ? 'enemy' : 'enemy defeated'}>
              <h2>{def.name}</h2>
              <div>
                {TERMS.integrity} {enemy.integrity}/{enemy.maxIntegrity}
                {enemy.block > 0 && ` · ${TERMS.block} ${enemy.block}`}
              </div>
              {isEnemyAlive(enemy) && state.outcome === 'ongoing' && (
                <div className="intent">
                  {TERMS.intent}: {intent.name} ({describeIntent(intent.effects)})
                </div>
              )}
            </div>
          );
        })}
      </section>

      {state.outcome !== 'ongoing' ? (
        <section className="result">
          <h2>{OUTCOME_LABEL[state.outcome]}</h2>
          <button type="button" className="primary" onClick={onNewFight}>
            {TERMS.newFight}
          </button>
        </section>
      ) : (
        <section className="hand" aria-label="Hand">
          {player.hand.map((card, handIndex) => {
            const def = getCardDef(content, card.defId);
            const playable = whyCantPlay(state, handIndex, targetIndex, content) === null;
            return (
              <button
                key={card.uid}
                type="button"
                className={`card card-${def.type}`}
                disabled={!playable}
                onClick={() => onAction({ type: 'PLAY_CARD', handIndex, targetIndex })}
              >
                <span className="card-cost">{def.cost}</span>
                <span className="card-name">{def.name}</span>
                <span className="card-text">{describeCardEffects(def.effects)}</span>
              </button>
            );
          })}
        </section>
      )}

      <footer className="player">
        <div className="stats">
          <span>
            {TERMS.opsec} {player.opsec}/{player.maxOpsec}
          </span>
          <span>
            {TERMS.block} {player.block}
          </span>
          <span>
            {TERMS.cycles} {player.cycles}/{player.maxCycles}
          </span>
        </div>
        <div className="stats muted">
          <span>
            {TERMS.drawPile} {player.drawPile.length}
          </span>
          <span>
            {TERMS.discardPile} {player.discardPile.length}
          </span>
          <span>
            {TERMS.seed} {seed}
          </span>
        </div>
        <button
          type="button"
          className="primary"
          disabled={state.outcome !== 'ongoing'}
          onClick={() => onAction({ type: 'END_TURN' })}
        >
          {TERMS.endTurn}
        </button>
      </footer>
    </main>
  );
}

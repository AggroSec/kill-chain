/**
 * Debug combat screen. It only renders engine state and sends actions;
 * all rules live in src/engine.
 */
import { useState } from 'react';
import { getAlertLevel, isEnemyAlive, livingEnemyIndexes, whyCantPlay } from '../engine';
import type { CombatAction, CombatState, ContentRegistry } from '../engine';
import { ALERT_LEVEL_NAMES, TERMS } from '../data/terms';
import { EnemyPanel } from './EnemyPanel';
import { HandCard } from './HandCard';
import { StatusChips } from './StatusChips';

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
  const [selectedTarget, setSelectedTarget] = useState(0);
  // If the selected enemy is gone, fall back to the first one still standing.
  const selected = state.enemies[selectedTarget];
  const targetIndex = selected !== undefined && isEnemyAlive(selected) ? selectedTarget : (livingEnemyIndexes(state)[0] ?? 0);
  const alertLevel = getAlertLevel(state.alert);

  return (
    <main className="combat">
      <header className="topbar">
        <h1>{TERMS.gameTitle}</h1>
        <span>
          {TERMS.turn} {state.turn}
        </span>
      </header>

      <div className="meters">
        <span className={`alert alert-${alertLevel.id}`}>
          {TERMS.alert} {state.alert} · {ALERT_LEVEL_NAMES[alertLevel.id]}
        </span>
        <span className="chain">
          {TERMS.chain} {state.chain.count}
        </span>
      </div>

      <section className="enemies">
        {state.enemies.map((enemy, index) => (
          <EnemyPanel
            key={enemy.uid}
            state={state}
            index={index}
            content={content}
            isTarget={index === targetIndex && state.enemies.length > 1}
            onSelect={() => setSelectedTarget(index)}
          />
        ))}
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
          {player.hand.map((card, handIndex) => (
            <HandCard
              key={card.uid}
              card={card}
              state={state}
              content={content}
              playable={whyCantPlay(state, handIndex, targetIndex, content) === null}
              onPlay={() => onAction({ type: 'PLAY_CARD', handIndex, targetIndex })}
            />
          ))}
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
        <StatusChips statuses={player.statuses} content={content} />
        <div className="stats muted">
          <span>
            {TERMS.drawPile} {player.drawPile.length}
          </span>
          <span>
            {TERMS.discardPile} {player.discardPile.length}
          </span>
          <span>
            {TERMS.spentPile} {player.spentPile.length}
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

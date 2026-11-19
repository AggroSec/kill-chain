/**
 * The fight screen (Milestone 4, touch first).
 *
 * Play flow (AggroSec, M4 planning #17): tap a card to select it. It lifts
 * and its full text shows above the hand with Chain-boosted numbers. Then
 * tap an enemy to play it, or tap Play for cards with no target. Tap the
 * card again (or Cancel) to put it back. Tapping an enemy with no card
 * selected opens its details.
 *
 * Only renders engine state and sends actions; every rule lives in src/engine.
 */
import { useState } from 'react';
import { ALERT_MAX, cardNeedsTarget, getAlertLevel, getCardDef, incomingDamage, isEnemyAlive, livingEnemyIndexes, whyCantPlay } from '../../engine';
import type { CombatAction, CombatState, ContentRegistry } from '../../engine';
import { ALERT_LEVEL_NAMES, TERMS } from '../../data/terms';
import { StatusChips } from '../StatusChips';
import { EnemyPanel } from './EnemyPanel';
import { EnemySheet } from './EnemySheet';
import { Hand } from './Hand';
import { SelectedCard } from './SelectedCard';
import './combat.css';

interface CombatViewProps {
  state: CombatState;
  seed: number;
  content: ContentRegistry;
  onAction: (action: CombatAction) => void;
  onMenu: () => void;
  /** Shown when the fight is over (practice fights only; runs move on by themselves). */
  onNewFight: () => void;
  /** Label for that button. Defaults to "New Fight". */
  newFightLabel?: string;
  /** Guided first fight: a tip shown above the hand, with a way to skip. */
  tip?: { text: string; onSkip: () => void };
  /** Tells the guided first fight which card is selected. */
  onSelectionChange?: (cardId: string | null) => void;
}

const OUTCOME_LABEL = {
  won: TERMS.runWon,
  lost: TERMS.runLost,
  turnCap: TERMS.turnCap,
} as const;

export function CombatView({ state, seed, content, onAction, onMenu, onNewFight, newFightLabel, tip, onSelectionChange }: CombatViewProps) {
  const { player } = state;
  const [selected, setSelectedIndex] = useState<number | null>(null);

  function setSelected(index: number | null) {
    setSelectedIndex(index);
    onSelectionChange?.(index === null ? null : (player.hand[index]?.defId ?? null));
  }
  const [inspecting, setInspecting] = useState<number | null>(null);

  // A selection can go stale (the hand changed); treat it as nothing selected.
  const selectedCard = selected === null ? undefined : player.hand[selected];
  const selectedDef = selectedCard === undefined ? undefined : getCardDef(content, selectedCard.defId);
  const selectedIndex = selectedDef === undefined ? null : selected;
  const needsTarget = selectedDef !== undefined && cardNeedsTarget(selectedDef);
  const living = livingEnemyIndexes(state);
  const alertLevel = getAlertLevel(state.alert);
  const incoming = incomingDamage(state, content);

  const unplayable = new Set<number>();
  player.hand.forEach((_, index) => {
    // A card is dimmed only if it can't be played at any target (e.g. not enough Cycles).
    if (whyCantPlay(state, index, living[0] ?? 0, content) !== null) unplayable.add(index);
  });

  function play(handIndex: number, targetIndex: number) {
    setSelected(null);
    onAction({ type: 'PLAY_CARD', handIndex, targetIndex });
  }

  function tapCard(index: number) {
    setSelected(index === selectedIndex ? null : index);
  }

  function tapEnemy(index: number) {
    if (selectedIndex !== null && needsTarget && whyCantPlay(state, selectedIndex, index, content) === null) {
      play(selectedIndex, index);
    } else {
      setInspecting(index);
    }
  }

  function endTurn() {
    setSelected(null);
    onAction({ type: 'END_TURN' });
  }

  const over = state.outcome !== 'ongoing';

  return (
    <main className="screen combat-screen">
      <header className="topbar combat-top">
        <span className="turn">
          {TERMS.turn} {state.turn}
        </span>
        <span className={`alert-meter alert-${alertLevel.id}`} aria-label={`${TERMS.alert} ${state.alert}`}>
          <span className="alert-name">
            {TERMS.alert} · {ALERT_LEVEL_NAMES[alertLevel.id]}
          </span>
          <span className="bar">
            <span className="bar-fill" style={{ width: `${Math.min(100, (state.alert / ALERT_MAX) * 100)}%` }} />
            <span className="bar-label">{state.alert}</span>
          </span>
        </span>
        <button type="button" className="secondary small-button" onClick={onMenu}>
          {TERMS.menu}
        </button>
      </header>

      <section className="enemies">
        {state.enemies.map((enemy, index) => (
          <EnemyPanel
            key={enemy.uid}
            state={state}
            index={index}
            content={content}
            targetable={needsTarget && isEnemyAlive(enemy) && !unplayable.has(selectedIndex ?? -1)}
            onTap={() => tapEnemy(index)}
          />
        ))}
      </section>

      <div className="combat-middle">
        {over ? (
          <section className="panel result">
            <h2>{OUTCOME_LABEL[state.outcome as keyof typeof OUTCOME_LABEL]}</h2>
            <button type="button" className="primary" onClick={onNewFight}>
              {newFightLabel ?? TERMS.newFight}
            </button>
          </section>
        ) : selectedIndex !== null ? (
          <SelectedCard
            state={state}
            content={content}
            handIndex={selectedIndex}
            onlyTarget={living.length === 1 ? (living[0] ?? null) : null}
            onPlay={(target) => play(selectedIndex, target)}
            onCancel={() => setSelected(null)}
          />
        ) : (
          incoming > 0 && (
            <p className="incoming">
              {TERMS.incoming} ⚔ {incoming}
              {player.block > 0 && ` (${TERMS.block} ${player.block})`}
            </p>
          )
        )}
      </div>

      {tip !== undefined && (
        <aside className="tutorial-tip" aria-live="polite">
          <p>{tip.text}</p>
          {state.outcome === 'ongoing' && (
            <button type="button" className="link-like" onClick={tip.onSkip}>
              {TERMS.skipTutorial}
            </button>
          )}
        </aside>
      )}

      <section className="player-bar">
        <span className="bar opsec-bar" aria-label={`${TERMS.opsec} ${player.opsec} of ${player.maxOpsec}`}>
          <span className="bar-fill" style={{ width: `${(player.opsec / player.maxOpsec) * 100}%` }} />
          <span className="bar-label">
            {TERMS.opsec} {player.opsec}/{player.maxOpsec}
          </span>
        </span>
        {player.block > 0 && <span className="player-block">⛨ {player.block}</span>}
        <span className="cycles" aria-label={`${TERMS.cycles} ${player.cycles} of ${player.maxCycles}`}>
          {player.cycles}/{player.maxCycles} ⚡
        </span>
        <span className="chain-count">
          {TERMS.chain} {state.chain.count}
        </span>
      </section>
      <StatusChips statuses={player.statuses} content={content} />

      {!over && <Hand state={state} content={content} selected={selectedIndex} unplayable={unplayable} onTap={tapCard} onSlide={setSelected} />}

      <footer className="combat-footer">
        <span className="muted small piles">
          {TERMS.drawPile} {player.drawPile.length} · {TERMS.discardPile} {player.discardPile.length} · {TERMS.spentPile}{' '}
          {player.spentPile.length}
          <br />
          {TERMS.seed} {seed}
        </span>
        <button type="button" className="primary" disabled={over} onClick={endTurn}>
          {TERMS.endTurn}
        </button>
      </footer>

      {inspecting !== null && <EnemySheet state={state} index={inspecting} content={content} onClose={() => setInspecting(null)} />}
    </main>
  );
}

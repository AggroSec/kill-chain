/**
 * Milestone 1 debug app: one fight against the Firewall.
 * The real touch-first UI arrives in Milestone 4.
 */
import { useState } from 'react';
import { combatReducer, startCombat } from '../engine';
import type { CombatAction, CombatState } from '../engine';
import { CONTENT, DEMO_COMBAT } from '../data/content';
import { CombatView } from './CombatView';

/**
 * A fresh seed for a new fight. The UI may use Math.random (only the engine
 * must be deterministic); the seed is shown on screen so any fight can be replayed.
 */
function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export function App() {
  const [seed, setSeed] = useState(randomSeed);
  const [state, setState] = useState<CombatState>(() => startCombat(DEMO_COMBAT, seed, CONTENT));

  function dispatch(action: CombatAction) {
    setState((current) => combatReducer(current, action, CONTENT));
  }

  function newFight() {
    const nextSeed = randomSeed();
    setSeed(nextSeed);
    setState(startCombat(DEMO_COMBAT, nextSeed, CONTENT));
  }

  return <CombatView state={state} seed={seed} content={CONTENT} onAction={dispatch} onNewFight={newFight} />;
}

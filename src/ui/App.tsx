/**
 * Milestone 2 debug app: pick a class and an encounter, then fight it.
 * The real touch-first UI arrives in Milestone 4; the run loop in Milestone 3.
 */
import { useState } from 'react';
import { combatReducer, startCombat } from '../engine';
import type { CombatAction, CombatState } from '../engine';
import { CLASSES, CONTENT, ENCOUNTERS, starterFight } from '../data/content';
import { CLASS_LIST } from '../data/classes';
import { ENCOUNTER_LIST } from '../data/encounters';
import { CombatView } from './CombatView';
import { FightSetup } from './FightSetup';

/**
 * A fresh seed for a new fight. The UI may use Math.random (only the engine
 * must be deterministic); the seed is shown on screen so any fight can be replayed.
 */
function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

interface Fight {
  seed: number;
  state: CombatState;
}

/**
 * Optional replay link: ?class=exploit-dev&encounter=a1-edr&seed=123 starts that
 * exact fight immediately. Useful for bug reports (and for screenshot checks).
 * Unknown ids or a bad seed are ignored.
 */
function fightFromUrl(): Fight | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get('class');
    const encounterId = params.get('encounter');
    const seed = Number(params.get('seed'));
    if (classId === null || encounterId === null || !Number.isInteger(seed)) return null;
    if (CLASSES[classId] === undefined || ENCOUNTERS[encounterId] === undefined) return null;
    return { seed, state: startCombat(starterFight(classId, encounterId), seed, CONTENT) };
  } catch {
    return null;
  }
}

export function App() {
  const [classId, setClassId] = useState(CLASS_LIST[0]?.id ?? '');
  const [encounterId, setEncounterId] = useState(ENCOUNTER_LIST[0]?.id ?? '');
  const [fight, setFight] = useState<Fight | null>(fightFromUrl);

  function startFight() {
    const seed = randomSeed();
    setFight({ seed, state: startCombat(starterFight(classId, encounterId), seed, CONTENT) });
  }

  function dispatch(action: CombatAction) {
    setFight((current) => (current === null ? null : { ...current, state: combatReducer(current.state, action, CONTENT) }));
  }

  if (fight === null) {
    return (
      <FightSetup
        classId={classId}
        encounterId={encounterId}
        onClassChange={setClassId}
        onEncounterChange={setEncounterId}
        onStart={startFight}
      />
    );
  }

  return (
    <CombatView
      state={fight.state}
      seed={fight.seed}
      content={CONTENT}
      onAction={dispatch}
      onNewFight={() => setFight(null)}
    />
  );
}

/**
 * Milestone 3 app: a main menu, full runs (map, fights, Loot, Safehouse,
 * Dark Web, Intel), and the practice fight screen from Milestone 2.
 * The real touch-first UI arrives in Milestone 4.
 */
import { useState } from 'react';
import { combatReducer, runReducer, startCombat, startRun } from '../engine';
import type { CombatAction, CombatState, RunAction } from '../engine';
import { CLASSES, CONTENT, ENCOUNTERS, starterFight } from '../data/content';
import { CLASS_LIST } from '../data/classes';
import { ENCOUNTER_LIST } from '../data/encounters';
import { CombatView } from './CombatView';
import { FightSetup } from './FightSetup';
import { MainMenu } from './MainMenu';
import { RunView } from './run/RunView';
import { clearRun, loadRun, saveRun } from './storage';
import type { SavedRun } from './storage';

/**
 * A fresh seed. The UI may use Math.random (only the engine must be
 * deterministic); the seed is shown on screen so any run or fight can be replayed.
 */
function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

interface Fight {
  seed: number;
  state: CombatState;
}

type Screen =
  | { kind: 'menu' }
  | { kind: 'practiceSetup' }
  | { kind: 'practice'; fight: Fight }
  | { kind: 'run'; saved: SavedRun };

/**
 * Replay links, handy for bug reports:
 * - ?class=exploit-dev&seed=123 starts that exact run.
 * - ?class=exploit-dev&encounter=a1-edr&seed=123 starts that exact practice fight.
 * Unknown ids or a bad seed fall back to the menu.
 */
function screenFromUrl(): Screen {
  try {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get('class');
    const encounterId = params.get('encounter');
    const seed = Number(params.get('seed'));
    if (classId === null || CLASSES[classId] === undefined || !Number.isInteger(seed) || params.get('seed') === null) {
      return { kind: 'menu' };
    }
    if (encounterId === null) return { kind: 'run', saved: { seed, run: startRun(classId, seed, CONTENT) } };
    if (ENCOUNTERS[encounterId] === undefined) return { kind: 'menu' };
    return { kind: 'practice', fight: { seed, state: startCombat(starterFight(classId, encounterId), seed, CONTENT) } };
  } catch {
    return { kind: 'menu' };
  }
}

export function App() {
  const [screen, setScreen] = useState<Screen>(screenFromUrl);
  const [classId, setClassId] = useState(CLASS_LIST[0]?.id ?? '');
  const [encounterId, setEncounterId] = useState(ENCOUNTER_LIST[0]?.id ?? '');
  const [savedRun, setSavedRun] = useState<SavedRun | null>(loadRun);

  /** Show a run and keep the save in sync with it. */
  function showRun(saved: SavedRun) {
    saveRun(saved);
    setSavedRun(saved);
    setScreen({ kind: 'run', saved });
  }

  function newRun() {
    clearRun();
    const seed = randomSeed();
    showRun({ seed, run: startRun(classId, seed, CONTENT) });
  }

  function runAction(action: RunAction) {
    if (screen.kind !== 'run') return;
    const next = runReducer(screen.saved.run, action, CONTENT);
    if (next !== screen.saved.run) showRun({ seed: screen.saved.seed, run: next });
  }

  function practiceAction(action: CombatAction) {
    if (screen.kind !== 'practice') return;
    const state = combatReducer(screen.fight.state, action, CONTENT);
    setScreen({ kind: 'practice', fight: { ...screen.fight, state } });
  }

  switch (screen.kind) {
    case 'menu': {
      const canContinue = savedRun !== null && savedRun.run.outcome === 'ongoing';
      return (
        <MainMenu
          classId={classId}
          onClassChange={setClassId}
          onStartRun={newRun}
          {...(canContinue ? { onContinue: () => setScreen({ kind: 'run', saved: savedRun }) } : {})}
          onPractice={() => setScreen({ kind: 'practiceSetup' })}
        />
      );
    }
    case 'practiceSetup':
      return (
        <FightSetup
          classId={classId}
          encounterId={encounterId}
          onClassChange={setClassId}
          onEncounterChange={setEncounterId}
          onStart={() => {
            const seed = randomSeed();
            setScreen({ kind: 'practice', fight: { seed, state: startCombat(starterFight(classId, encounterId), seed, CONTENT) } });
          }}
        />
      );
    case 'practice':
      return (
        <CombatView
          state={screen.fight.state}
          seed={screen.fight.seed}
          content={CONTENT}
          onAction={practiceAction}
          onNewFight={() => setScreen({ kind: 'practiceSetup' })}
        />
      );
    case 'run':
      return (
        <RunView
          run={screen.saved.run}
          seed={screen.saved.seed}
          content={CONTENT}
          onAction={runAction}
          onMenu={() => setScreen({ kind: 'menu' })}
          onNewRun={() => setScreen({ kind: 'menu' })}
        />
      );
  }
}

/**
 * Milestone 3 app: a main menu, full runs (map, fights, Loot, Safehouse,
 * Dark Web, Intel), and the practice fight screen from Milestone 2.
 * The real touch-first UI arrives in Milestone 4.
 */
import { useState } from 'react';
import { combatReducer, runReducer, startCombat, startRun } from '../engine';
import type { CombatAction, CombatState, RunAction } from '../engine';
import { currentTip, startTutorial, TUTORIAL_SEED } from '../data/tutorial';
import { CLASSES, CONTENT, ENCOUNTERS, starterFight } from '../data/content';
import { CLASS_LIST } from '../data/classes';
import { ENCOUNTER_LIST } from '../data/encounters';
import { CombatView } from './combat/CombatView';
import { FightSetup } from './FightSetup';
import { MainMenu } from './MainMenu';
import { RunLogsScreen, runLabel } from './RunLogsScreen';
import { RunView } from './run/RunView';
import { archiveLog, clearRun, loadRun, runLogText, saveRun } from './storage';
import type { SavedRun } from './storage';
import { CreditsView } from './menus/CreditsView';
import { GlossaryView } from './menus/GlossaryView';
import { InfoScreen } from './menus/InfoScreen';
import { PauseMenu } from './menus/PauseMenu';
import { SettingsView } from './menus/SettingsView';
import { applyTheme, loadSettings, saveSettings } from './settings';
import type { Settings, ThemeId } from './settings';
import { TERMS } from '../data/terms';

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
  | { kind: 'runLogs' }
  | { kind: 'glossary' }
  | { kind: 'settings' }
  | { kind: 'credits' }
  | { kind: 'tutorial'; state: CombatState; selectedCardId: string | null }
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
    if (encounterId === null) return { kind: 'run', saved: { seed, run: startRun(classId, seed, CONTENT), actions: [] } };
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
  const [savedRun, setSavedRun] = useState<SavedRun | null>(() => loadRun(CONTENT));
  const [settings, setSettings] = useState<Settings>(loadSettings);
  /** The in-game menu is open on top of a run or practice fight. */
  const [paused, setPaused] = useState(false);

  function changeTheme(theme: ThemeId) {
    const next = { ...settings, theme };
    setSettings(next);
    saveSettings(next);
    applyTheme(theme);
  }

  /** Marks the guided fight as offered, so the menu stops suggesting it. */
  function markTutorialOffered() {
    if (settings.tutorialOffered) return;
    const next = { ...settings, tutorialOffered: true };
    setSettings(next);
    saveSettings(next);
  }

  function startGuidedFight() {
    markTutorialOffered();
    setScreen({ kind: 'tutorial', state: startTutorial(), selectedCardId: null });
  }

  function toMenu() {
    setPaused(false);
    setScreen({ kind: 'menu' });
  }

  /** Show a run and keep the save in sync with it. */
  function showRun(saved: SavedRun) {
    saveRun(saved);
    setSavedRun(saved);
    setScreen({ kind: 'run', saved });
  }

  function newRun() {
    // Keep the old run's log (finished or abandoned) for bug reports before replacing it.
    if (savedRun !== null) archiveLog({ label: runLabel(savedRun), text: runLogText(savedRun) });
    clearRun();
    const seed = randomSeed();
    showRun({ seed, run: startRun(classId, seed, CONTENT), actions: [] });
  }

  function runAction(action: RunAction) {
    if (screen.kind !== 'run') return;
    const { seed, run, actions } = screen.saved;
    const next = runReducer(run, action, CONTENT);
    if (next === run) return;
    // Record only accepted actions; old saves without a list stay without one.
    showRun({ seed, run: next, ...(actions !== undefined ? { actions: [...actions, action] } : {}) });
  }

  function practiceAction(action: CombatAction) {
    if (screen.kind !== 'practice') return;
    const state = combatReducer(screen.fight.state, action, CONTENT);
    setScreen({ kind: 'practice', fight: { ...screen.fight, state } });
  }

  const body = renderScreen();
  const inGame = screen.kind === 'run' || screen.kind === 'practice' || screen.kind === 'tutorial';
  return (
    <>
      {body}
      {paused && inGame && (
        <PauseMenu
          content={CONTENT}
          theme={settings.theme}
          onThemeChange={changeTheme}
          onResume={() => setPaused(false)}
          onQuit={toMenu}
          saved={screen.kind === 'run'}
        />
      )}
    </>
  );

  /** The current screen. Kept as a function so the pause menu can sit on top of any in-game screen. */
  function renderScreen() {
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
            onRunLogs={() => setScreen({ kind: 'runLogs' })}
            onGlossary={() => setScreen({ kind: 'glossary' })}
            onSettings={() => setScreen({ kind: 'settings' })}
            onCredits={() => setScreen({ kind: 'credits' })}
            onHowToPlay={startGuidedFight}
            // First launch only: offer the guided fight until it's been played or declined.
            {...(!settings.tutorialOffered && savedRun === null ? { onDeclineTutorial: markTutorialOffered } : {})}
          />
        );
      }
      case 'glossary':
        return (
          <InfoScreen title={TERMS.glossary} onBack={toMenu}>
            <GlossaryView content={CONTENT} />
          </InfoScreen>
        );
      case 'settings':
        return (
          <InfoScreen title={TERMS.settings} onBack={toMenu}>
            <SettingsView theme={settings.theme} onThemeChange={changeTheme} />
          </InfoScreen>
        );
      case 'credits':
        return (
          <InfoScreen title={TERMS.credits} onBack={toMenu}>
            <CreditsView />
          </InfoScreen>
        );
      case 'runLogs':
        return <RunLogsScreen current={savedRun} onBack={() => setScreen({ kind: 'menu' })} />;
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
            onMenu={() => setPaused(true)}
            onNewFight={() => setScreen({ kind: 'practiceSetup' })}
          />
        );
      case 'tutorial': {
        const { state, selectedCardId } = screen;
        const tip = currentTip({ state, selectedCardId });
        return (
          <CombatView
            state={state}
            seed={TUTORIAL_SEED}
            content={CONTENT}
            onAction={(action) =>
              setScreen({ kind: 'tutorial', state: combatReducer(state, action, CONTENT), selectedCardId: null })
            }
            onMenu={() => setPaused(true)}
            onNewFight={toMenu}
            newFightLabel={TERMS.done}
            tip={{ text: tip?.text ?? TERMS.tutorialDone, onSkip: toMenu }}
            onSelectionChange={(cardId) => setScreen({ kind: 'tutorial', state, selectedCardId: cardId })}
          />
        );
      }
      case 'run':
        return (
          <RunView
            run={screen.saved.run}
            seed={screen.saved.seed}
            content={CONTENT}
            onAction={runAction}
            onMenu={() => setPaused(true)}
            onNewRun={() => setScreen({ kind: 'menu' })}
            log={{ label: runLabel(screen.saved), text: runLogText(screen.saved) }}
          />
        );
    }
  }
}

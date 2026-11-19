/**
 * A full run: header plus whichever screen the current phase needs.
 * Only renders state and sends actions; every rule lives in src/engine.
 */
import { runReducer } from '../../engine';
import type { RunAction, RunContent, RunState } from '../../engine';
import { TERMS } from '../../data/terms';
import { CombatView } from '../combat/CombatView';
import { RunLogPanel } from '../RunLogPanel';
import { DarkWebView } from './DarkWebView';
import { IntelView } from './IntelView';
import { LootView } from './LootView';
import { MapView } from './MapView';
import type { PhaseProps } from './phaseProps';
import { RunHeader } from './RunHeader';
import { SafehouseView } from './SafehouseView';
import './run.css';

interface RunViewProps {
  run: RunState;
  seed: number;
  content: RunContent;
  onAction: (action: RunAction) => void;
  onMenu: () => void;
  onNewRun: () => void;
  /** The run's log, shown on the end screen for bug reports. */
  log: { label: string; text: string };
}

export function RunView({ run, seed, content, onAction, onMenu, onNewRun, log }: RunViewProps) {
  const props: PhaseProps = {
    run,
    content,
    act: onAction,
    // The engine returns the same object for invalid actions.
    can: (action) => runReducer(run, action, content) !== run,
  };

  if (run.outcome !== 'ongoing') {
    const won = run.outcome === 'won';
    return (
      <main className="screen">
        <RunHeader run={run} seed={seed} content={content} onMenu={onMenu} />
        <section className={won ? 'panel run-end won' : 'panel run-end lost'}>
          <h2>{won ? TERMS.runWon : TERMS.runLost}</h2>
          <p className="muted">
            {TERMS.arsenal}: {run.deck.length} · {TERMS.tools}: {run.tools.length} · {TERMS.crypto}: {run.crypto}
          </p>
          <button type="button" className="primary" onClick={onNewRun}>
            {TERMS.newRun}
          </button>
        </section>
        <RunLogPanel label={log.label} text={log.text} />
      </main>
    );
  }

  const phase = run.phase;
  if (phase.kind === 'combat') {
    return (
      <CombatView
        state={phase.combat}
        seed={seed}
        content={content}
        onAction={(action) => onAction({ type: 'COMBAT', action })}
        onMenu={onMenu}
        onNewFight={onMenu}
      />
    );
  }

  return (
    <main className="screen">
      <RunHeader run={run} seed={seed} content={content} onMenu={onMenu} />
      {phase.kind === 'map' && (
        <MapView
          run={run}
          floors={content.config.floors}
          lanes={content.config.lanes}
          onChoose={(nodeId) => onAction({ type: 'CHOOSE_NODE', nodeId })}
        />
      )}
      {phase.kind === 'loot' && <LootView {...props} />}
      {phase.kind === 'safehouse' && <SafehouseView {...props} />}
      {phase.kind === 'darkWeb' && <DarkWebView {...props} />}
      {phase.kind === 'intel' && <IntelView {...props} />}
    </main>
  );
}

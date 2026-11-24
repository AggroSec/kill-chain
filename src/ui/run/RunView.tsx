/**
 * A full run: header plus whichever screen the current phase needs.
 * Only renders state and sends actions; every rule lives in src/engine.
 */
import { useState } from 'react';
import { runReducer } from '../../engine';
import type { RunAction, RunContent, RunState } from '../../engine';
import { TERMS } from '../../data/terms';
import { CombatView } from '../combat/CombatView';
import { RunLogPanel } from '../RunLogPanel';
import { DarkWebView } from './DarkWebView';
import { IntelView } from './IntelView';
import { LootView } from './LootView';
import { getClass } from '../../data/content';
import type { RewardsSummary } from '../profile';
import { RunRewardsPanel } from '../progress/RunRewardsPanel';
import { ActIntro } from './ActIntro';
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
  /** What the finished run earned (XP, Bounties, unlocks). */
  rewards?: RewardsSummary;
}

export function RunView({ run, seed, content, onAction, onMenu, onNewRun, log, rewards }: RunViewProps) {
  // The act intro pops up once per act (UI-only state: closing it isn't a game action).
  const [introClosedFor, setIntroClosedFor] = useState<string | null>(null);
  const introKey = `${seed}:${run.act}`;
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
        {rewards !== undefined && <RunRewardsPanel rewards={rewards} className={getClass(run.classId).name} content={content} />}
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
      {phase.kind === 'map' && run.currentNodeId === null && introClosedFor !== introKey && (
        <ActIntro run={run} content={content} onClose={() => setIntroClosedFor(introKey)} />
      )}
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

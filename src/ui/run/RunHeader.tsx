/** Always-visible run status: OpSec, Crypto, floor, Heat, Tools, and an Arsenal button. */
import { useState } from 'react';
import type { RunContent, RunState } from '../../engine';
import { getClass } from '../../data/content';
import { TERMS } from '../../data/terms';
import { DeckPicker } from './DeckPicker';

interface RunHeaderProps {
  run: RunState;
  seed: number;
  content: RunContent;
  onMenu: () => void;
}

export function RunHeader({ run, seed, content, onMenu }: RunHeaderProps) {
  const [showing, setShowing] = useState<'arsenal' | 'tools' | null>(null);
  const floor = run.currentNodeId === null ? 0 : (run.map.nodes[run.currentNodeId]?.floor ?? 0);

  if (showing === 'arsenal') {
    return (
      <DeckPicker title={`${TERMS.arsenal} (${run.deck.length})`} deck={run.deck} content={content} onClose={() => setShowing(null)} />
    );
  }

  return (
    <header className="run-header">
      <div className="topbar">
        <h1>{getClass(run.classId).name}</h1>
        <button type="button" className="secondary small-button" onClick={onMenu}>
          {TERMS.mainMenu}
        </button>
      </div>
      <div className="stats">
        <span>
          {TERMS.opsec} {run.opsec}/{run.maxOpsec}
        </span>
        <span>
          {TERMS.crypto} {run.crypto}
        </span>
        <span>
          {TERMS.floor} {floor}/{content.config.floors}
        </span>
        {run.heat > 0 && (
          <span className="heat">
            {TERMS.heat} {run.heat}
          </span>
        )}
      </div>
      <div className="stats">
        <button type="button" className="secondary small-button" onClick={() => setShowing('arsenal')}>
          {TERMS.arsenal} ({run.deck.length})
        </button>
        <button
          type="button"
          className="secondary small-button"
          disabled={run.tools.length === 0}
          onClick={() => setShowing(showing === 'tools' ? null : 'tools')}
        >
          {TERMS.tools} ({run.tools.length})
        </button>
        <span className="muted">
          {TERMS.seed} {seed}
        </span>
      </div>
      {showing === 'tools' && (
        <ul className="tool-list">
          {run.tools.map((id) => (
            <li key={id}>
              <strong>{content.tools[id]?.name ?? id}</strong>: {content.tools[id]?.description}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** Menu screen listing the current run's log and the last few finished runs. */
import { getClass } from '../data/content';
import { TERMS } from '../data/terms';
import { RunLogPanel } from './RunLogPanel';
import { loadLogHistory, resultText, runLogText } from './storage';
import type { SavedRun } from './storage';
import './run/run.css';

interface RunLogsScreenProps {
  current: SavedRun | null;
  onBack: () => void;
}

/** List label for a run, e.g. "Exploit Dev, seed 123: lost on floor 13 (OpSec 0/75)". */
export function runLabel(saved: SavedRun): string {
  return `${getClass(saved.run.classId).name}, ${TERMS.seed.toLowerCase()} ${saved.seed}: ${resultText(saved.run)}`;
}

export function RunLogsScreen({ current, onBack }: RunLogsScreenProps) {
  const history = loadLogHistory();
  const empty = current === null && history.length === 0;
  return (
    <main className="combat setup">
      <div className="topbar">
        <h1>{TERMS.runLogs}</h1>
        <button type="button" className="secondary small-button" onClick={onBack}>
          {TERMS.mainMenu}
        </button>
      </div>
      <p className="muted">{TERMS.runLogHelp}</p>
      {empty && <p className="muted">{TERMS.noRunLogs}</p>}
      {current !== null && <RunLogPanel label={runLabel(current)} text={runLogText(current)} />}
      {history.map((entry, index) => (
        <RunLogPanel key={index} label={entry.label} text={entry.text} />
      ))}
    </main>
  );
}

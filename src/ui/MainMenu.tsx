/** Start screen: pick a class and start a run, continue a saved run, practice a single fight, or get run logs. */
import { CLASS_LIST } from '../data/classes';
import { TERMS } from '../data/terms';

interface MainMenuProps {
  classId: string;
  onClassChange: (id: string) => void;
  onStartRun: () => void;
  /** Present when a saved run can be continued. */
  onContinue?: () => void;
  onPractice: () => void;
  onRunLogs: () => void;
}

export function MainMenu({ classId, onClassChange, onStartRun, onContinue, onPractice, onRunLogs }: MainMenuProps) {
  return (
    <main className="combat setup">
      <h1>{TERMS.gameTitle}</h1>

      {onContinue !== undefined && (
        <button type="button" className="primary" onClick={onContinue}>
          {TERMS.continueRun}
        </button>
      )}

      <fieldset className="class-pick">
        <legend>{TERMS.chooseClass}</legend>
        {CLASS_LIST.map((cls) => (
          <label key={cls.id} className={cls.id === classId ? 'option selected' : 'option'}>
            <input type="radio" name="class" value={cls.id} checked={cls.id === classId} onChange={() => onClassChange(cls.id)} />
            <strong>{cls.name}</strong>
            <span className="muted">{cls.tagline}</span>
          </label>
        ))}
      </fieldset>

      <button type="button" className="primary" onClick={onStartRun}>
        {onContinue !== undefined ? `${TERMS.startRun} (${TERMS.abandonRun.toLowerCase()} saved run)` : TERMS.startRun}
      </button>
      <button type="button" className="secondary" onClick={onPractice}>
        {TERMS.practiceFight}
      </button>
      <button type="button" className="secondary" onClick={onRunLogs}>
        {TERMS.runLogs}
      </button>
    </main>
  );
}

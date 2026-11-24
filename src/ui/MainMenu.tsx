/** Start screen: pick a class and start a run, continue a saved run, see Bounties, practice a fight, or get run logs. */
import type { Profile } from '../engine';
import { PROGRESSION } from '../data/progression';
import { TERMS } from '../data/terms';
import { ClassPicker } from './progress/ClassPicker';

interface MainMenuProps {
  classId: string;
  onClassChange: (id: string) => void;
  profile: Profile;
  onBounties: () => void;
  onStartRun: () => void;
  /** Present when a saved run can be continued. */
  onContinue?: () => void;
  onPractice: () => void;
  onRunLogs: () => void;
  onGlossary: () => void;
  onSettings: () => void;
  onCredits: () => void;
  onHowToPlay: () => void;
  /** Present on first launch: the guided-fight offer is shown, and this hides it. */
  onDeclineTutorial?: () => void;
}

export function MainMenu({ classId, onClassChange, profile, onBounties, onStartRun, onContinue, onPractice, onRunLogs, onGlossary, onSettings, onCredits, onHowToPlay, onDeclineTutorial }: MainMenuProps) {
  return (
    <main className="screen setup">
      <h1>{TERMS.gameTitle}</h1>

      {onDeclineTutorial !== undefined && (
        <section className="panel tutorial-offer">
          <p>{TERMS.tutorialOffer}</p>
          <button type="button" className="primary" onClick={onHowToPlay}>
            {TERMS.startTutorial}
          </button>
          <button type="button" className="secondary" onClick={onDeclineTutorial}>
            {TERMS.noThanks}
          </button>
        </section>
      )}

      {onContinue !== undefined && (
        <button type="button" className="primary" onClick={onContinue}>
          {TERMS.continueRun}
        </button>
      )}

      <ClassPicker classId={classId} onClassChange={onClassChange} profile={profile} progression={PROGRESSION} />

      <button type="button" className="primary" onClick={onStartRun}>
        {onContinue !== undefined ? `${TERMS.startRun} (${TERMS.abandonRun.toLowerCase()} saved run)` : TERMS.startRun}
      </button>
      <div className="menu-row">
        <button type="button" className="secondary" onClick={onBounties}>
          {TERMS.bounties}
        </button>
        <button type="button" className="secondary" onClick={onPractice}>
          {TERMS.practiceFight}
        </button>
      </div>
      <div className="menu-row">
        <button type="button" className="secondary" onClick={onGlossary}>
          {TERMS.glossary}
        </button>
        <button type="button" className="secondary" onClick={onSettings}>
          {TERMS.settings}
        </button>
      </div>
      <div className="menu-row">
        <button type="button" className="secondary" onClick={onRunLogs}>
          {TERMS.runLogs}
        </button>
        <button type="button" className="secondary" onClick={onCredits}>
          {TERMS.credits}
        </button>
      </div>
      <button type="button" className="secondary" onClick={onHowToPlay}>
        {TERMS.howToPlay}
      </button>
    </main>
  );
}

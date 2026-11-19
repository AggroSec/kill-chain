/**
 * The in-game menu, opened from the Menu button during a run or a fight.
 * Glossary and Settings open on top, so the fight underneath is untouched.
 */
import { useState } from 'react';
import type { RunContent } from '../../engine';
import { TERMS } from '../../data/terms';
import type { ThemeId } from '../settings';
import { GlossaryView } from './GlossaryView';
import { InfoScreen } from './InfoScreen';
import { SettingsView } from './SettingsView';

interface PauseMenuProps {
  content: RunContent;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onResume: () => void;
  onQuit: () => void;
  /** Runs autosave; practice fights don't. Changes the quit label. */
  saved: boolean;
}

export function PauseMenu({ content, theme, onThemeChange, onResume, onQuit, saved }: PauseMenuProps) {
  const [view, setView] = useState<'menu' | 'glossary' | 'settings'>('menu');

  if (view === 'glossary') {
    return (
      <InfoScreen title={TERMS.glossary} onBack={() => setView('menu')} overlay>
        <GlossaryView content={content} />
      </InfoScreen>
    );
  }
  if (view === 'settings') {
    return (
      <InfoScreen title={TERMS.settings} onBack={() => setView('menu')} overlay>
        <SettingsView theme={theme} onThemeChange={onThemeChange} />
      </InfoScreen>
    );
  }

  return (
    <div className="sheet-backdrop" onClick={onResume}>
      <section className="sheet pause-menu" role="dialog" aria-label={TERMS.menu} onClick={(e) => e.stopPropagation()}>
        <h2>{TERMS.menu}</h2>
        <button type="button" className="primary" onClick={onResume}>
          {TERMS.resume}
        </button>
        <button type="button" className="secondary" onClick={() => setView('glossary')}>
          {TERMS.glossary}
        </button>
        <button type="button" className="secondary" onClick={() => setView('settings')}>
          {TERMS.settings}
        </button>
        <button type="button" className="secondary" onClick={onQuit}>
          {saved ? TERMS.quitToMenu : TERMS.quitPractice}
        </button>
        {saved && <p className="muted">{TERMS.savedNote}</p>}
      </section>
    </div>
  );
}

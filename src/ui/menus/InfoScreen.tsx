/** A full-screen page with a title and a Back button (glossary, settings, credits). */
import type { ReactNode } from 'react';
import { TERMS } from '../../data/terms';

interface InfoScreenProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  /** Render as an overlay above the current screen (from the pause menu) instead of a page. */
  overlay?: boolean;
}

export function InfoScreen({ title, onBack, children, overlay = false }: InfoScreenProps) {
  return (
    <main className={overlay ? 'overlay info-screen' : 'screen info-screen'}>
      <header className="topbar">
        <h1>{title}</h1>
        <button type="button" className="secondary small-button" onClick={onBack}>
          {TERMS.back}
        </button>
      </header>
      {children}
    </main>
  );
}

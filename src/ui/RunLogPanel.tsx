/**
 * Shows one run log with ways to get it off the phone: copy to the
 * clipboard, or open a prefilled GitHub issue. The text is also in a
 * read-only box so it can be selected by hand if the clipboard is blocked.
 */
import { useState } from 'react';
import { TERMS } from '../data/terms';

/** Where "Report on GitHub" opens a new issue. */
const NEW_ISSUE_URL = 'https://github.com/AggroSec/kill-chain/issues/new';
/** Browsers and GitHub reject very long URLs; past this, only Copy is offered. */
const MAX_ISSUE_URL_LENGTH = 7000;

interface RunLogPanelProps {
  label: string;
  text: string;
}

function issueUrl(label: string, text: string): string {
  const body = [
    '**What happened?**',
    '',
    '',
    '**Run log** (lets the run be replayed exactly)',
    '',
    '```',
    text,
    '```',
  ].join('\n');
  const params = new URLSearchParams({ title: `Run log: ${label}`, body });
  return `${NEW_ISSUE_URL}?${params.toString()}`;
}

export function RunLogPanel({ label, text }: RunLogPanelProps) {
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);
  const url = issueUrl(label, text);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('yes');
    } catch {
      // Clipboard needs a secure context and permission; fall back to manual selection.
      setCopied('failed');
    }
  }

  return (
    <section className="panel run-log">
      <strong>{label}</strong>
      <textarea readOnly value={text} rows={5} onFocus={(e) => e.currentTarget.select()} aria-label={TERMS.runLog} />
      <div className="stats">
        <button type="button" className="secondary" onClick={() => void copy()}>
          {copied === 'yes' ? TERMS.copied : TERMS.copyLog}
        </button>
        {url.length <= MAX_ISSUE_URL_LENGTH && (
          <a className="secondary link-button" href={url} target="_blank" rel="noreferrer">
            {TERMS.reportOnGitHub}
          </a>
        )}
      </div>
      {copied === 'failed' && <p className="muted">{TERMS.copyFailed}</p>}
    </section>
  );
}

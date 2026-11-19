/** Credits: who made the game and every third-party asset (see src/assets/ATTRIBUTION.md). */
import { CREDITS } from '../../data/credits';

export function CreditsView() {
  return (
    <dl className="credits">
      {CREDITS.map((line) => (
        <div key={line.label} className="glossary-entry">
          <dt>{line.label}</dt>
          <dd>
            {line.text}
            {line.url !== undefined && (
              <>
                {' '}
                <a href={line.url} target="_blank" rel="noreferrer">
                  {new URL(line.url).hostname}
                </a>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

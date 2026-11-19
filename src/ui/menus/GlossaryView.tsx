/** Every themed term with a short explanation (CLAUDE.md: flavor never costs clarity). */
import type { RunContent } from '../../engine';
import { glossarySections } from '../../data/glossary';

export function GlossaryView({ content }: { content: RunContent }) {
  return (
    <div className="glossary">
      {glossarySections(Object.values(content.statuses)).map((section) => (
        <section key={section.title} className="glossary-section">
          <h3>{section.title}</h3>
          <dl>
            {section.entries.map((entry) => (
              <div key={entry.term} className="glossary-entry">
                <dt>{entry.term}</dt>
                <dd>{entry.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

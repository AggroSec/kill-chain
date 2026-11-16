/** A row of status badges, e.g. "Vuln 3", "Throttled 1". */
import type { ContentRegistry, Statuses } from '../engine';

interface StatusChipsProps {
  statuses: Statuses;
  content: ContentRegistry;
}

export function StatusChips({ statuses, content }: StatusChipsProps) {
  const entries = Object.entries(statuses);
  if (entries.length === 0) return null;
  return (
    <ul className="chips">
      {entries.map(([id, stacks]) => {
        const def = content.statuses[id];
        return (
          <li key={id} className={`chip chip-${def?.kind ?? 'buff'}`} title={def?.description}>
            {def?.name ?? id} {stacks}
          </li>
        );
      })}
    </ul>
  );
}

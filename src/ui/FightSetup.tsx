/** Debug screen: choose a class and an encounter. */
import { CLASS_LIST } from '../data/classes';
import { ENCOUNTER_LIST } from '../data/encounters';
import { CONTENT } from '../data/content';
import { TERMS } from '../data/terms';

interface FightSetupProps {
  classId: string;
  encounterId: string;
  onClassChange: (id: string) => void;
  onEncounterChange: (id: string) => void;
  onStart: () => void;
}

function encounterLabel(enemyIds: readonly string[]): string {
  return enemyIds.map((id) => CONTENT.enemies[id]?.name ?? id).join(' + ');
}

export function FightSetup({ classId, encounterId, onClassChange, onEncounterChange, onStart }: FightSetupProps) {
  const selectedClass = CLASS_LIST.find((c) => c.id === classId);
  return (
    <main className="combat setup">
      <h1>{TERMS.gameTitle}</h1>

      <label className="field">
        <span>{TERMS.chooseClass}</span>
        <select value={classId} onChange={(e) => onClassChange(e.target.value)}>
          {CLASS_LIST.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </label>
      {selectedClass && <p className="muted">{selectedClass.tagline}</p>}

      <label className="field">
        <span>{TERMS.chooseEncounter}</span>
        <select value={encounterId} onChange={(e) => onEncounterChange(e.target.value)}>
          {ENCOUNTER_LIST.map((enc) => (
            <option key={enc.id} value={enc.id}>
              {encounterLabel(enc.enemies)} ({enc.tier})
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="primary" onClick={onStart}>
        {TERMS.startFight}
      </button>
    </main>
  );
}

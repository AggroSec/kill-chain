/**
 * Class choice for a new run: each class's level, XP bar, passive and
 * pitch. Locked classes are shown greyed out with the Bounty that unlocks them.
 */
import { classLevel, isClassUnlocked, nextLevelXp } from '../../engine';
import type { Profile, ProgressionDef } from '../../engine';
import { CLASS_LIST } from '../../data/classes';
import { TERMS } from '../../data/terms';
import { bountyUnlockingClass } from './unlockText';

interface ClassPickerProps {
  classId: string;
  onClassChange: (id: string) => void;
  profile: Profile;
  progression: ProgressionDef;
}

export function ClassPicker({ classId, onClassChange, profile, progression }: ClassPickerProps) {
  return (
    <fieldset className="class-pick">
      <legend>{TERMS.chooseClass}</legend>
      {CLASS_LIST.map((cls) => {
        const unlocked = isClassUnlocked(cls.id, profile, progression);
        const levels = progression.classLevels[cls.id] ?? [];
        const xp = profile.classXp[cls.id] ?? 0;
        const level = classLevel(xp, levels);
        const next = nextLevelXp(xp, levels);
        const bounty = unlocked ? undefined : bountyUnlockingClass(cls.id, progression);
        const classes = ['option', cls.id === classId ? 'selected' : '', unlocked ? '' : 'locked'].join(' ');
        return (
          <label key={cls.id} className={classes}>
            <input
              type="radio"
              name="class"
              value={cls.id}
              checked={cls.id === classId}
              disabled={!unlocked}
              onChange={() => onClassChange(cls.id)}
            />
            <span className="class-title">
              <strong>{cls.name}</strong>
              <span className="class-level">{unlocked ? `${TERMS.level} ${level}` : TERMS.locked}</span>
            </span>
            {unlocked && (
              <span className="xp-bar" aria-label={`${xp} ${TERMS.xp}`}>
                <span className="xp-fill" style={{ width: `${next === null ? 100 : Math.min(100, (xp / next) * 100)}%` }} />
                <span className="xp-label">{next === null ? `${xp} ${TERMS.xp} · ${TERMS.maxLevel}` : `${xp} / ${next} ${TERMS.xp}`}</span>
              </span>
            )}
            <span className="muted">{cls.tagline}</span>
            <span className="class-passive">
              <strong>{cls.passiveName}:</strong> {cls.passiveText}
            </span>
            {bounty !== undefined && (
              <span className="class-unlock">
                {TERMS.unlockedBy} {TERMS.bounty} “{bounty.name}”: {bounty.description}
              </span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}

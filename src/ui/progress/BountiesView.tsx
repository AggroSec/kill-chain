/** Class levels and Bounties: what you've earned and what's next. Reached from the main menu. */
import { classLevel } from '../../engine';
import type { Profile, ProgressionDef, RunContent } from '../../engine';
import { CLASS_LIST } from '../../data/classes';
import { TERMS } from '../../data/terms';
import { unlockText } from './unlockText';

interface BountiesViewProps {
  profile: Profile;
  progression: ProgressionDef;
  content: RunContent;
}

export function BountiesView({ profile, progression, content }: BountiesViewProps) {
  return (
    <div className="progress-view">
      <section className="panel">
        <h2>{TERMS.classLevels}</h2>
        <p className="muted">{TERMS.levelsHelp}</p>
        {CLASS_LIST.map((cls) => {
          const xp = profile.classXp[cls.id] ?? 0;
          const levels = progression.classLevels[cls.id] ?? [];
          const level = classLevel(xp, levels);
          return (
            <div key={cls.id} className="level-track">
              <h3>
                {cls.name} · {TERMS.level} {level} · {xp} {TERMS.xp}
              </h3>
              <ol className="level-list">
                {levels.map((def) => (
                  <li key={def.level} className={xp >= def.xp ? 'earned' : ''}>
                    <span className="level-num">
                      {TERMS.level} {def.level} ({def.xp} {TERMS.xp})
                    </span>
                    <span>{def.unlocks.map((u) => unlockText(u, content)).join(', ')}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h2>{TERMS.bounties}</h2>
        <p className="muted">{TERMS.bountiesHelp}</p>
        <ul className="bounty-list">
          {progression.bounties.map((bounty) => {
            const earned = profile.bounties.includes(bounty.id);
            const rewards = [`+${bounty.xp} ${TERMS.xp}`, ...bounty.unlocks.map((u) => unlockText(u, content))];
            return (
              <li key={bounty.id} className={earned ? 'bounty earned' : 'bounty'}>
                <span className="bounty-check" aria-label={earned ? TERMS.earned : TERMS.locked}>
                  {earned ? '✓' : '○'}
                </span>
                <span className="bounty-body">
                  <strong>{bounty.name}</strong>
                  <span>{bounty.description}</span>
                  <span className="muted">{rewards.join(' · ')}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

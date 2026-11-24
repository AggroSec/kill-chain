/** The run-end summary of what the run earned: XP, levels, Bounties and unlocks. */
import type { RunContent } from '../../engine';
import { TERMS } from '../../data/terms';
import type { RewardsSummary } from '../profile';
import { unlockText } from './unlockText';

interface RunRewardsPanelProps {
  rewards: RewardsSummary;
  className: string;
  content: RunContent;
}

export function RunRewardsPanel({ rewards, className, content }: RunRewardsPanelProps) {
  return (
    <section className="panel run-rewards">
      <h3>{TERMS.progress}</h3>
      <p>
        {TERMS.xpGained}: <strong>+{rewards.totalXp}</strong> {className} {TERMS.xp}
        {rewards.newBounties.length > 0 && <span className="muted"> ({rewards.runXp} from the run)</span>}
      </p>
      {rewards.levelAfter > rewards.levelBefore && (
        <p className="level-up">
          {TERMS.levelUp}! {className} {TERMS.level} {rewards.levelAfter}
        </p>
      )}
      {rewards.newBounties.map((bounty) => (
        <p key={bounty.id}>
          ✓ {TERMS.bounty}: <strong>{bounty.name}</strong> (+{bounty.xp} {TERMS.xp})
        </p>
      ))}
      {rewards.newUnlocks.length > 0 && (
        <p>
          {TERMS.newUnlocks}: {rewards.newUnlocks.map((u) => unlockText(u, content)).join(', ')}
        </p>
      )}
    </section>
  );
}

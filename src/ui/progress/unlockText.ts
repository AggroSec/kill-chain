/** Short labels for unlocks, e.g. "Card: Spearphishing Voice" or "Class: Insider". */
import type { BountyDef, ProgressionDef, RunContent, Unlock } from '../../engine';
import { CLASSES } from '../../data/content';
import { TERMS } from '../../data/terms';

export function unlockText(unlock: Unlock, content: RunContent): string {
  switch (unlock.kind) {
    case 'card':
      return `${content.cards[unlock.cardId]?.name ?? unlock.cardId}`;
    case 'class':
      return `${TERMS.newClass}: ${CLASSES[unlock.classId]?.name ?? unlock.classId}`;
    case 'mode':
      return `${TERMS.newMode}: ${unlock.modeId}`;
  }
}

/** The Bounty that unlocks a class, if any (for "Unlock with ..." on the class picker). */
export function bountyUnlockingClass(classId: string, progression: ProgressionDef): BountyDef | undefined {
  return progression.bounties.find((b) => b.unlocks.some((u) => u.kind === 'class' && u.classId === classId));
}

/**
 * The guided first fight (#9, approved by AggroSec in #17): a fixed-seed
 * Social Engineer fight against one Firewall. Tips walk through selecting
 * a card, targeting, Cycles, a 3-card Chain and ending the turn, then the
 * player finishes the fight alone.
 *
 * The seed is chosen so the opening 6-card hand holds Pretexting (step 1),
 * Phishing (step 3) and Masquerade (step 7). tutorial.test.ts checks this,
 * so a content change that breaks the script fails a test instead of
 * confusing a new player.
 */
import { startCombat, TACTICS_IN_ORDER } from '../engine';
import type { CombatSetup, CombatState } from '../engine';
import { CONTENT, starterFight } from './content';

export const TUTORIAL_CLASS = 'social-engineer';
export const TUTORIAL_ENCOUNTER = 'a1-firewall';
export const TUTORIAL_SEED = 11;

/** Starter Arsenal against a lone Firewall, with one extra card on turn 1 (a 6-card hand). */
export function tutorialSetup(): CombatSetup {
  return { ...starterFight(TUTORIAL_CLASS, TUTORIAL_ENCOUNTER), modifiers: { firstTurnDraw: 1 } };
}

export function startTutorial(): CombatState {
  return startCombat(tutorialSetup(), TUTORIAL_SEED, CONTENT);
}

/** What the tips can look at: the fight, and which card (if any) is selected in hand. */
export interface TutorialView {
  state: CombatState;
  selectedCardId: string | null;
}

export interface TutorialTip {
  id: string;
  text: string;
  /** The tip is finished once this is true; the next unfinished tip shows. */
  done: (view: TutorialView) => boolean;
}

const RECON = TACTICS_IN_ORDER.indexOf('reconnaissance');
const inTurn = (view: TutorialView, turn: number) => view.state.turn > turn || view.state.outcome !== 'ongoing';

/** Tips in order. Text describes game actions only (content safety). */
export const TUTORIAL_TIPS: readonly TutorialTip[] = [
  {
    id: 'select',
    text: 'Welcome, Operator. Your hand is at the bottom, the Firewall is at the top. Tap Pretexting to look at it.',
    done: (v) => v.selectedCardId === 'pretexting' || v.state.chain.lastTacticIndex !== null || inTurn(v, 1),
  },
  {
    id: 'target',
    text: 'Pretexting is kill chain step 1. Tap the Firewall to play it at that target.',
    done: (v) => v.state.chain.lastTacticIndex !== null || inTurn(v, 1),
  },
  {
    id: 'chain',
    text: 'Cards marked ▲ go later in the kill chain, so they build Chain. Play Phishing (step 3) at the Firewall.',
    done: (v) => (v.state.chain.count >= 1 && v.state.chain.lastTacticIndex !== RECON) || inTurn(v, 1),
  },
  {
    id: 'block',
    text: 'Chain 1: each stack adds +2 damage and +2 Block. The Firewall attacks next (⚔), so play Masquerade (step 7) for boosted Block.',
    done: (v) => v.state.chain.count >= 2 || inTurn(v, 1),
  },
  {
    id: 'end-turn',
    text: 'Each card costs Cycles (⚡, the number in its corner) and you get 3 a turn. Out of Cycles: tap End Turn.',
    done: (v) => inTurn(v, 1),
  },
  {
    id: 'finish',
    text: 'New turn, new hand, and Chain starts over. Tap an enemy any time to see what it will do. Take down the Firewall!',
    done: (v) => v.state.outcome !== 'ongoing',
  },
];

/** The first tip that isn't done yet, or null when the script is over. */
export function currentTip(view: TutorialView): TutorialTip | null {
  return TUTORIAL_TIPS.find((tip) => !tip.done(view)) ?? null;
}

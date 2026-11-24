/**
 * Kill-chain combos.
 *
 * Every card has an ATT&CK tactic. Within one turn, playing a card whose
 * tactic comes LATER in the kill chain than the previous card's adds a Chain
 * stack. Same tactic or an earlier one breaks the Chain back to 0, and that
 * card starts a new sequence. Chain resets at the start of every turn.
 *
 * Example: Recon -> Initial Access -> Credential Access = Chain 2.
 *          Then another Initial Access => Chain 0.
 */
import { TACTICS_IN_ORDER } from './contentTypes';
import type { Tactic } from './contentTypes';
import type { ChainState } from './types';

/**
 * The Chain at the start of a turn. `startIndex` is a tactic the turn counts
 * as already played (the Insider's Trusted Access starts at Initial Access),
 * or null for the normal empty Chain.
 */
export function emptyChain(startIndex: number | null = null): ChainState {
  return { count: 0, lastTacticIndex: startIndex };
}

/** Position of a tactic in the kill chain (reconnaissance = 0 ... impact = 13). */
export function tacticIndex(tactic: Tactic): number {
  return TACTICS_IN_ORDER.indexOf(tactic);
}

/** Would playing this tactic next extend the Chain? (The first card of a turn never does.) */
export function extendsChain(chain: ChainState, tactic: Tactic): boolean {
  return chain.lastTacticIndex !== null && tacticIndex(tactic) > chain.lastTacticIndex;
}

/** The Chain after playing a card with this tactic. */
export function advanceChain(chain: ChainState, tactic: Tactic): ChainState {
  return {
    count: extendsChain(chain, tactic) ? chain.count + 1 : 0,
    lastTacticIndex: tacticIndex(tactic),
  };
}

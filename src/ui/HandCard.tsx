/** A card in hand: tap to play. Highlights cards that would extend the Chain. */
import { extendsChain, getCardDef } from '../engine';
import type { CardInstance, CombatState, ContentRegistry } from '../engine';
import { CardFace } from './CardFace';

interface HandCardProps {
  card: CardInstance;
  state: CombatState;
  content: ContentRegistry;
  playable: boolean;
  onPlay: () => void;
}

export function HandCard({ card, state, content, playable, onPlay }: HandCardProps) {
  const def = getCardDef(content, card.defId);
  return (
    <button type="button" className={`card card-${def.type}`} disabled={!playable} onClick={onPlay}>
      <CardFace def={def} content={content} extendsChain={extendsChain(state.chain, def.tactic)} />
    </button>
  );
}

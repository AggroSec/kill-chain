/** A card in hand. Shows cost, name, tactic, generated text and Chain hint. */
import { extendsChain, getCardDef } from '../engine';
import type { CardInstance, CombatState, ContentRegistry } from '../engine';
import { RARITY_NAMES, TERMS } from '../data/terms';
import { TACTIC_NAMES } from '../data/tactics';
import { describeCard } from './describe';

interface HandCardProps {
  card: CardInstance;
  state: CombatState;
  content: ContentRegistry;
  playable: boolean;
  onPlay: () => void;
}

export function HandCard({ card, state, content, playable, onPlay }: HandCardProps) {
  const def = getCardDef(content, card.defId);
  const chains = extendsChain(state.chain, def.tactic);
  return (
    <button type="button" className={`card card-${def.type}`} disabled={!playable} onClick={onPlay}>
      <span className="card-top">
        <span className="card-cost">{def.cost}</span>
        <span className="card-rarity">{RARITY_NAMES[def.rarity]}</span>
      </span>
      <span className="card-name">{def.name}</span>
      <span className={chains ? 'card-tactic chains' : 'card-tactic'}>
        {TACTIC_NAMES[def.tactic]}
        {chains && ` ▲ ${TERMS.chain}`}
      </span>
      <span className="card-text">{describeCard(def, content)}</span>
    </button>
  );
}

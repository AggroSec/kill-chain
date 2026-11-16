/**
 * The inside of a card: cost, rarity, name, kill chain step, and generated
 * text. Used in the hand (as a play button) and in Loot, shop and Arsenal lists.
 */
import type { CardDef, ContentRegistry } from '../engine';
import { RARITY_NAMES, TERMS } from '../data/terms';
import { tacticLabel } from '../data/tactics';
import { describeCard } from './describe';

interface CardFaceProps {
  def: CardDef;
  content: ContentRegistry;
  /** Highlight that this card would extend the current Chain. */
  extendsChain?: boolean;
}

export function CardFace({ def, content, extendsChain = false }: CardFaceProps) {
  return (
    <>
      <span className="card-top">
        <span className="card-cost">{def.cost}</span>
        <span className="card-rarity">{RARITY_NAMES[def.rarity]}</span>
      </span>
      <span className="card-name">{def.name}</span>
      <span className={extendsChain ? 'card-tactic chains' : 'card-tactic'}>
        {tacticLabel(def.tactic)}
        {extendsChain && ` ▲ ${TERMS.chain}`}
      </span>
      <span className="card-text">{describeCard(def, content)}</span>
    </>
  );
}

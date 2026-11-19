/**
 * The selected card, shown full size above the hand with its numbers at the
 * Chain it would be played at. Says what to do next: tap an enemy, tap
 * Play, or why it can't be played.
 */
import { cardAtChain, cardNeedsTarget, chainIfPlayed, getCardDef } from '../../engine';
import type { CombatState, ContentRegistry } from '../../engine';
import { TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';

interface SelectedCardProps {
  state: CombatState;
  content: ContentRegistry;
  handIndex: number;
  /** The one living enemy, if there's only one (a targeted card can then be played with the button). */
  onlyTarget: number | null;
  onPlay: (targetIndex: number) => void;
  onCancel: () => void;
}

export function SelectedCard({ state, content, handIndex, onlyTarget, onPlay, onCancel }: SelectedCardProps) {
  const card = state.player.hand[handIndex];
  if (card === undefined) return null;
  const def = getCardDef(content, card.defId);
  const chain = chainIfPlayed(state, def);
  const shown = cardAtChain(def, chain);
  const needsTarget = cardNeedsTarget(def);
  const affordable = def.cost <= state.player.cycles;

  let hint = '';
  if (!affordable) hint = TERMS.notEnoughCycles;
  else if (needsTarget) hint = TERMS.tapEnemy;
  // Targeted cards can use the button too when there's only one possible target.
  const canUseButton = affordable && (!needsTarget || onlyTarget !== null);

  return (
    <section className="selected-card" aria-live="polite">
      <div className="selected-card-face">
        <CardFace def={shown} content={content} diffStyle="boost" {...(chain > 0 ? { compareTo: def } : {})} />
      </div>
      <div className="selected-card-actions">
        {chain > 0 && (
          <p className="chain-note">
            ▲ {TERMS.chain} {chain}
          </p>
        )}
        {hint !== '' && <p className={affordable ? 'muted' : 'warn'}>{hint}</p>}
        {canUseButton && (
          <button type="button" className="primary" onClick={() => onPlay(needsTarget ? (onlyTarget ?? 0) : 0)}>
            {TERMS.play}
          </button>
        )}
        <button type="button" className="secondary" onClick={onCancel}>
          {TERMS.cancel}
        </button>
      </div>
    </section>
  );
}

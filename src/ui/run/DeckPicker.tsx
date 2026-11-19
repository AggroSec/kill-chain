/**
 * Pick one card from the Arsenal (for Weaponize, Go Dark, Wipe and some
 * Intel events), or just browse it when `onPick` is omitted.
 */
import type { ContentRegistry } from '../../engine';
import { TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';

interface DeckPickerProps {
  title: string;
  deck: readonly string[];
  content: ContentRegistry;
  /** Which cards can be picked. Others are shown dimmed. Defaults to all. */
  canPick?: (deckIndex: number) => boolean;
  onPick?: (deckIndex: number) => void;
  onClose: () => void;
  /** Show a different card in a slot, e.g. the v2 when choosing what to Weaponize. */
  displayAs?: (cardId: string) => string;
}

export function DeckPicker({ title, deck, content, canPick = () => true, onPick, onClose, displayAs }: DeckPickerProps) {
  return (
    <section className="overlay" role="dialog" aria-label={title}>
      <header className="topbar">
        <h2>{title}</h2>
        <button type="button" className="secondary" onClick={onClose}>
          {onPick === undefined ? TERMS.close : TERMS.cancel}
        </button>
      </header>
      <div className="card-grid">
        {deck.map((cardId, index) => {
          const def = content.cards[displayAs?.(cardId) ?? cardId];
          if (def === undefined) return null;
          const pickable = onPick !== undefined && canPick(index);
          return (
            <button
              // Duplicate card ids are common, so the position is part of the key.
              key={`${cardId}-${index}`}
              type="button"
              className="card-button"
              disabled={onPick !== undefined && !pickable}
              onClick={() => pickable && onPick(index)}
            >
              <CardFace def={def} content={content} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

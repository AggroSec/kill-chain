/**
 * Pick one card from the Arsenal (Weaponize, Go Dark, Wipe and some Intel
 * events), or just browse it when `onPick` is omitted.
 *
 * Picking is two taps, like playing a card: tap to select, then confirm.
 * A stray tap while scrolling on a phone can't upgrade or delete the wrong card.
 *
 * With `showUpgrades`, each card is shown as its v2 with the changes
 * highlighted ("8 → 11") and a short badge ("−1 Cost"), per #14.
 */
import { useState } from 'react';
import { canUpgrade, upgradedId } from '../../engine';
import type { ContentRegistry } from '../../engine';
import { TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';
import { upgradeSummary } from '../upgradeSummary';

interface DeckPickerProps {
  title: string;
  deck: readonly string[];
  content: ContentRegistry;
  /** Which cards can be picked. Others are shown dimmed. Defaults to all. */
  canPick?: (deckIndex: number) => boolean;
  onPick?: (deckIndex: number) => void;
  /** Label for the confirm button, e.g. "Weaponize". */
  confirmLabel?: string;
  onClose: () => void;
  /** Show each card as its v2 with the changes highlighted (Weaponize). */
  showUpgrades?: boolean;
}

export function DeckPicker({ title, deck, content, canPick = () => true, onPick, confirmLabel, onClose, showUpgrades = false }: DeckPickerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const selectedId = selected === null ? undefined : deck[selected];
  const selectedName = selectedId === undefined ? '' : (content.cards[selectedId]?.name ?? selectedId);

  return (
    <section className="overlay picker" role="dialog" aria-label={title}>
      <header className="topbar">
        <h2>{title}</h2>
        <button type="button" className="secondary small-button" onClick={onClose}>
          {onPick === undefined ? TERMS.close : TERMS.cancel}
        </button>
      </header>
      <div className="card-grid">
        {deck.map((cardId, index) => {
          const base = content.cards[cardId];
          if (base === undefined) return null;
          const upgradable = showUpgrades && canUpgrade(content.cards, cardId);
          const v2 = upgradable ? content.cards[upgradedId(cardId)] : undefined;
          const pickable = onPick !== undefined && canPick(index);
          return (
            <div key={`${cardId}-${index}`} className="picker-slot">
              <button
                // Duplicate card ids are common, so the position is part of the key.
                type="button"
                className={selected === index ? 'card-button selected' : 'card-button'}
                disabled={onPick !== undefined && !pickable}
                aria-pressed={selected === index}
                onClick={() => pickable && setSelected(selected === index ? null : index)}
              >
                {v2 !== undefined ? (
                  <CardFace def={v2} content={content} compareTo={base} diffStyle="upgrade" />
                ) : (
                  <CardFace def={base} content={content} />
                )}
              </button>
              {v2 !== undefined && <span className="v2-badge">v2: {upgradeSummary(base, v2, content)}</span>}
            </div>
          );
        })}
      </div>
      {onPick !== undefined && (
        <div className="picker-confirm">
          <button
            type="button"
            className="primary"
            disabled={selected === null}
            onClick={() => {
              if (selected === null) return;
              setSelected(null);
              onPick(selected);
            }}
          >
            {selected === null ? TERMS.pickCard : `${confirmLabel ?? TERMS.done}: ${selectedName}`}
          </button>
        </div>
      )}
    </section>
  );
}

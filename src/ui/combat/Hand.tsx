/**
 * The hand as an overlapping fan (AggroSec, M4 planning #17).
 *
 * All cards always fit the screen width: they overlap more as the hand
 * grows, so 10 cards still fit on a 360px phone with no scrolling. Cards
 * tilt slightly around the middle like a hand of cards. The selected card
 * lifts out of the fan; its full text shows in the panel above.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { extendsChain, getCardDef } from '../../engine';
import type { CombatState, ContentRegistry } from '../../engine';
import { TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';

/** Width of a card in the fan, in px. Keep in sync with .hand-card in combat.css. */
const CARD_WIDTH = 96;
/** Gap between cards when there's room, in px. */
const MAX_GAP = 6;
/** Most tilt for an outer card, in degrees. */
const MAX_TILT = 10;

interface HandProps {
  state: CombatState;
  content: ContentRegistry;
  selected: number | null;
  /** Hand indexes of cards that can't be played right now (shown dimmed). */
  unplayable: ReadonlySet<number>;
  /** Tap: select the card, or put it back if it's already selected. */
  onTap: (handIndex: number) => void;
  /** Slide: select whichever card is under the finger. */
  onSlide: (handIndex: number) => void;
}

/** Tracks an element's width so the fan can be laid out to fit it. */
function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/**
 * Position of card `index` in a fan of `count` cards across `width` px.
 * Returns the left offset, tilt and drop (outer cards sit a little lower).
 */
export function fanPosition(index: number, count: number, width: number): { left: number; tilt: number; drop: number } {
  // Space per card: a small gap if everything fits, otherwise overlap just enough to fit.
  const step = count <= 1 ? 0 : Math.min(CARD_WIDTH + MAX_GAP, (width - CARD_WIDTH) / (count - 1));
  const total = CARD_WIDTH + step * Math.max(0, count - 1);
  const start = (width - total) / 2;
  // -1 for the leftmost card, +1 for the rightmost.
  const offset = count <= 1 ? 0 : (index - (count - 1) / 2) / ((count - 1) / 2);
  const tilt = offset * Math.min(MAX_TILT, count * 1.5);
  return { left: start + index * step, tilt, drop: offset * offset * 10 };
}

/**
 * Index of the card under x (px from the fan's left edge). Cards to the right
 * sit on top, so the last card whose span contains x wins.
 */
export function cardAt(x: number, count: number, width: number): number | null {
  let found: number | null = null;
  for (let i = 0; i < count; i++) {
    const { left } = fanPosition(i, count, width);
    if (x >= left && x <= left + CARD_WIDTH) found = i;
  }
  return found;
}

export function Hand({ state, content, selected, unplayable, onTap, onSlide }: HandProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const cards = state.player.hand;
  // Slide-to-select: with 10 cards each one shows only ~27px on a small phone,
  // so sliding a finger across the fan lifts the card under it. Optional: taps still work.
  const sliding = useRef<{ startX: number; moved: boolean } | null>(null);

  function pointerX(event: React.PointerEvent<HTMLDivElement>): number {
    return event.clientX - event.currentTarget.getBoundingClientRect().left;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    sliding.current = { startX: event.clientX, moved: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const slide = sliding.current;
    if (slide === null) return;
    // Ignore small wobbles so an ordinary tap stays a tap.
    if (!slide.moved && Math.abs(event.clientX - slide.startX) < 8) return;
    slide.moved = true;
    const index = cardAt(pointerX(event), cards.length, width);
    if (index !== null && index !== selected) onSlide(index);
  }

  function onClickCapture(event: React.MouseEvent) {
    // A slide that ends on a card shouldn't also count as a tap on it.
    if (sliding.current?.moved === true) event.stopPropagation();
    sliding.current = null;
  }

  return (
    <div
      className="hand-fan"
      ref={ref}
      aria-label={TERMS.hand}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        // Clear after the click (if any) has been handled.
        setTimeout(() => (sliding.current = null), 0);
      }}
      onPointerCancel={() => (sliding.current = null)}
      onClickCapture={onClickCapture}
    >
      {cards.map((card, index) => {
        const def = getCardDef(content, card.defId);
        const { left, tilt, drop } = fanPosition(index, cards.length, width);
        const isSelected = index === selected;
        const style: CSSProperties = {
          left,
          transform: isSelected ? 'translateY(-26px) scale(1.06)' : `translateY(${drop}px) rotate(${tilt}deg)`,
          zIndex: isSelected ? 50 : index + 1,
        };
        const classes = ['hand-card', isSelected ? 'selected' : '', unplayable.has(index) ? 'unplayable' : ''];
        return (
          <button
            key={card.uid}
            type="button"
            className={classes.join(' ')}
            style={style}
            aria-pressed={isSelected}
            aria-label={def.name}
            onClick={() => onTap(index)}
          >
            <CardFace def={def} content={content} size="mini" extendsChain={extendsChain(state.chain, def.tactic)} />
          </button>
        );
      })}
    </div>
  );
}

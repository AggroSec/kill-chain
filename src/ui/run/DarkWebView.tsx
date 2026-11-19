/** Dark Web: buy cards and Tools, or pay to Wipe cards (price rises each time). */
import { useState } from 'react';
import { wipePrice } from '../../engine';
import { NODE_NAMES, TERMS } from '../../data/terms';
import { CardFace } from '../CardFace';
import { DeckPicker } from './DeckPicker';
import type { PhaseProps } from './phaseProps';

export function DarkWebView({ run, content, act, can }: PhaseProps) {
  const [wiping, setWiping] = useState(false);
  /** Card selected for buying (tap to select, then confirm, like everywhere else). */
  const [selected, setSelected] = useState<number | null>(null);
  if (run.phase.kind !== 'darkWeb') return null;
  const { cards, tools } = run.phase;
  const price = wipePrice(run, content);

  if (wiping) {
    return (
      <DeckPicker
        title={`${TERMS.wipe} (${price} ${TERMS.crypto})`}
        deck={run.deck}
        content={content}
        confirmLabel={TERMS.wipe}
        canPick={(i) => can({ type: 'BUY_WIPE', deckIndex: i })}
        onPick={(i) => {
          setWiping(false);
          act({ type: 'BUY_WIPE', deckIndex: i });
        }}
        onClose={() => setWiping(false)}
      />
    );
  }

  return (
    <section className="panel">
      <h2>{NODE_NAMES.darkWeb}</h2>
      <div className="card-grid">
        {cards.map((item, index) => {
          const def = content.cards[item.id];
          if (def === undefined) return null;
          return (
            <div key={item.id} className="shop-item">
              <button
                type="button"
                className={selected === index ? 'card-button selected' : 'card-button'}
                disabled={!can({ type: 'BUY_CARD', index })}
                aria-pressed={selected === index}
                onClick={() => setSelected(selected === index ? null : index)}
              >
                <CardFace def={def} content={content} />
              </button>
              <span className="price">{item.sold ? TERMS.sold : `${item.price} ${TERMS.crypto}`}</span>
            </div>
          );
        })}
      </div>
      {selected !== null && cards[selected] !== undefined && (
        <button
          type="button"
          className="primary"
          disabled={!can({ type: 'BUY_CARD', index: selected })}
          onClick={() => {
            setSelected(null);
            act({ type: 'BUY_CARD', index: selected });
          }}
        >
          {TERMS.buy} {content.cards[cards[selected].id]?.name} · {cards[selected].price} {TERMS.crypto}
        </button>
      )}
      {tools.map((item, index) => {
        const tool = content.tools[item.id];
        if (tool === undefined) return null;
        return (
          <button key={item.id} type="button" className="option" disabled={!can({ type: 'BUY_TOOL', index })} onClick={() => act({ type: 'BUY_TOOL', index })}>
            <strong>
              {tool.name} · {item.sold ? TERMS.sold : `${item.price} ${TERMS.crypto}`}
            </strong>
            <span className="muted">{tool.description}</span>
          </button>
        );
      })}
      <button type="button" className="option" disabled={!can({ type: 'BUY_WIPE', deckIndex: 0 })} onClick={() => setWiping(true)}>
        <strong>
          {TERMS.wipe} · {price} {TERMS.crypto}
        </strong>
        <span className="muted">Remove 1 card from your {TERMS.arsenal}. The price rises each time.</span>
      </button>
      <button type="button" className="secondary" onClick={() => act({ type: 'LEAVE' })}>
        {TERMS.leave}
      </button>
    </section>
  );
}

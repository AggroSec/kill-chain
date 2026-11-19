/** Intel event: the scene text and its choices. Some choices need you to pick a card first. */
import { useState } from 'react';
import { runEffectsNeedDeckIndex } from '../../engine';
import { TERMS } from '../../data/terms';
import { DeckPicker } from './DeckPicker';
import type { PhaseProps } from './phaseProps';

export function IntelView({ run, content, act, can }: PhaseProps) {
  const [pickingFor, setPickingFor] = useState<number | null>(null);
  if (run.phase.kind !== 'intel') return null;
  const event = content.events[run.phase.eventId];
  if (event === undefined) return null;

  if (pickingFor !== null) {
    const index = pickingFor;
    return (
      <DeckPicker
        title={event.choices[index]?.label ?? event.title}
        deck={run.deck}
        content={content}
        confirmLabel={TERMS.choose}
        canPick={(deckIndex) => can({ type: 'EVENT_CHOICE', index, deckIndex })}
        onPick={(deckIndex) => {
          setPickingFor(null);
          act({ type: 'EVENT_CHOICE', index, deckIndex });
        }}
        onClose={() => setPickingFor(null)}
      />
    );
  }

  return (
    <section className="panel">
      <h2>{event.title}</h2>
      <p>{event.text}</p>
      {event.choices.map((choice, index) => {
        const needsCard = runEffectsNeedDeckIndex(choice.effects);
        // A card-picking choice is available if at least one card can be picked.
        const available = needsCard
          ? run.deck.some((_, deckIndex) => can({ type: 'EVENT_CHOICE', index, deckIndex }))
          : can({ type: 'EVENT_CHOICE', index });
        return (
          <button
            key={choice.label}
            type="button"
            className="option"
            disabled={!available}
            onClick={() => (needsCard ? setPickingFor(index) : act({ type: 'EVENT_CHOICE', index }))}
          >
            {/* Labels spell out costs and effects (see src/data/events.ts). */}
            <span>{choice.label}</span>
          </button>
        );
      })}
    </section>
  );
}

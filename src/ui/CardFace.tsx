/**
 * The inside of a card: cost, name, art (or the generated placeholder),
 * kill chain step, and text. Used everywhere a card is shown.
 *
 * Two sizes:
 * - "mini": the hand fan. Cost, name, art and step only; the full text shows
 *   when the card is selected.
 * - "full": Loot, Dark Web, Arsenal and the selected-card panel.
 *
 * Pass `compareTo` to highlight what changed against another version of the
 * card: "upgrade" shows old → new (v2 previews), "boost" only highlights the
 * new numbers (Chain bonus in hand).
 */
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { baseCardId, isUpgraded } from '../engine';
import type { CardDef, ContentRegistry } from '../engine';
import { RARITY_NAMES, TERMS } from '../data/terms';
import { TACTIC_NAMES, tacticHue, tacticStep } from '../data/tactics';
import { cardArtUrl, tacticIconUrl } from './cardArt';
import { describeCard } from './describe';
import { diffWords } from './textDiff';
import type { DiffSegment } from './textDiff';

interface CardFaceProps {
  def: CardDef;
  content: ContentRegistry;
  size?: 'mini' | 'full';
  /** Another version of this card to compare against (the base card for a v2, or the unboosted card). */
  compareTo?: CardDef;
  diffStyle?: 'upgrade' | 'boost';
  /** Highlight that this card would extend the current Chain. */
  extendsChain?: boolean;
}

/** Card art if the card has a working image, otherwise the tactic placeholder. */
function CardArt({ def }: { def: CardDef }) {
  const url = cardArtUrl(def.art);
  const [failed, setFailed] = useState(false);
  if (url !== undefined && !failed) {
    return <img className="card-art" src={url} alt="" onError={() => setFailed(true)} />;
  }
  const icon = tacticIconUrl(def.tactic);
  // Quoted, because small SVGs are inlined as data: URLs that aren't valid unquoted.
  const mask = icon === undefined ? undefined : `url(${JSON.stringify(icon)})`;
  return (
    <span className="card-art placeholder" aria-hidden="true">
      {mask !== undefined && <span className="tactic-icon" style={{ maskImage: mask, WebkitMaskImage: mask }} />}
    </span>
  );
}

/** Renders diff segments: changed words highlighted, old values shown as "8 → " when asked. */
function DiffText({ segments, showOld }: { segments: DiffSegment[]; showOld: boolean }) {
  const parts: ReactNode[] = [];
  segments.forEach((segment, index) => {
    if (index > 0) parts.push(' ');
    if (segment.kind === 'same') {
      parts.push(segment.text);
    } else if (segment.kind === 'removed') {
      if (showOld) parts.push(<s key={index} className="diff-old">{segment.text}</s>);
    } else {
      parts.push(
        <mark key={index} className="diff-new">
          {showOld && segment.from !== undefined && <span className="diff-old">{segment.from} → </span>}
          {segment.text}
        </mark>,
      );
    }
  });
  return <>{parts}</>;
}

export function CardFace({ def, content, size = 'full', compareTo, diffStyle = 'upgrade', extendsChain = false }: CardFaceProps) {
  const text = describeCard(def, content);
  const showOld = diffStyle === 'upgrade';
  const costChanged = compareTo !== undefined && compareTo.cost !== def.cost;
  const style = { '--tactic-hue': tacticHue(def.tactic) } as CSSProperties;
  // A v2 shows its base name plus a "v2" tag that is never cut off by a long name.
  const upgraded = isUpgraded(def.id);
  const name = upgraded ? (content.cards[baseCardId(def.id)]?.name ?? def.name) : def.name;

  return (
    <span className={`card-face card-${size} card-${def.type}${upgraded ? ' upgraded' : ''}`} style={style}>
      <span className="card-head">
        <span className={costChanged ? 'card-cost changed' : 'card-cost'} aria-label={`${def.cost} ${TERMS.cycles}`}>
          {costChanged && showOld && <span className="diff-old">{compareTo.cost}→</span>}
          {def.cost}
        </span>
        <span className="card-name">{name}</span>
        {upgraded && (
          <span className="card-v2">{TERMS.upgradedSuffix.trim()}</span>
        )}
      </span>
      <CardArt def={def} />
      <span className={extendsChain ? 'card-tactic chains' : 'card-tactic'}>
        <span className="card-step">{tacticStep(def.tactic)}</span>
        {size === 'full' && <span className="card-tactic-name">{TACTIC_NAMES[def.tactic]}</span>}
        {extendsChain && <span className="chain-mark"> ▲{size === 'full' ? ` ${TERMS.chain}` : ''}</span>}
      </span>
      {size === 'full' && (
        <>
          <span className="card-text">
            {compareTo === undefined ? text : <DiffText segments={diffWords(describeCard(compareTo, content), text)} showOld={showOld} />}
          </span>
          <span className="card-rarity">{RARITY_NAMES[def.rarity]}</span>
        </>
      )}
    </span>
  );
}

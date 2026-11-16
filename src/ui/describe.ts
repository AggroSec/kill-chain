/**
 * Turns engine data into short display strings. Card text is generated
 * from effect data, so it can never drift out of sync with what a card does.
 * All themed words come from data/terms.ts or from the content itself.
 */
import type { AlertLevelId, CardDef, CardEffect, ContentRegistry, EnemyEffect } from '../engine';
import { ALERT_LEVEL_NAMES, KEYWORD_NAMES, TERMS } from '../data/terms';

function statusName(content: ContentRegistry, id: string): string {
  return content.statuses[id]?.name ?? id;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function describeAlertCondition(atLeast?: AlertLevelId, atMost?: AlertLevelId): string {
  if (atLeast !== undefined && atMost !== undefined) {
    return atLeast === atMost
      ? `If ${ALERT_LEVEL_NAMES[atLeast]}`
      : `If ${ALERT_LEVEL_NAMES[atLeast]} to ${ALERT_LEVEL_NAMES[atMost]}`;
  }
  if (atMost === 'quiet') return `If ${ALERT_LEVEL_NAMES.quiet}`;
  if (atMost !== undefined) return `If ${ALERT_LEVEL_NAMES[atMost]} or lower`;
  if (atLeast !== undefined) return `If ${ALERT_LEVEL_NAMES[atLeast]} or higher`;
  return 'Always';
}

/** One sentence per effect. */
export function describeCardEffect(effect: CardEffect, content: ContentRegistry): string {
  switch (effect.kind) {
    case 'damage': {
      const times = effect.hits !== undefined && effect.hits > 1 ? ` ${effect.hits} times` : '';
      const where = effect.target === 'allEnemies' ? ` to ${TERMS.allEnemies}` : '';
      const chain = effect.bonusPerChain !== undefined ? ` (+${effect.bonusPerChain} per ${TERMS.chain})` : '';
      return `Deal ${effect.amount} damage${where}${times}${chain}.`;
    }
    case 'block':
      return `Gain ${effect.amount} ${TERMS.block}.`;
    case 'draw':
      return `Draw ${plural(effect.count, 'card')}.`;
    case 'gainCycles':
      return `Gain ${effect.amount} ${TERMS.cycles}.`;
    case 'alert':
      return effect.amount < 0
        ? `Lower ${TERMS.alert} by ${-effect.amount}.`
        : `Raise ${TERMS.alert} by ${effect.amount}.`;
    case 'applyStatus': {
      const status = content.statuses[effect.status];
      if (effect.target === 'self' && status?.implant === true) {
        const trigger = (status.onTurnStart ?? []).map((e) => describeCardEffect(e, content)).join(' ');
        return `${KEYWORD_NAMES.implant}: at the start of your turn: ${trigger}`;
      }
      const name = statusName(content, effect.status);
      if (effect.target === 'self') return `Gain ${effect.stacks} ${name}.`;
      const where = effect.target === 'allEnemies' ? ` to ${TERMS.allEnemies}` : '';
      return `Apply ${effect.stacks} ${name}${where}.`;
    }
    case 'exploit':
      return `${KEYWORD_NAMES.exploit}: consume all ${statusName(content, 'vuln')}, deal ${effect.damagePerStack} damage per stack.`;
    case 'ifAlert': {
      const inner = effect.then.map((e) => describeCardEffect(e, content)).join(' ');
      return `${describeAlertCondition(effect.atLeast, effect.atMost)}: ${inner}`;
    }
  }
}

/** Keyword line, e.g. "Noisy 2. Burner." (empty string if none). */
export function describeKeywords(card: CardDef): string {
  const parts: string[] = [];
  if (card.keywords?.noisy !== undefined) parts.push(`${KEYWORD_NAMES.noisy} ${card.keywords.noisy}.`);
  if (card.keywords?.burner === true) parts.push(`${KEYWORD_NAMES.burner}.`);
  if (card.keywords?.stash === true) parts.push(`${KEYWORD_NAMES.stash}.`);
  return parts.join(' ');
}

export function describeCard(card: CardDef, content: ContentRegistry): string {
  const effects = card.effects.map((effect) => describeCardEffect(effect, content)).join(' ');
  const keywords = describeKeywords(card);
  return keywords === '' ? effects : `${effects} ${keywords}`;
}

/** Short intent text, e.g. "Attack 12 + Alert +2". */
export function describeIntent(effects: readonly EnemyEffect[], content: ContentRegistry): string {
  return effects
    .map((effect) => {
      switch (effect.kind) {
        case 'attack':
          return effect.hits !== undefined && effect.hits > 1 ? `Attack ${effect.damage}x${effect.hits}` : `Attack ${effect.damage}`;
        case 'block':
          return `${TERMS.block} ${effect.amount}`;
        case 'raiseAlert':
          return `${TERMS.alert} +${effect.amount}`;
        case 'cleanse':
          return 'Cleanse debuffs';
        case 'buffSelf':
          return `+${effect.stacks} ${statusName(content, effect.status)}`;
        case 'removeImplants':
          return `Destroy ${effect.count} ${KEYWORD_NAMES.implant}`;
      }
    })
    .join(' + ');
}

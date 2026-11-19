/**
 * Short badge text for what a v2 changes, e.g. "−1 Cost" or "+3 damage, +1 Vuln"
 * (#14). Worked out by comparing the two cards' data, so it never needs
 * hand-written notes and stays right when a card is retuned.
 */
import type { CardDef, CardEffect, ContentRegistry } from '../engine';
import { KEYWORD_NAMES, TERMS } from '../data/terms';

/** At most this many changes in a badge; the full card shows the rest. */
const MAX_PARTS = 2;

function signed(delta: number): string {
  return `${delta < 0 ? '−' : '+'}${Math.abs(delta)}`;
}

/** Changes between two versions of the same effect (same kind, same position on the card). */
function effectChanges(a: CardEffect, b: CardEffect, content: ContentRegistry): string[] {
  const parts: string[] = [];
  if (a.kind === 'damage' && b.kind === 'damage') {
    if (b.amount !== a.amount) parts.push(`${signed(b.amount - a.amount)} damage`);
    if ((b.hits ?? 1) !== (a.hits ?? 1)) parts.push(`${signed((b.hits ?? 1) - (a.hits ?? 1))} hits`);
    if ((b.bonusPerChain ?? 0) !== (a.bonusPerChain ?? 0)) parts.push(`${signed((b.bonusPerChain ?? 0) - (a.bonusPerChain ?? 0))} per ${TERMS.chain}`);
  } else if (a.kind === 'block' && b.kind === 'block') {
    if (b.amount !== a.amount) parts.push(`${signed(b.amount - a.amount)} ${TERMS.block}`);
  } else if (a.kind === 'draw' && b.kind === 'draw') {
    if (b.count !== a.count) parts.push(`${signed(b.count - a.count)} draw`);
  } else if (a.kind === 'gainCycles' && b.kind === 'gainCycles') {
    if (b.amount !== a.amount) parts.push(`${signed(b.amount - a.amount)} ${TERMS.cycles}`);
  } else if (a.kind === 'alert' && b.kind === 'alert') {
    // Shown as before → after, since "+1" is unclear when the effect lowers Alert.
    if (b.amount !== a.amount) parts.push(`${TERMS.alert} ${signed(a.amount)}→${signed(b.amount)}`);
  } else if (a.kind === 'applyStatus' && b.kind === 'applyStatus') {
    if (b.stacks !== a.stacks) parts.push(`${signed(b.stacks - a.stacks)} ${content.statuses[b.status]?.name ?? b.status}`);
  } else if (a.kind === 'exploit' && b.kind === 'exploit') {
    if (b.damagePerStack !== a.damagePerStack) parts.push(`${signed(b.damagePerStack - a.damagePerStack)} ${KEYWORD_NAMES.exploit}`);
  } else if (a.kind === 'ifAlert' && b.kind === 'ifAlert') {
    parts.push(...effectListChanges(a.then, b.then, content));
  } else {
    parts.push(TERMS.newEffect);
  }
  return parts;
}

function effectListChanges(a: readonly CardEffect[], b: readonly CardEffect[], content: ContentRegistry): string[] {
  const parts: string[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const before = a[i];
    const after = b[i];
    if (before === undefined || after === undefined) parts.push(TERMS.newEffect);
    else parts.push(...effectChanges(before, after, content));
  }
  return parts;
}

export function upgradeSummary(base: CardDef, v2: CardDef, content: ContentRegistry): string {
  const parts: string[] = [];

  // Cost first: with few ways to gain Cycles, cost cuts are often the best upgrades.
  if (v2.cost !== base.cost) parts.push(`${signed(v2.cost - base.cost)} ${TERMS.cost}`);

  // Keywords.
  const noisyBefore = base.keywords?.noisy;
  const noisyAfter = v2.keywords?.noisy;
  if (noisyBefore !== undefined && noisyAfter === undefined) parts.push(`No ${KEYWORD_NAMES.noisy}`);
  else if (noisyBefore !== undefined && noisyAfter !== undefined && noisyAfter !== noisyBefore) parts.push(`${KEYWORD_NAMES.noisy} ${signed(noisyAfter - noisyBefore)}`);
  if (base.keywords?.burner === true && v2.keywords?.burner !== true) parts.push(`No ${KEYWORD_NAMES.burner}`);
  if (base.keywords?.stash !== true && v2.keywords?.stash === true) parts.push(`+${KEYWORD_NAMES.stash}`);

  parts.push(...effectListChanges(base.effects, v2.effects, content));

  if (parts.length === 0) return TERMS.upgraded;
  return parts.slice(0, MAX_PARTS).join(', ');
}

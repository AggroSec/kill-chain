/**
 * Status stacks: buffs, debuffs and Implants.
 *
 * Most statuses are pure data (see StatusDef). A handful have rules baked
 * into the engine; their ids are listed in CORE_STATUS and the content
 * tests check that src/data defines all of them.
 */
import type { ContentRegistry, StatusDef } from './contentTypes';
import type { Statuses } from './types';

/** Status ids with built-in engine behavior. */
export const CORE_STATUS = {
  /** Enemy debuff. Exploit effects consume it for bonus damage. */
  vuln: 'vuln',
  /** Enemy debuff (duration). Takes more damage from attacks. */
  exposed: 'exposed',
  /** Enemy debuff (duration). Deals less attack damage. */
  throttled: 'throttled',
  /** Enemy debuff. Skips its next action, using up 1 stack. */
  stalled: 'stalled',
  /** Enemy buff. +1 attack damage per hit per stack. */
  hardened: 'hardened',
} as const;

export function getStatusDef(content: ContentRegistry, id: string): StatusDef {
  const def = content.statuses[id];
  if (def === undefined) throw new Error(`Unknown status id "${id}"`);
  return def;
}

export function getStacks(statuses: Statuses, id: string): number {
  return statuses[id] ?? 0;
}

/**
 * Removes a status entirely. Statuses is a plain id -> stacks map, so deleting
 * the key is the intended operation here (and the only place we do it).
 */
export function clearStatus(statuses: Statuses, id: string): void {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- status maps are keyed by id by design
  delete statuses[id];
}

/** Adds (or with a negative number, removes) stacks. Deletes the status at 0. */
export function addStacks(statuses: Statuses, id: string, amount: number): void {
  const next = getStacks(statuses, id) + amount;
  if (next > 0) {
    statuses[id] = next;
  } else {
    clearStatus(statuses, id);
  }
}

/** Duration statuses lose 1 stack. Called at the end of the owner's turn. */
export function decayStatuses(statuses: Statuses, content: ContentRegistry): void {
  for (const id of Object.keys(statuses)) {
    if (getStatusDef(content, id).decay === 'endOfOwnerTurn') addStacks(statuses, id, -1);
  }
}

/** Removes every debuff. Returns true if anything was removed. */
export function removeDebuffs(statuses: Statuses, content: ContentRegistry): boolean {
  let removed = false;
  for (const id of Object.keys(statuses)) {
    if (getStatusDef(content, id).kind === 'debuff') {
      clearStatus(statuses, id);
      removed = true;
    }
  }
  return removed;
}

/** Ids of Implant statuses, oldest first. */
export function implantIds(statuses: Statuses, content: ContentRegistry): string[] {
  return Object.keys(statuses).filter((id) => getStatusDef(content, id).implant === true);
}

/** Removes up to `count` Implants (oldest first). */
export function removeImplants(statuses: Statuses, content: ContentRegistry, count: number): void {
  for (const id of implantIds(statuses, content).slice(0, count)) {
    clearStatus(statuses, id);
  }
}

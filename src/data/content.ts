/**
 * The full content registry the engine uses to look up cards, enemies and
 * statuses by id, plus helpers to build fights from class and encounter data.
 */
import type { CombatSetup, ContentRegistry } from '../engine';
import { DEFAULT_MAX_CYCLES } from '../engine';
import { byId } from './byId';
import { CARD_LIST } from './cards';
import { CLASS_LIST } from './classes';
import type { ClassDef } from './classes';
import { ENCOUNTER_LIST } from './encounters';
import type { EncounterDef } from './encounters';
import { ENEMY_LIST } from './enemies';
import { STATUS_LIST } from './statuses';

export const CONTENT: ContentRegistry = {
  cards: byId(CARD_LIST),
  enemies: byId(ENEMY_LIST),
  statuses: byId(STATUS_LIST),
};

export const CLASSES = byId(CLASS_LIST);
export const ENCOUNTERS = byId(ENCOUNTER_LIST);

export function getClass(id: string): ClassDef {
  const def = CLASSES[id];
  if (def === undefined) throw new Error(`Unknown class id "${id}"`);
  return def;
}

export function getEncounter(id: string): EncounterDef {
  const def = ENCOUNTERS[id];
  if (def === undefined) throw new Error(`Unknown encounter id "${id}"`);
  return def;
}

/** A fight with a class's starter Arsenal at full OpSec against an encounter. */
export function starterFight(classId: string, encounterId: string): CombatSetup {
  const cls = getClass(classId);
  return {
    deck: cls.starterDeck,
    opsec: cls.maxOpsec,
    maxOpsec: cls.maxOpsec,
    maxCycles: DEFAULT_MAX_CYCLES,
    enemies: getEncounter(encounterId).enemies,
  };
}

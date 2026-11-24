/**
 * The full content registry: cards (including every v2), enemies, statuses,
 * plus the run-level content (classes, encounters, Tools, Intel events and
 * run numbers). Also helpers to build single fights from class and encounter data.
 */
import type { CombatSetup, RunContent } from '../engine';
import { combatModifiersForClass, DEFAULT_MAX_CYCLES, withUpgrades } from '../engine';
import { BOSS_LIST } from './bosses';
import { byId } from './byId';
import { CARD_LIST } from './cards';
import { CLASS_LIST } from './classes';
import type { ClassDef } from './classes';
import { ENCOUNTER_LIST } from './encounters';
import type { EncounterDef } from './encounters';
import { ENEMY_LIST } from './enemies';
import { ACT2_ENEMIES } from './enemiesAct2';
import { CLOUD_ENEMIES, OT_ENEMIES } from './enemiesAct3';
import { EVENT_LIST } from './events';
import { RUN_CONFIG } from './runConfig';
import { STATUS_LIST } from './statuses';
import { TARGET_LIST } from './targets';
import { TERMS } from './terms';
import { TOOL_LIST } from './tools';

export const CONTENT: RunContent = {
  cards: byId(withUpgrades(CARD_LIST, TERMS.upgradedSuffix)),
  enemies: byId([...ENEMY_LIST, ...BOSS_LIST, ...ACT2_ENEMIES, ...OT_ENEMIES, ...CLOUD_ENEMIES]),
  statuses: byId(STATUS_LIST),
  classes: byId(CLASS_LIST),
  encounters: byId(ENCOUNTER_LIST),
  tools: byId(TOOL_LIST),
  events: byId(EVENT_LIST),
  targets: byId(TARGET_LIST),
  config: RUN_CONFIG,
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

/** A fight with a class's starter Arsenal at full OpSec against an encounter, with the class passive. */
export function starterFight(classId: string, encounterId: string): CombatSetup {
  const cls = getClass(classId);
  return {
    deck: cls.starterDeck,
    opsec: cls.maxOpsec,
    maxOpsec: cls.maxOpsec,
    maxCycles: cls.maxCycles ?? DEFAULT_MAX_CYCLES,
    enemies: getEncounter(encounterId).enemies,
    modifiers: combatModifiersForClass(classId, CONTENT),
  };
}

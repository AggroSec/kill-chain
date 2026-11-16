/**
 * Starting fights inside a run: pick an encounter from the right pool and
 * build the combat from the run's Arsenal and current OpSec.
 */
import { startCombat } from '../combat';
import type { Rng } from '../rng';
import { DEFAULT_MAX_CYCLES } from '../rules';
import type { EncounterDef, RunContent, RunPhase, RunState } from './runTypes';

/** A random encounter of this tier for the run's current act. */
export function pickEncounter(run: RunState, tier: EncounterDef['tier'], content: RunContent, rng: Rng): EncounterDef {
  const pool = Object.values(content.encounters).filter((e) => e.act === run.act && e.tier === tier);
  const picked = pool[rng.nextInt(Math.max(pool.length, 1))];
  if (picked === undefined) throw new Error(`No act ${run.act} encounters with tier "${tier}"`);
  return picked;
}

/** The combat phase for a fight against `encounter`. Each fight gets its own seed from the run RNG. */
export function startRunCombat(
  run: RunState,
  encounter: EncounterDef,
  lootTable: 'fight' | 'elite' | 'boss',
  content: RunContent,
  rng: Rng,
): RunPhase {
  const combatSeed = rng.nextInt(0x1_0000_0000);
  const combat = startCombat(
    {
      deck: run.deck,
      opsec: run.opsec,
      maxOpsec: run.maxOpsec,
      maxCycles: DEFAULT_MAX_CYCLES,
      enemies: encounter.enemies,
    },
    combatSeed,
    content,
  );
  return { kind: 'combat', combat, encounterId: encounter.id, lootTable };
}

/**
 * A regular map fight. The first `easyFightCount` regular fights of a run
 * come from the easy pool, the rest from the normal pool.
 */
export function startMapFight(run: RunState, content: RunContent, rng: Rng): RunPhase {
  const tier = run.fightsStarted < content.config.easyFightCount ? 'easy' : 'normal';
  run.fightsStarted++;
  return startRunCombat(run, pickEncounter(run, tier, content, rng), 'fight', content, rng);
}

/**
 * The run engine: start a run, then feed it actions.
 *
 *   let run = startRun('exploit-dev', seed, content);
 *   run = runReducer(run, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] }, content);
 *   run = runReducer(run, { type: 'COMBAT', action: { type: 'END_TURN' } }, content);
 *
 * Like the combat reducer, it never changes the state you pass in, and an
 * invalid action returns the same state object (`next === prev`).
 */
import { combatReducer } from '../combat';
import { Rng } from '../rng';
import { pickEncounter, startMapFight, startRunCombat } from './fights';
import { rollDarkWebStock, rollLoot, wipePrice } from './loot';
import { generateMap, reachableNodeIds } from './map';
import { applyRunEffects, gainTool, healOpsec, runEffectsNeedDeckIndex, upgradeCard, wipeCard } from './runEffects';
import type { NodeKind, RunAction, RunContent, RunPhase, RunState } from './runTypes';

export function startRun(classId: string, seed: number, content: RunContent): RunState {
  const cls = content.classes[classId];
  if (cls === undefined) throw new Error(`Unknown class id "${classId}"`);
  const rng = new Rng(seed);
  const map = generateMap(content.config, rng);
  return {
    classId,
    act: 1,
    outcome: 'ongoing',
    opsec: cls.maxOpsec,
    maxOpsec: cls.maxOpsec,
    crypto: content.config.startingCrypto,
    deck: [...cls.starterDeck],
    tools: [],
    map,
    currentNodeId: null,
    phase: { kind: 'map' },
    fightsStarted: 0,
    seenEventIds: [],
    wipesBought: 0,
    rngState: rng.state,
  };
}

export function runReducer(state: RunState, action: RunAction, content: RunContent): RunState {
  if (state.outcome !== 'ongoing') return state;

  // Combat actions are the hot path (the simulator sends thousands), so they
  // skip the full copy below: the combat reducer already returns a new object.
  if (action.type === 'COMBAT') return combatStep(state, action.action, content);

  const next = structuredClone(state);
  const rng = new Rng(next.rngState);
  const changed = applyAction(next, action, content, rng);
  if (!changed) return state;
  next.rngState = rng.state;
  return next;
}

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

function combatStep(state: RunState, action: Parameters<typeof combatReducer>[1], content: RunContent): RunState {
  const phase = state.phase;
  if (phase.kind !== 'combat') return state;
  const combat = combatReducer(phase.combat, action, content);
  if (combat === phase.combat) return state;

  const next: RunState = { ...state, phase: { ...phase, combat } };
  if (combat.outcome === 'ongoing') return next;

  // The fight is over: copy the run so the follow-up changes stay local.
  const run = structuredClone(next);
  const rng = new Rng(run.rngState);
  run.opsec = combat.player.opsec;
  if (combat.outcome === 'won') {
    finishWonFight(run, phase.lootTable, content, rng);
  } else {
    // Lost, or hit the turn cap. A timed-out fight also burns the run (pending design review).
    run.outcome = 'lost';
  }
  run.rngState = rng.state;
  return run;
}

function finishWonFight(run: RunState, lootTable: 'fight' | 'elite' | 'boss', content: RunContent, rng: Rng): void {
  for (const toolId of run.tools) {
    const afterWin = content.tools[toolId]?.afterCombatWin;
    if (afterWin !== undefined) applyRunEffects(run, afterWin, content, rng);
  }

  // Milestone 3 runs are Act 1 only, so beating the boss wins the run (Exfiltrated).
  if (lootTable === 'boss') {
    run.outcome = 'won';
    run.phase = { kind: 'map' };
    return;
  }

  const loot = rollLoot(run, content.config.loot[lootTable], content, rng);
  run.crypto += loot.crypto;
  if (loot.toolId !== null) gainTool(run, loot.toolId, content, rng);
  run.phase = { kind: 'loot', loot };
}

// ---------------------------------------------------------------------------
// Everything else. Each handler mutates the copied run and returns whether
// the action was valid.
// ---------------------------------------------------------------------------

function applyAction(run: RunState, action: Exclude<RunAction, { type: 'COMBAT' }>, content: RunContent, rng: Rng): boolean {
  const phase = run.phase;
  switch (action.type) {
    case 'CHOOSE_NODE':
      return phase.kind === 'map' && chooseNode(run, action.nodeId, content, rng);

    case 'PICK_LOOT_CARD': {
      if (phase.kind !== 'loot') return false;
      const card = phase.loot.cardChoices[action.index];
      if (card === undefined) return false;
      run.deck.push(card);
      run.phase = { kind: 'map' };
      return true;
    }

    case 'SKIP_LOOT':
      if (phase.kind !== 'loot') return false;
      run.phase = { kind: 'map' };
      return true;

    case 'EVENT_CHOICE':
      return phase.kind === 'intel' && chooseEventOption(run, phase.eventId, action.index, action.deckIndex, content, rng);

    case 'LAY_LOW':
      if (phase.kind !== 'safehouse') return false;
      healOpsec(run, Math.floor((run.maxOpsec * content.config.safehouse.layLowPercent) / 100));
      run.phase = { kind: 'map' };
      return true;

    case 'WEAPONIZE':
      if (phase.kind !== 'safehouse' || !upgradeCard(run, action.deckIndex, content)) return false;
      run.phase = { kind: 'map' };
      return true;

    case 'GO_DARK':
      if (phase.kind !== 'safehouse' || !wipeCard(run, action.deckIndex)) return false;
      run.phase = { kind: 'map' };
      return true;

    case 'BUY_CARD': {
      if (phase.kind !== 'darkWeb') return false;
      const item = phase.cards[action.index];
      if (item === undefined || item.sold || run.crypto < item.price) return false;
      run.crypto -= item.price;
      item.sold = true;
      run.deck.push(item.id);
      return true;
    }

    case 'BUY_TOOL': {
      if (phase.kind !== 'darkWeb') return false;
      const item = phase.tools[action.index];
      if (item === undefined || item.sold || run.crypto < item.price) return false;
      run.crypto -= item.price;
      item.sold = true;
      gainTool(run, item.id, content, rng);
      return true;
    }

    case 'BUY_WIPE': {
      if (phase.kind !== 'darkWeb' || phase.wipeUsed) return false;
      const price = wipePrice(run, content);
      if (run.crypto < price || !wipeCard(run, action.deckIndex)) return false;
      run.crypto -= price;
      run.wipesBought++;
      phase.wipeUsed = true;
      return true;
    }

    case 'LEAVE':
      if (phase.kind !== 'darkWeb') return false;
      run.phase = { kind: 'map' };
      return true;
  }
}

function chooseNode(run: RunState, nodeId: string, content: RunContent, rng: Rng): boolean {
  if (!reachableNodeIds(run.map, run.currentNodeId).includes(nodeId)) return false;
  const node = run.map.nodes[nodeId];
  if (node === undefined) return false;
  run.currentNodeId = nodeId;
  run.phase = enterNode(run, node.kind, content, rng);
  return true;
}

function enterNode(run: RunState, kind: NodeKind, content: RunContent, rng: Rng): RunPhase {
  switch (kind) {
    case 'fight':
      return startMapFight(run, content, rng);
    case 'elite':
      return startRunCombat(run, pickEncounter(run, 'elite', content, rng), 'elite', content, rng);
    case 'boss':
      return startRunCombat(run, pickEncounter(run, 'boss', content, rng), 'boss', content, rng);
    case 'intel':
      return { kind: 'intel', eventId: pickEvent(run, content, rng) };
    case 'safehouse':
      return { kind: 'safehouse' };
    case 'darkWeb':
      return { kind: 'darkWeb', ...rollDarkWebStock(run, content, rng), wipeUsed: false };
  }
}

/** A random Intel event, preferring ones not seen yet this run. */
function pickEvent(run: RunState, content: RunContent, rng: Rng): string {
  const all = Object.keys(content.events);
  const unseen = all.filter((id) => !run.seenEventIds.includes(id));
  const pool = unseen.length > 0 ? unseen : all;
  const eventId = pool[rng.nextInt(Math.max(pool.length, 1))];
  if (eventId === undefined) throw new Error('A run with Intel nodes needs at least one event');
  run.seenEventIds.push(eventId);
  return eventId;
}

function chooseEventOption(
  run: RunState,
  eventId: string,
  index: number,
  deckIndex: number | undefined,
  content: RunContent,
  rng: Rng,
): boolean {
  const choice = content.events[eventId]?.choices[index];
  if (choice === undefined) return false;
  const cost = choice.cryptoCost ?? 0;
  if (run.crypto < cost) return false;
  if (runEffectsNeedDeckIndex(choice.effects) && (deckIndex === undefined || run.deck[deckIndex] === undefined)) return false;

  run.crypto -= cost;
  const nextPhase = applyRunEffects(run, choice.effects, content, rng, deckIndex);
  run.phase = nextPhase ?? { kind: 'map' };
  return true;
}

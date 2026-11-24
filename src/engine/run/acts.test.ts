/**
 * Three-act runs (Milestone 5): Final Target draw, boss Loot and the next
 * act, OpSec recovery between acts, Final Target encounter pools, locked
 * cards, class passives and act-specific Intel events.
 */
import { describe, expect, it } from 'vitest';
import { act, inPhase, MULTI_ACT_CONTENT, RUN_TEST_CONTENT, winFight } from '../__fixtures__/runContent';
import { combatModifiers } from './fights';
import { actHealAmount, startRun } from './run';
import type { RunContent, RunState } from './runTypes';

const content = MULTI_ACT_CONTENT;
/** The value, or a test failure if it's missing. */
function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing test value');
  return value;
}

/** Makes every floor-1 node `kind`. */
function setStartKind(run: RunState, kind: 'fight' | 'elite' | 'intel'): void {
  for (const id of run.map.startIds) must(run.map.nodes[id]).kind = kind;
}


/** Standing on the node before the boss, ready to choose it. */
function beforeBoss(run: RunState): RunState {
  const next = structuredClone(run);
  next.currentNodeId = Object.values(next.map.nodes).find((n) => n.next.includes('boss'))?.id ?? null;
  return next;
}

function enemiesInFight(run: RunState): string[] {
  if (run.phase.kind !== 'combat') throw new Error(`Expected a fight, got ${run.phase.kind}`);
  return run.phase.combat.enemies.map((e) => e.defId);
}

/** Beats the current act's boss and skips its Loot. */
function clearAct(run: RunState, c: RunContent = content): RunState {
  const atBoss = act(beforeBoss(run), { type: 'CHOOSE_NODE', nodeId: 'boss' }, c);
  const won = winFight(atBoss, c);
  return act(won, { type: 'SKIP_LOOT' }, c);
}

describe('Final Target', () => {
  it('is drawn at the start of the run from the targets, deterministically', () => {
    const drawn = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const run = startRun('tester', seed, content);
      expect(['alpha', 'beta']).toContain(run.finalTargetId);
      expect(startRun('tester', seed, content).finalTargetId).toBe(run.finalTargetId);
      drawn.add(run.finalTargetId);
    }
    expect(drawn.size).toBe(2);
  });

  it('does not change the Act 1 map (drawn after it)', () => {
    expect(startRun('tester', 5, content).map).toEqual(startRun('tester', 5, RUN_TEST_CONTENT).map);
  });
});

describe('acts', () => {
  it('an Act 1 boss gives boss Loot, then Act 2 starts with a new map', () => {
    const run = startRun('tester', 3, content);
    const atBoss = act(beforeBoss(run), { type: 'CHOOSE_NODE', nodeId: 'boss' }, content);
    expect(enemiesInFight(atBoss)).toEqual(['wall', 'wall']);
    const won = winFight(atBoss, content);
    expect(won.outcome).toBe('ongoing');
    expect(won.bossesBeaten).toEqual(['b1']);
    if (won.phase.kind !== 'loot') throw new Error('expected boss Loot');
    expect(won.phase.loot.toolId).not.toBeNull();

    const next = act(won, { type: 'SKIP_LOOT' }, content);
    expect(next.act).toBe(2);
    expect(next.currentNodeId).toBeNull();
    expect(next.phase).toEqual({ kind: 'map' });
    expect(next.fightsStarted).toBe(0);
    expect(next.map).not.toEqual(run.map);
    expect(next.actStart).toEqual({ act: 2, healed: 0 });
  });

  it('recovers half of missing OpSec (rounded down) at the start of an act', () => {
    const hurt = { ...startRun('tester', 3, content), opsec: 15 };
    expect(actHealAmount(hurt, content)).toBe(22); // (60 - 15) / 2 = 22.5
    const next = clearAct(hurt);
    expect(next.opsec).toBe(15 + 22);
    expect(next.actStart).toEqual({ act: 2, healed: 22 });
  });

  it('the act intro clears when the first node is chosen', () => {
    const next = clearAct(startRun('tester', 3, content));
    const moved = act(next, { type: 'CHOOSE_NODE', nodeId: next.map.startIds[0] ?? '' }, content);
    expect(moved.actStart).toBeNull();
  });

  it('Act 2 fights use Act 2 encounters', () => {
    const act2 = clearAct(startRun('tester', 3, content));
    const atBoss = act(beforeBoss(act2), { type: 'CHOOSE_NODE', nodeId: 'boss' }, content);
    expect(enemiesInFight(atBoss)).toEqual(['wall']);
  });

  it('Act 3 uses only the drawn Final Target, and its boss wins the run', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const run = startRun('tester', seed, content);
      const act3 = clearAct(clearAct(run));
      expect(act3.act).toBe(3);
      const atBoss = act(beforeBoss(act3), { type: 'CHOOSE_NODE', nodeId: 'boss' }, content);
      const expected = run.finalTargetId === 'alpha' ? ['wall'] : ['wall', 'wall'];
      expect(enemiesInFight(atBoss)).toEqual(expected);
      const won = winFight(atBoss, content);
      expect(won.outcome).toBe('won');
      expect(won.bossesBeaten).toEqual(['b1', 'b2', run.finalTargetId === 'alpha' ? 'b3a' : 'b3b']);
    }
  });
});

describe('locked cards', () => {
  it('are never offered as Loot', () => {
    const locked = ['pub-a', 'priv-a', 'zd-a'];
    for (let seed = 1; seed <= 20; seed++) {
      let run = startRun('tester', seed, content, { lockedCardIds: locked });
      run = act(run, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] ?? '' }, content);
      if (run.phase.kind !== 'combat') continue;
      const won = winFight(run, content);
      if (won.phase.kind !== 'loot') throw new Error('expected loot');
      for (const id of won.phase.loot.cardChoices) expect(locked).not.toContain(id);
    }
  });
});

describe('class passives', () => {
  const withPassive: RunContent = {
    ...content,
    classes: {
      tester: {
        ...must(content.classes.tester),
        maxCycles: 4,
        passive: {
          combat: { chainStartTactic: 'initial-access', damageTakenPerHit: 1 },
          bonusLoot: { everyFightsWon: 3, afterElite: true, rarityWeights: { public: 0, private: 1, 'zero-day': 0 }, cardChoices: 1 },
        },
      },
    },
  };

  it('combat bonuses and Cycles reach every fight', () => {
    const run = startRun('tester', 2, withPassive);
    expect(combatModifiers(run, withPassive)).toMatchObject({ chainStartTactic: 'initial-access', damageTakenPerHit: 1 });
    const fight = act(run, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] ?? '' }, withPassive);
    if (fight.phase.kind === 'combat') expect(fight.phase.combat.player.maxCycles).toBe(4);
  });

  it('the bonus pick follows normal Loot every 3rd win', () => {
    const run = { ...startRun('tester', 2, withPassive), fightsWon: 2 };
    const atFight = inPhase(run, { kind: 'map' });
    setStartKind(atFight, 'fight');
    const fight = act(atFight, { type: 'CHOOSE_NODE', nodeId: atFight.map.startIds[0] ?? '' }, withPassive);
    const won = winFight(fight, withPassive);
    expect(won.fightsWon).toBe(3);
    if (won.phase.kind !== 'loot') throw new Error('expected loot');
    expect(won.phase.loot.bonus).toBeUndefined();

    const bonus = act(won, { type: 'PICK_LOOT_CARD', index: 0 }, withPassive);
    if (bonus.phase.kind !== 'loot') throw new Error('expected the bonus pick');
    expect(bonus.phase.loot.bonus).toBe(true);
    expect(bonus.phase.loot.cardChoices).toHaveLength(1); // the fixture has one Private card
    for (const id of bonus.phase.loot.cardChoices) expect(withPassive.cards[id]?.rarity).toBe('private');
    expect(act(bonus, { type: 'SKIP_LOOT' }, withPassive).phase).toEqual({ kind: 'map' });
  });

  it('no bonus pick on other wins, but always after a Hardened Target', () => {
    const run = startRun('tester', 2, withPassive);
    setStartKind(run, 'fight');
    const plain = winFight(act(run, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] ?? '' }, withPassive), withPassive);
    expect(act(plain, { type: 'SKIP_LOOT' }, withPassive).phase).toEqual({ kind: 'map' });

    const eliteRun = startRun('tester', 2, withPassive);
    setStartKind(eliteRun, 'elite');
    const elite = winFight(act(eliteRun, { type: 'CHOOSE_NODE', nodeId: eliteRun.map.startIds[0] ?? '' }, withPassive), withPassive);
    expect(act(elite, { type: 'SKIP_LOOT' }, withPassive).phase.kind).toBe('loot');
  });
});

describe('Intel events by act', () => {
  it('only offers events allowed in the current act', () => {
    const acts2: RunContent = {
      ...content,
      events: {
        early: { id: 'early', title: '', text: '', acts: [1], choices: [{ label: 'Ok', effects: [] }] },
        late: { id: 'late', title: '', text: '', acts: [2, 3], choices: [{ label: 'Ok', effects: [] }] },
      },
    };
    for (let seed = 1; seed <= 10; seed++) {
      const run = startRun('tester', seed, acts2);
      setStartKind(run, 'intel');
      const atEvent = act(run, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] ?? '' }, acts2);
      expect(atEvent.phase).toEqual({ kind: 'intel', eventId: 'early' });
      const later = { ...structuredClone(run), act: 2 };
      const atLater = act(later, { type: 'CHOOSE_NODE', nodeId: run.map.startIds[0] ?? '' }, acts2);
      expect(atLater.phase).toEqual({ kind: 'intel', eventId: 'late' });
    }
  });
});

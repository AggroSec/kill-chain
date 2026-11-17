/**
 * Run logs: action tokens round-trip, pasted logs parse, and replaying a
 * recorded run from its log reproduces the exact same final state.
 * Lives in src/sim because recording a real run needs the bots.
 */
import { describe, expect, it } from 'vitest';
import { decodeAction, encodeAction, formatRunLog, parseRunLog, replayRun, Rng, runReducer, startRun } from '../engine';
import type { RunAction, RunState } from '../engine';
import { CONTENT } from '../data/content';
import { greedyBot } from './bots';
import { chooseRunAction } from './runBots';
import { replayReport } from './replayReport';

/** Plays a run with the greedy fight bot and random run choices, recording every accepted action. */
function recordRun(classId: string, seed: number): { final: RunState; actions: RunAction[] } {
  let run = startRun(classId, seed, CONTENT);
  const rng = new Rng(seed + 1);
  const actions: RunAction[] = [];
  for (let step = 0; step < 20_000 && run.outcome === 'ongoing'; step++) {
    const action: RunAction =
      run.phase.kind === 'combat'
        ? { type: 'COMBAT', action: greedyBot.chooseAction(run.phase.combat, CONTENT, rng) }
        : chooseRunAction(run, CONTENT, 'random', rng);
    const next = runReducer(run, action, CONTENT);
    if (next === run) break;
    actions.push(action);
    run = next;
  }
  return { final: run, actions };
}

const EVERY_ACTION: RunAction[] = [
  { type: 'CHOOSE_NODE', nodeId: '3-1' },
  { type: 'CHOOSE_NODE', nodeId: 'boss' },
  { type: 'COMBAT', action: { type: 'PLAY_CARD', handIndex: 7, targetIndex: 2 } },
  { type: 'COMBAT', action: { type: 'END_TURN' } },
  { type: 'PICK_LOOT_CARD', index: 2 },
  { type: 'SKIP_LOOT' },
  { type: 'EVENT_CHOICE', index: 1 },
  { type: 'EVENT_CHOICE', index: 0, deckIndex: 12 },
  { type: 'LAY_LOW' },
  { type: 'WEAPONIZE', deckIndex: 4 },
  { type: 'GO_DARK', deckIndex: 10 },
  { type: 'BUY_CARD', index: 3 },
  { type: 'BUY_TOOL', index: 1 },
  { type: 'BUY_WIPE', deckIndex: 0 },
  { type: 'LEAVE' },
];

describe('action tokens', () => {
  it('round-trips every action type', () => {
    for (const action of EVERY_ACTION) expect(decodeAction(encodeAction(action))).toEqual(action);
  });

  it('gives every action a distinct token with no spaces', () => {
    const tokens = EVERY_ACTION.map(encodeAction);
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const token of tokens) expect(token).not.toMatch(/\s/);
  });

  it('rejects garbage', () => {
    for (const bad of ['', 'p1', 'p1.', 'q3', 'bc', 'l-1', 'w1.2.3']) expect(() => decodeAction(bad)).toThrow();
  });
});

describe('run log text', () => {
  it('parses a log wrapped in other text, like a GitHub issue body', () => {
    const text = formatRunLog({ build: 'abc1234', classId: 'exploit-dev', seed: 42, result: 'lost on floor 3', actions: EVERY_ACTION });
    const pasted = `**What happened?**\nI died :(\n\n\`\`\`\n${text}\n\`\`\`\nseed: 999 (later text is ignored)`;
    const log = parseRunLog(pasted);
    expect(log).toEqual({ build: 'abc1234', classId: 'exploit-dev', seed: 42, result: 'lost on floor 3', actions: EVERY_ACTION });
  });

  it('keeps the final state for saves made before logging existed', () => {
    const state = startRun('social-engineer', 7, CONTENT);
    const log = parseRunLog(formatRunLog({ build: 'x', classId: 'social-engineer', seed: 7, result: 'lost', actions: null, state }));
    expect(log.actions).toBeNull();
    expect(log.state).toEqual(state);
  });

  it('rejects text without the header or a seed', () => {
    expect(() => parseRunLog('class: exploit-dev\nseed: 1')).toThrow();
    expect(() => parseRunLog('kill-chain run log v1\nclass: exploit-dev')).toThrow();
  });
});

describe('replayRun', () => {
  it('reproduces recorded runs exactly from the log text', () => {
    for (const [classId, seed] of [['exploit-dev', 1], ['social-engineer', 2], ['exploit-dev', 3]] as const) {
      const { final, actions } = recordRun(classId, seed);
      expect(final.outcome).not.toBe('ongoing');
      const text = formatRunLog({ build: 'test', classId, seed, result: final.outcome, actions });
      const replay = replayRun(parseRunLog(text), CONTENT);
      expect(replay.steps.every((s) => s.valid)).toBe(true);
      expect(replay.final).toEqual(final);
    }
  });

  it('stops at the first action the engine rejects', () => {
    const replay = replayRun({ build: 'x', classId: 'exploit-dev', seed: 1, result: '', actions: [{ type: 'LAY_LOW' }, { type: 'LEAVE' }] }, CONTENT);
    expect(replay.steps).toHaveLength(1);
    expect(replay.steps[0]?.valid).toBe(false);
  });
});

describe('replayReport', () => {
  it('narrates a full run without crashing and ends with the final state', () => {
    const { final, actions } = recordRun('exploit-dev', 5);
    const report = replayReport({ build: 'test', classId: 'exploit-dev', seed: 5, result: final.outcome, actions }, CONTENT, 'test');
    expect(report).toContain('== Floor 1');
    expect(report).toContain('Play ');
    expect(report).toContain(`== End: ${final.outcome}`);
    expect(report).not.toContain('WARNING');
    expect(report).not.toContain('rejected');
  });

  it('warns when the log comes from a different build', () => {
    const report = replayReport({ build: 'old', classId: 'exploit-dev', seed: 5, result: '', actions: [] }, CONTENT, 'new');
    expect(report).toContain('WARNING');
  });
});

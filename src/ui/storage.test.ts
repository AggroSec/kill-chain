import { describe, expect, it } from 'vitest';
import { parseRunLog, runReducer, startRun } from '../engine';
import { CONTENT } from '../data/content';
import { resultText, runLogText } from './storage';

describe('run log export', () => {
  it('records actions and reads OpSec from the fight in progress', () => {
    const start = startRun('exploit-dev', 3, CONTENT);
    const firstNode = Object.values(start.map.nodes).find((n) => n.floor === 1);
    const action = { type: 'CHOOSE_NODE' as const, nodeId: firstNode?.id ?? '' };
    const run = runReducer(start, action, CONTENT);
    const log = parseRunLog(runLogText({ seed: 3, run, actions: [action] }));
    expect(log.actions).toEqual([action]);
    expect(log.seed).toBe(3);
    expect(resultText(run)).toMatch(/^in progress on floor 1/);
  });

  it('falls back to the final state for saves without actions, and stays pasteable', () => {
    const run = startRun('social-engineer', 4, CONTENT);
    const text = runLogText({ seed: 4, run });
    expect(parseRunLog(text).state).toEqual(run);
    expect(text.length).toBeLessThan(60_000);
  });
});

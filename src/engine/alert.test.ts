import { describe, expect, it } from 'vitest';
import { endTurn, play, stateWithHand } from './__fixtures__/testContent';
import { ALERT_MAX, clampAlert, getAlertLevel, isAlertInRange } from './alert';

describe('alert levels', () => {
  it.each([
    [0, 'quiet'],
    [4, 'quiet'],
    [5, 'noisy'],
    [9, 'noisy'],
    [10, 'detected'],
    [14, 'detected'],
    [15, 'lockdown'],
    [20, 'lockdown'],
  ])('Alert %i is %s', (alert, level) => {
    expect(getAlertLevel(alert).id).toBe(level);
  });

  it('clamps between 0 and ALERT_MAX', () => {
    expect(clampAlert(2, -5)).toBe(0);
    expect(clampAlert(18, 10)).toBe(ALERT_MAX);
  });

  it('checks ranges by level', () => {
    expect(isAlertInRange(3, undefined, 'quiet')).toBe(true);
    expect(isAlertInRange(5, undefined, 'quiet')).toBe(false);
    expect(isAlertInRange(10, 'noisy', 'detected')).toBe(true);
    expect(isAlertInRange(15, 'noisy', 'detected')).toBe(false);
  });
});

describe('Alert in combat', () => {
  it('Noisy cards raise Alert', () => {
    const state = play(stateWithHand(['loud'], { enemies: ['wall'] }), 'loud');
    expect(state.alert).toBe(4);
  });

  it('cards can lower Alert, but not below 0', () => {
    let state = stateWithHand(['hush', 'hush']);
    state = { ...state, alert: 5 };
    state = play(play(state, 'hush'), 'hush');
    expect(state.alert).toBe(0);
  });

  it('higher levels make enemy attacks hit harder', () => {
    // Puncher hits for 10. Detected adds +3.
    const quiet = endTurn(stateWithHand([]));
    expect(quiet.player.opsec).toBe(40);
    const detected = endTurn({ ...stateWithHand([]), alert: 10 });
    expect(detected.player.opsec).toBe(37);
  });

  it('enemies can raise Alert', () => {
    const state = endTurn(stateWithHand([], { enemies: ['alarm'] }));
    expect(state.alert).toBe(3);
  });

  it('ifAlert effects check the level when the card resolves', () => {
    const quiet = play(stateWithHand(['quiet-bonus', 'loud-bonus']), 'quiet-bonus');
    expect(quiet.player.block).toBe(10);
    expect(play(quiet, 'loud-bonus').player.block).toBe(10); // still Quiet: no bonus

    const noisy = { ...stateWithHand(['quiet-bonus', 'loud-bonus']), alert: 5 };
    expect(play(noisy, 'quiet-bonus').player.block).toBe(0);
    expect(play(noisy, 'loud-bonus').player.block).toBe(10);
  });
});

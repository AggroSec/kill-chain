/**
 * Tools: passive bonuses that last the whole run. Found at Hardened Targets,
 * from the boss, at the Dark Web and in some Intel events.
 * Adding a Tool = adding an entry here.
 */
import type { ToolDef } from '../engine';

export const TOOL_LIST: readonly ToolDef[] = [
  {
    id: 'proxy-chain',
    name: 'Proxy Chain',
    description: 'Noisy cards raise Alert by 1 less.',
    combat: { noisyReduction: 1 },
  },
  {
    id: 'burner-phone',
    name: 'Burner Phone',
    description: 'Draw 2 extra cards on turn 1 of each fight.',
    combat: { firstTurnDraw: 2 },
  },
  {
    id: 'usb-drop',
    name: 'USB Drop',
    description: 'At the start of each fight, deal 5 damage to ALL enemies.',
    combat: { combatStart: [{ kind: 'damage', amount: 5, target: 'allEnemies' }] },
  },
  {
    id: 'vpn-subscription',
    name: 'VPN Subscription',
    description: 'Gain 1 extra Cycle on turn 1 of each fight.',
    combat: { firstTurnCycles: 1 },
  },
  {
    id: 'cold-wallet',
    name: 'Cold Wallet',
    description: 'Gain 10 Crypto after every fight you win.',
    afterCombatWin: [{ kind: 'gainCrypto', amount: 10 }],
  },
  {
    id: 'dead-drop',
    name: 'Dead Drop',
    description: 'Recover 4 OpSec after every fight you win.',
    afterCombatWin: [{ kind: 'healOpsec', amount: 4 }],
  },
  {
    id: 'ghost-persona',
    name: 'Ghost Persona',
    description: 'When picked up: +10 max OpSec and recover 10 OpSec.',
    onPickup: [{ kind: 'gainMaxOpsec', amount: 10 }],
  },
  {
    id: 'go-bag',
    name: 'Go Bag',
    description: 'Lay Low recovers an extra 15% of max OpSec.',
    layLowBonusPercent: 15,
  },
];

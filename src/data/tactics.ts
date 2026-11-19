/** Display names for ATT&CK tactics (MITRE's names), shown on cards. */
import { TACTICS_IN_ORDER } from '../engine';
import type { Tactic } from '../engine';

export const TACTIC_NAMES: Record<Tactic, string> = {
  reconnaissance: 'Reconnaissance',
  'resource-development': 'Resource Development',
  'initial-access': 'Initial Access',
  execution: 'Execution',
  persistence: 'Persistence',
  'privilege-escalation': 'Privilege Escalation',
  'defense-evasion': 'Defense Evasion',
  'credential-access': 'Credential Access',
  discovery: 'Discovery',
  'lateral-movement': 'Lateral Movement',
  collection: 'Collection',
  'command-and-control': 'Command and Control',
  exfiltration: 'Exfiltration',
  impact: 'Impact',
};

/**
 * The tactic's step in the kill chain, 1-14. Cards show it so players who are
 * new to ATT&CK can build Chains by playing increasing numbers.
 */
export function tacticStep(tactic: Tactic): number {
  return TACTICS_IN_ORDER.indexOf(tactic) + 1;
}

/** "3 · Initial Access": the label shown on every card. */
export function tacticLabel(tactic: Tactic): string {
  return `${tacticStep(tactic)} · ${TACTIC_NAMES[tactic]}`;
}

/**
 * Hue (0-360) for a tactic's card frame. Colors run from blue (step 1,
 * Reconnaissance) through purple to red (step 14, Impact), so a Chain reads
 * as a color gradient. Each theme sets the saturation and lightness.
 */
export function tacticHue(tactic: Tactic): number {
  const step = tacticStep(tactic); // 1-14
  return Math.round(200 + ((step - 1) / 13) * 160) % 360;
}

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

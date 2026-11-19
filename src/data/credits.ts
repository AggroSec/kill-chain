/**
 * In-game credits. Third-party assets must match src/assets/ATTRIBUTION.md
 * (a test checks that every icon author listed there appears here).
 */
export interface CreditLine {
  label: string;
  text: string;
  url?: string;
}

export const CREDITS: readonly CreditLine[] = [
  { label: 'Design and direction', text: 'AggroSec' },
  { label: 'Code', text: 'Claude Code (Anthropic), directed by AggroSec' },
  {
    label: 'MITRE ATT&CK®',
    text: 'Card names and tactics reference MITRE ATT&CK®. © The MITRE Corporation, used under its terms of use. ATT&CK® is a registered trademark of The MITRE Corporation.',
    url: 'https://attack.mitre.org/',
  },
  {
    label: 'Tactic icons',
    text: 'Lorc and Delapouite, from game-icons.net, licensed CC BY 3.0. Background removed and recolored.',
    url: 'https://game-icons.net/',
  },
  { label: 'License', text: 'Kill Chain is free for noncommercial use under the PolyForm Noncommercial License 1.0.0.' },
];

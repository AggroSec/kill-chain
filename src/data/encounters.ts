/**
 * Enemy groups. The Act 1 map (Milestone 3) picks fights from these pools.
 * Adding an encounter = adding an entry here.
 */
export interface EncounterDef {
  id: string;
  act: number;
  /** easy: first fights of an act. normal: the rest. elite: Hardened Targets. */
  tier: 'easy' | 'normal' | 'elite';
  /** Enemy ids, left to right. */
  enemies: readonly string[];
}

export const ENCOUNTER_LIST: readonly EncounterDef[] = [
  { id: 'a1-firewall', act: 1, tier: 'easy', enemies: ['firewall'] },
  { id: 'a1-soc', act: 1, tier: 'easy', enemies: ['soc-analyst'] },
  { id: 'a1-edr', act: 1, tier: 'easy', enemies: ['edr'] },
  { id: 'a1-honeypot-soc', act: 1, tier: 'normal', enemies: ['honeypot', 'soc-analyst'] },
  { id: 'a1-firewall-honeypot', act: 1, tier: 'normal', enemies: ['firewall', 'honeypot'] },
  { id: 'a1-edr-honeypot', act: 1, tier: 'normal', enemies: ['edr', 'honeypot'] },
  { id: 'a1-soc-pair', act: 1, tier: 'normal', enemies: ['soc-analyst', 'soc-analyst'] },
  { id: 'a1-patch-cycle', act: 1, tier: 'elite', enemies: ['patch-cycle'] },
];

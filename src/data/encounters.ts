/**
 * Enemy groups. Each act's map picks fights from its pools (easy, normal,
 * elite, boss). Act 3 encounters belong to one Final Target (`target`).
 * Adding an encounter = adding an entry here.
 */
import type { EncounterDef } from '../engine';

export type { EncounterDef };

export const ENCOUNTER_LIST: readonly EncounterDef[] = [
  { id: 'a1-firewall', act: 1, tier: 'easy', enemies: ['firewall'] },
  { id: 'a1-soc', act: 1, tier: 'easy', enemies: ['soc-analyst'] },
  { id: 'a1-edr', act: 1, tier: 'easy', enemies: ['edr'] },
  { id: 'a1-honeypot-soc', act: 1, tier: 'normal', enemies: ['honeypot', 'soc-analyst'] },
  { id: 'a1-firewall-honeypot', act: 1, tier: 'normal', enemies: ['firewall', 'honeypot'] },
  { id: 'a1-edr-honeypot', act: 1, tier: 'normal', enemies: ['edr', 'honeypot'] },
  { id: 'a1-soc-pair', act: 1, tier: 'normal', enemies: ['soc-analyst', 'soc-analyst'] },
  { id: 'a1-patch-cycle', act: 1, tier: 'elite', enemies: ['patch-cycle'] },
  { id: 'a1-incident-response', act: 1, tier: 'boss', enemies: ['forensics-analyst', 'incident-commander', 'threat-hunter'] },

  // --- Act 2: Internal ---
  { id: 'a2-siem', act: 2, tier: 'easy', enemies: ['siem'] },
  { id: 'a2-pam', act: 2, tier: 'easy', enemies: ['pam'] },
  { id: 'a2-next-gen-edr', act: 2, tier: 'easy', enemies: ['next-gen-edr'] },
  { id: 'a2-siem-honeytoken', act: 2, tier: 'normal', enemies: ['honeytoken', 'siem'] },
  { id: 'a2-gpo-edr', act: 2, tier: 'normal', enemies: ['group-policy', 'next-gen-edr'] },
  { id: 'a2-pam-honeytoken', act: 2, tier: 'normal', enemies: ['pam', 'honeytoken'] },
  { id: 'a2-gpo-siem', act: 2, tier: 'normal', enemies: ['group-policy', 'siem'] },
  { id: 'a2-pam-edr', act: 2, tier: 'normal', enemies: ['pam', 'next-gen-edr'] },
  { id: 'a2-tier0', act: 2, tier: 'elite', enemies: ['tier0-admin'] },
  { id: 'a2-domain-controller', act: 2, tier: 'boss', enemies: ['kerberos', 'domain-controller', 'gpo-server'] },

  // --- Act 3: OT Facility ---
  { id: 'ot-hmi', act: 3, target: 'ot-facility', tier: 'easy', enemies: ['hmi-operator'] },
  { id: 'ot-historian', act: 3, target: 'ot-facility', tier: 'easy', enemies: ['historian'] },
  { id: 'ot-controller', act: 3, target: 'ot-facility', tier: 'easy', enemies: ['process-controller'] },
  { id: 'ot-diode-hmi', act: 3, target: 'ot-facility', tier: 'normal', enemies: ['data-diode', 'hmi-operator'] },
  { id: 'ot-historian-controller', act: 3, target: 'ot-facility', tier: 'normal', enemies: ['historian', 'process-controller'] },
  { id: 'ot-diode-controller', act: 3, target: 'ot-facility', tier: 'normal', enemies: ['data-diode', 'process-controller'] },
  { id: 'ot-hmi-historian', act: 3, target: 'ot-facility', tier: 'normal', enemies: ['hmi-operator', 'historian'] },
  { id: 'ot-workstation', act: 3, target: 'ot-facility', tier: 'elite', enemies: ['engineering-workstation'] },
  { id: 'ot-sis', act: 3, target: 'ot-facility', tier: 'boss', enemies: ['safety-sensor', 'safety-instrumented-system', 'safety-sensor'] },

  // --- Act 3: Cloud Tenant ---
  { id: 'cloud-conditional-access', act: 3, target: 'cloud-tenant', tier: 'easy', enemies: ['conditional-access'] },
  { id: 'cloud-audit', act: 3, target: 'cloud-tenant', tier: 'easy', enemies: ['cloud-audit-log'] },
  { id: 'cloud-workload', act: 3, target: 'cloud-tenant', tier: 'easy', enemies: ['workload-protection'] },
  { id: 'cloud-audit-ca', act: 3, target: 'cloud-tenant', tier: 'normal', enemies: ['cloud-audit-log', 'conditional-access'] },
  { id: 'cloud-asg-workload', act: 3, target: 'cloud-tenant', tier: 'normal', enemies: ['autoscaling-group', 'workload-protection'] },
  { id: 'cloud-asg-ca', act: 3, target: 'cloud-tenant', tier: 'normal', enemies: ['autoscaling-group', 'conditional-access'] },
  { id: 'cloud-audit-workload', act: 3, target: 'cloud-tenant', tier: 'normal', enemies: ['cloud-audit-log', 'workload-protection'] },
  { id: 'cloud-posture', act: 3, target: 'cloud-tenant', tier: 'elite', enemies: ['posture-scanner'] },
  { id: 'cloud-idp', act: 3, target: 'cloud-tenant', tier: 'boss', enemies: ['token-service', 'identity-provider', 'token-service'] },
];

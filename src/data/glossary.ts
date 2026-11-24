/**
 * Glossary: one or two sentences per themed term, describing game effects
 * only (AggroSec: "enough to know, not too deep"). Numbers come from the
 * engine rules, so the text stays right when a rule is retuned.
 *
 * Content safety (CLAUDE.md): explanations describe what things do in the
 * game, never real-world attack steps.
 */
import { ALERT_LEVELS, CHAIN_BLOCK_PER_STACK, CHAIN_DAMAGE_PER_STACK, DEFAULT_MAX_CYCLES } from '../engine';
import type { CardDef, CardEffect, StatusDef } from '../engine';
import { CLASS_LIST } from './classes';
import { ACT_NAMES, ALERT_LEVEL_NAMES, KEYWORD_NAMES, NODE_NAMES, RARITY_NAMES, TERMS } from './terms';

export interface GlossaryEntry {
  term: string;
  text: string;
}

export interface GlossarySection {
  title: string;
  entries: GlossaryEntry[];
}

function alertLevelsText(): string {
  return ALERT_LEVELS.map((level) => {
    const bonus = level.enemyDamageBonus === 0 ? 'no bonus' : `enemy hits +${level.enemyDamageBonus}`;
    return `${ALERT_LEVEL_NAMES[level.id]} ${level.min}+ (${bonus})`;
  }).join(', ');
}

/** The fixed sections. Statuses are added from content data (see glossarySections). */
const BASE_SECTIONS: GlossarySection[] = [
  {
    title: 'Fights',
    entries: [
      { term: TERMS.operator, text: 'You. A red-team operator working through a target network.' },
      { term: TERMS.opsec, text: 'Your health. It carries over between fights. At 0 you are Burned and the run ends.' },
      { term: TERMS.cycles, text: `Energy for playing cards. You get ${DEFAULT_MAX_CYCLES} each turn; a card's cost is the number in its corner.` },
      { term: TERMS.block, text: 'Absorbs enemy damage until the start of your next turn.' },
      { term: TERMS.integrity, text: "An enemy's health. Bring every enemy to 0 to win the fight." },
      { term: TERMS.intent, text: 'What each enemy will do on its next turn, shown on its panel. Plan around it.' },
      { term: TERMS.alert, text: `How much the defenders have noticed you this fight. Noisy cards and some enemies raise it; higher levels make enemies hit harder. Levels: ${alertLevelsText()}.` },
      {
        term: TERMS.chain,
        text: `Play cards in kill chain order (higher step numbers) within a turn to build Chain. Each stack adds +${CHAIN_DAMAGE_PER_STACK} damage per hit and +${CHAIN_BLOCK_PER_STACK} Block. Same or lower step resets it; it resets each turn.`,
      },
      { term: 'Kill chain step', text: 'The number on each card (1 Reconnaissance to 14 Impact), from the MITRE ATT&CK tactics an attacker moves through.' },
    ],
  },
  {
    title: 'Keywords',
    entries: [
      { term: KEYWORD_NAMES.noisy, text: 'Raises Alert by this much after the card is played.' },
      { term: KEYWORD_NAMES.burner, text: 'Removed for the rest of the fight after you play it.' },
      { term: KEYWORD_NAMES.stash, text: 'Stays in your hand at the end of your turn.' },
      { term: KEYWORD_NAMES.implant, text: 'Stays in play for the whole fight and triggers at the start of each of your turns.' },
      { term: KEYWORD_NAMES.exploit, text: 'Removes all Vuln from the target and deals damage for each stack removed.' },
    ],
  },
  {
    title: 'The run',
    entries: [
      { term: TERMS.arsenal, text: 'Your deck. It grows as you pick up cards.' },
      { term: TERMS.crypto, text: 'Money. Earned from fights, spent at the Dark Web.' },
      { term: TERMS.loot, text: 'Rewards after a fight: Crypto, sometimes a Tool, and a pick of 1 of 3 cards (or skip).' },
      { term: TERMS.tool, text: 'A passive bonus that lasts the whole run.' },
      { term: NODE_NAMES.elite, text: 'A tougher fight with better Loot, including a Tool.' },
      { term: NODE_NAMES.intel, text: 'An event with choices: leaked docs, insider tips, sketchy forum posts.' },
      { term: NODE_NAMES.safehouse, text: `Pick one: ${TERMS.layLow} (recover OpSec), ${TERMS.weaponize} (upgrade a card to v2) or ${TERMS.goDark} (Wipe a card for free).` },
      { term: NODE_NAMES.darkWeb, text: 'A shop: buy cards and Tools, or pay to Wipe a card. Wipes cost more each time.' },
      { term: TERMS.wipe, text: 'Remove a card from your Arsenal for good. A smaller Arsenal draws your best cards more often.' },
      { term: 'v2', text: 'An upgraded card. Weaponize shows exactly what changes.' },
      { term: TERMS.heat, text: 'Extra Alert your next fight starts with, from risky Intel choices.' },
      {
        term: 'Rarity',
        text: `${RARITY_NAMES.public} cards are common, ${RARITY_NAMES.private} are uncommon and ${RARITY_NAMES['zero-day']} are rare and powerful.`,
      },
      {
        term: TERMS.act,
        text: `A run has 3 acts: ${ACT_NAMES[1] ?? ''}, ${ACT_NAMES[2] ?? ''}, then your ${TERMS.finalTarget}. Each ends with a boss. A new act starts by recovering half of your missing ${TERMS.opsec}.`,
      },
      {
        term: TERMS.finalTarget,
        text: 'Act 3: one target environment (like an OT Facility or a Cloud Tenant), drawn when the run starts and shown on the first map, so you can build for its boss.',
      },
      { term: TERMS.runWon, text: 'You beat the Final Target boss and got out with the data. You win the run.' },
      { term: TERMS.runLost, text: 'Your OpSec hit 0. The run is over.' },
    ],
  },
  {
    title: 'Progress',
    entries: [
      { term: TERMS.xp, text: 'Every run, won or lost, gives XP to the class you played. The further you get, the more XP.' },
      { term: TERMS.level, text: 'Each class level adds new cards to that class\'s Loot pool. Unlocks add variety, not raw power.' },
      { term: TERMS.bounties, text: 'Goals across all your runs, listed on the Bounties screen. Each gives XP, and some unlock cards or classes.' },
    ],
  },
  {
    title: 'Classes',
    entries: CLASS_LIST.map((cls) => ({ term: `${cls.name}: ${cls.passiveName}`, text: cls.passiveText })),
  },
];

/** All sections, with statuses (Vuln, Throttled, Implants...) taken from their data. */
export function glossarySections(statuses: readonly StatusDef[]): GlossarySection[] {
  return [
    ...BASE_SECTIONS,
    {
      title: 'Statuses',
      entries: statuses.map((status) => ({ term: status.name, text: status.description })),
    },
  ];
}

/**
 * Glossary entries for the keywords and statuses a card mentions, for the
 * selected-card panel (CLAUDE.md: every themed term is explained in the inspect panel).
 */
export function termsOnCard(card: CardDef, statuses: Readonly<Record<string, StatusDef>>): GlossaryEntry[] {
  const keywordSection = BASE_SECTIONS.find((s) => s.title === 'Keywords')?.entries ?? [];
  const keyword = (name: string) => keywordSection.find((e) => e.term === name);
  const found: GlossaryEntry[] = [];
  const add = (entry: GlossaryEntry | undefined) => {
    if (entry !== undefined && !found.some((e) => e.term === entry.term)) found.push(entry);
  };

  if (card.keywords?.noisy !== undefined) add(keyword(KEYWORD_NAMES.noisy));
  if (card.keywords?.burner === true) add(keyword(KEYWORD_NAMES.burner));
  if (card.keywords?.stash === true) add(keyword(KEYWORD_NAMES.stash));
  if (card.type === 'implant') add(keyword(KEYWORD_NAMES.implant));

  const visit = (effects: readonly CardEffect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'exploit') {
        add(keyword(KEYWORD_NAMES.exploit));
        const vuln = statuses.vuln;
        if (vuln !== undefined) add({ term: vuln.name, text: vuln.description });
      }
      if (effect.kind === 'applyStatus') {
        const status = statuses[effect.status];
        // Implant statuses repeat the card text, so only explain enemy statuses.
        if (status !== undefined && status.implant !== true) add({ term: status.name, text: status.description });
      }
      if (effect.kind === 'ifAlert') visit(effect.then);
    }
  };
  visit(card.effects);
  return found;
}

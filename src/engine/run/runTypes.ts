/**
 * Types for a run: the map, the run state machine, and the run-level content
 * (classes, encounters, Tools, Intel events, and the numbers that drive them).
 *
 * A run moves between phases:
 *
 *   map ──choose node──▶ combat ──win──▶ loot ──▶ map ...
 *                    ├─▶ intel (event) ──▶ map, combat or loot
 *                    ├─▶ safehouse ──▶ map
 *                    └─▶ darkWeb ──▶ map
 *   boss win ──▶ boss Loot ──▶ next act's map (Acts 1-2)
 *   last act's boss win ──▶ outcome "won" (Exfiltrated).  OpSec 0 ──▶ outcome "lost" (Burned).
 */
import type { CombatAction, CombatModifiers, CombatState, ContentRegistry, Rarity } from '../types';

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

/** What's at a map node. Player-facing names (Hardened Target, Intel...) live in terms.ts. */
export type NodeKind = 'fight' | 'elite' | 'intel' | 'safehouse' | 'darkWeb' | 'boss';

/** A node kind the map generator can roll (the boss is always placed after the last floor). */
export type RollableNodeKind = Exclude<NodeKind, 'boss'>;

export interface MapNode {
  /** e.g. "3-1" = floor 3, lane 1. The boss is "boss". */
  id: string;
  /** 1-based floor number. The boss is on floors + 1. */
  floor: number;
  /** 0-based lane (column). */
  lane: number;
  kind: NodeKind;
  /** Ids of nodes on the next floor this node connects to. */
  next: string[];
}

export interface RunMap {
  /** Every node, keyed by id. */
  nodes: Record<string, MapNode>;
  /** Ids of the floor-1 nodes, where the run can start. */
  startIds: string[];
  bossId: string;
}

// ---------------------------------------------------------------------------
// Run-level effects (used by Intel events and Tools)
// ---------------------------------------------------------------------------

/** Something that changes the run (not a single fight). */
export type RunEffect =
  | { kind: 'gainCrypto'; amount: number }
  | { kind: 'loseOpsec'; amount: number }
  | { kind: 'healOpsec'; amount: number }
  /** Raise max OpSec and current OpSec by the same amount. */
  | { kind: 'gainMaxOpsec'; amount: number }
  /** Add a random card of this rarity from the Operator's class pool. */
  | { kind: 'gainRandomCard'; rarity: LootRarity }
  /** Offer a "pick 1 of N" card choice (goes to the Loot screen). */
  | { kind: 'cardChoice'; count: number }
  | { kind: 'gainRandomTool' }
  /** Upgrade a random card that has a v2 and isn't upgraded yet. */
  | { kind: 'upgradeRandomCard' }
  /** Remove the card the player picked (the choice must include a deck index). */
  | { kind: 'wipeChosenCard' }
  /** Remove the picked card and gain a random class card one rarity higher. */
  | { kind: 'tradeUpChosenCard' }
  /** Add Heat: the next fight starts with this much more Alert. */
  | { kind: 'heat'; amount: number }
  /** Start a fight from this encounter tier. Normal Loot follows a win. */
  | { kind: 'fight'; tier: 'easy' | 'normal' | 'elite' };

// ---------------------------------------------------------------------------
// Run-level content
// ---------------------------------------------------------------------------

/** Rarities that can drop as Loot (starter cards never do). */
export type LootRarity = Exclude<Rarity, 'starter'>;

export interface RunClassDef {
  id: string;
  maxOpsec: number;
  /** Cycles per turn. Defaults to DEFAULT_MAX_CYCLES (3). */
  maxCycles?: number;
  /** Card ids, duplicates allowed. */
  starterDeck: readonly string[];
  /** The class's unique passive ability. */
  passive?: ClassPassive;
}

/** A class passive, as data. Every part is optional. */
export interface ClassPassive {
  /** Applied to every fight (added to Tool bonuses). */
  combat?: CombatModifiers;
  /** Extra Loot picks (the Exploit Dev's). */
  bonusLoot?: BonusLootRule;
}

/**
 * A second "pick 1 of N" after some fights.
 * Fires after every `everyFightsWon`-th fight won, and after every Hardened Target if `afterElite`.
 */
export interface BonusLootRule {
  everyFightsWon: number;
  afterElite: boolean;
  rarityWeights: Readonly<Record<LootRarity, number>>;
  cardChoices: number;
}

/** A Final Target for Act 3 (OT Facility, Cloud Tenant...). Its enemies are encounters with `target` set. */
export interface TargetDef {
  id: string;
  name: string;
  /** One or two sentences shown when the target is drawn. */
  description: string;
  /** Name of the boss, shown up front so the Arsenal can be planned around it. */
  bossName: string;
}

export interface EncounterDef {
  id: string;
  act: number;
  /** For the Final Target act: which target this encounter belongs to. */
  target?: string;
  /** easy: first fights of an act. normal: the rest. elite: Hardened Targets. boss: end of act. */
  tier: 'easy' | 'normal' | 'elite' | 'boss';
  /** Enemy ids, left to right. */
  enemies: readonly string[];
}

/** A Tool (relic): a passive bonus for the rest of the run. */
export interface ToolDef {
  id: string;
  name: string;
  description: string;
  /** Fires once when the Tool is gained. */
  onPickup?: readonly RunEffect[];
  /** Fires after every won fight, before Loot. */
  afterCombatWin?: readonly RunEffect[];
  /** Bonuses in every fight while you hold this Tool (numbers add up across Tools). */
  combat?: CombatModifiers;
  /** Lay Low recovers this many extra percent of max OpSec. */
  layLowBonusPercent?: number;
}

export interface EventChoice {
  label: string;
  /** Crypto paid to pick this choice. The choice is unavailable if you can't pay. */
  cryptoCost?: number;
  effects: readonly RunEffect[];
}

/** An Intel event: some text and 2-3 choices. */
export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: readonly EventChoice[];
  /** Acts the event can appear in. Omit for every act. */
  acts?: readonly number[];
}

/** One Loot table (normal fight, Hardened Target, boss). */
export interface LootTable {
  rarityWeights: Readonly<Record<LootRarity, number>>;
  /** Inclusive range. */
  crypto: readonly [number, number];
  cardChoices: number;
  /** Does this Loot include a random Tool? */
  tool: boolean;
}

/** All the numbers that shape a run. Lives in src/data so it can be tuned as data. */
export interface RunConfig {
  /** Acts in a full run. The last one is the Final Target. */
  acts: number;
  /** At the start of each act after the first, recover this percent of missing OpSec (rounded down). */
  actHealPercentOfMissing: number;
  floors: number;
  lanes: number;
  /** How many paths the map generator draws from floor 1 to the last floor. */
  paths: number;
  /** Relative odds of each node kind on floors that aren't fixed. */
  nodeWeights: Readonly<Record<RollableNodeKind, number>>;
  /** Floors where every node is one kind, e.g. a Safehouse row before the boss. */
  fixedFloors: readonly { floor: number; kind: RollableNodeKind }[];
  /** Kinds that may not be rolled on specific floors. */
  bannedKinds: readonly { floor: number; kinds: readonly RollableNodeKind[] }[];
  /** Kinds that may not follow themselves directly on a path (e.g. Safehouse → Safehouse). */
  noBackToBack: readonly RollableNodeKind[];
  /** The first N regular fights of each act use the easy encounter pool. */
  easyFightCount: number;
  /** Wipe and Go Dark can't shrink the Arsenal below this many cards. */
  minArsenalSize: number;
  startingCrypto: number;
  loot: Readonly<Record<'fight' | 'elite' | 'boss', LootTable>>;
  darkWeb: {
    cardCount: number;
    toolCount: number;
    cardPrice: Readonly<Record<LootRarity, readonly [number, number]>>;
    toolPrice: readonly [number, number];
    /** One random card is sold at this fraction of its price (0.5 = half off). Use 1 for no sale. */
    saleMultiplier: number;
    wipeBasePrice: number;
    /** Each Wipe bought this run raises the Wipe price by this much. No per-visit limit. */
    wipePriceStep: number;
  };
  safehouse: {
    /** Lay Low recovers this percent of max OpSec (rounded down). */
    layLowPercent: number;
  };
}

/** Everything the run engine needs: the combat registry plus run-level content. */
export interface RunContent extends ContentRegistry {
  classes: Readonly<Record<string, RunClassDef>>;
  encounters: Readonly<Record<string, EncounterDef>>;
  tools: Readonly<Record<string, ToolDef>>;
  events: Readonly<Record<string, EventDef>>;
  targets: Readonly<Record<string, TargetDef>>;
  config: RunConfig;
}

// ---------------------------------------------------------------------------
// Run state
// ---------------------------------------------------------------------------

export interface ShopItem {
  id: string;
  price: number;
  sold: boolean;
}

export interface LootOffer {
  /** Crypto already added to the run (shown on the Loot screen). */
  crypto: number;
  /** Tool already gained, if any. */
  toolId: string | null;
  /** Pick 1 of these, or skip. Empty once picked or skipped. */
  cardChoices: string[];
  /** True for a class passive's bonus pick (shown after the normal Loot). */
  bonus?: boolean;
}

export type RunPhase =
  | { kind: 'map' }
  | { kind: 'combat'; combat: CombatState; encounterId: string; lootTable: 'fight' | 'elite' | 'boss' }
  | { kind: 'loot'; loot: LootOffer }
  | { kind: 'intel'; eventId: string }
  | { kind: 'safehouse' }
  | { kind: 'darkWeb'; cards: ShopItem[]; tools: ShopItem[] };

export type RunOutcome = 'ongoing' | 'won' | 'lost';

export interface RunState {
  classId: string;
  /** Current act, 1 to config.acts. */
  act: number;
  /** The Final Target drawn at the start of the run (Act 3). */
  finalTargetId: string;
  /** Set when a new act starts, until the first node is chosen (the UI shows the act intro). */
  actStart: { act: number; healed: number } | null;
  outcome: RunOutcome;
  opsec: number;
  maxOpsec: number;
  crypto: number;
  /** Card ids in the Arsenal. Upgraded cards end in "+" (see upgrades.ts). */
  deck: string[];
  tools: string[];
  map: RunMap;
  /** The node the Operator is at, or null before choosing a floor-1 node. */
  currentNodeId: string | null;
  phase: RunPhase;
  /** Heat: extra Alert the next fight starts with. Resets to 0 when that fight starts. */
  heat: number;
  /** Regular fights started this act (for the easy-fight rule). */
  fightsStarted: number;
  /** Fights won this run, of any kind (for the Exploit Dev's bonus pick). */
  fightsWon: number;
  /** A class passive's bonus pick, waiting for the normal Loot to finish. */
  pendingBonusChoices: string[];
  /** Cards the player hasn't unlocked yet: never offered as Loot, at the Dark Web or by Intel. */
  lockedCardIds: string[];
  /** Highest Alert reached in any fight this run (for Bounties). */
  peakAlert: number;
  /** Boss encounters beaten this run, in order (for Bounties). */
  bossesBeaten: string[];
  /** Intel events already seen this run (they don't repeat until all are used). */
  seenEventIds: string[];
  /** Wipes bought at the Dark Web this run (raises the price). */
  wipesBought: number;
  rngState: number;
}

export type RunAction =
  | { type: 'CHOOSE_NODE'; nodeId: string }
  | { type: 'COMBAT'; action: CombatAction }
  | { type: 'PICK_LOOT_CARD'; index: number }
  | { type: 'SKIP_LOOT' }
  | { type: 'EVENT_CHOICE'; index: number; deckIndex?: number }
  | { type: 'LAY_LOW' }
  | { type: 'WEAPONIZE'; deckIndex: number }
  | { type: 'GO_DARK'; deckIndex: number }
  | { type: 'BUY_CARD'; index: number }
  | { type: 'BUY_TOOL'; index: number }
  | { type: 'BUY_WIPE'; deckIndex: number }
  | { type: 'LEAVE' };

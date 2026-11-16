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
 *   boss win ──▶ outcome "won" (Exfiltrated).  OpSec 0 ──▶ outcome "lost" (Burned).
 */
import type { CombatAction, CombatState, ContentRegistry, Rarity } from '../types';

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
  /** Card ids, duplicates allowed. */
  starterDeck: readonly string[];
}

export interface EncounterDef {
  id: string;
  act: number;
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
  /** The first N regular fights of a run use the easy encounter pool. */
  easyFightCount: number;
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
    /** Each Wipe bought this run raises the Wipe price by this much. */
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
}

export type RunPhase =
  | { kind: 'map' }
  | { kind: 'combat'; combat: CombatState; encounterId: string; lootTable: 'fight' | 'elite' | 'boss' }
  | { kind: 'loot'; loot: LootOffer }
  | { kind: 'intel'; eventId: string }
  | { kind: 'safehouse' }
  | { kind: 'darkWeb'; cards: ShopItem[]; tools: ShopItem[]; wipeUsed: boolean };

export type RunOutcome = 'ongoing' | 'won' | 'lost';

export interface RunState {
  classId: string;
  /** Current act (1-3). Milestone 3 runs are Act 1 only. */
  act: number;
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
  /** Regular fights started so far (for the easy-fight rule). */
  fightsStarted: number;
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

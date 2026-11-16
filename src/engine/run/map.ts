/**
 * Act map generator.
 *
 * 1. Draw `paths` walks from floor 1 to the last floor. Each step moves to the
 *    same lane or a neighboring one, and never crosses an existing line.
 * 2. Every lane a walk touches becomes a node; the walks' steps become links.
 * 3. Roll each node's kind from the config odds, honoring fixed floors,
 *    banned kinds and the "no back-to-back" rule.
 * 4. Every last-floor node links to the boss.
 *
 * Same RNG state = same map, so a run's seed fully decides its map.
 */
import type { Rng } from '../rng';
import type { MapNode, NodeKind, RollableNodeKind, RunConfig, RunMap } from './runTypes';

export const BOSS_NODE_ID = 'boss';

/** Order used when rolling kinds, so weights line up with indexes. */
const ROLLABLE_KINDS: readonly RollableNodeKind[] = ['fight', 'elite', 'intel', 'safehouse', 'darkWeb'];

export function nodeId(floor: number, lane: number): string {
  return `${floor}-${lane}`;
}

/** A link from `fromLane` on one floor to `toLane` on the next. */
interface Link {
  fromLane: number;
  toLane: number;
}

/** Two links between the same pair of floors cross if they swap left/right order. */
function crosses(a: Link, b: Link): boolean {
  return (a.fromLane < b.fromLane && a.toLane > b.toLane) || (a.fromLane > b.fromLane && a.toLane < b.toLane);
}

/** Pick a start lane for each path. The first two paths start in different lanes. */
function pickStartLane(pathIndex: number, firstStart: number, lanes: number, rng: Rng): number {
  if (pathIndex === 1 && lanes > 1) return (firstStart + 1 + rng.nextInt(lanes - 1)) % lanes;
  return rng.nextInt(lanes);
}

/**
 * links[f] holds the links from floor f to floor f + 1 (floors are 1-based,
 * so links[0] is unused).
 */
function drawPaths(config: RunConfig, rng: Rng): { visited: Set<string>; links: Link[][] } {
  const visited = new Set<string>();
  const links: Link[][] = Array.from({ length: config.floors }, () => []);
  let firstStart = 0;

  for (let p = 0; p < config.paths; p++) {
    let lane = pickStartLane(p, firstStart, config.lanes, rng);
    if (p === 0) firstStart = lane;
    visited.add(nodeId(1, lane));

    for (let floor = 1; floor < config.floors; floor++) {
      const floorLinks = links[floor] ?? [];
      const options = rng.shuffle([lane - 1, lane, lane + 1].filter((l) => l >= 0 && l < config.lanes));
      // A straight step can never cross a neighbor step, so `lane` is always a safe fallback.
      const toLane = options.find((to) => !floorLinks.some((link) => crosses(link, { fromLane: lane, toLane: to }))) ?? lane;
      if (!floorLinks.some((link) => link.fromLane === lane && link.toLane === toLane)) {
        floorLinks.push({ fromLane: lane, toLane });
      }
      lane = toLane;
      visited.add(nodeId(floor + 1, lane));
    }
  }
  return { visited, links };
}

/** The kind for one node, given its floor and the kinds of nodes that lead into it. */
function rollKind(floor: number, parentKinds: readonly NodeKind[], config: RunConfig, rng: Rng): RollableNodeKind {
  const fixed = config.fixedFloors.find((f) => f.floor === floor);
  if (fixed !== undefined) return fixed.kind;

  const banned = new Set(config.bannedKinds.filter((b) => b.floor === floor).flatMap((b) => b.kinds));
  const weights = ROLLABLE_KINDS.map((kind) => {
    if (banned.has(kind)) return 0;
    if (config.noBackToBack.includes(kind) && parentKinds.includes(kind)) return 0;
    return config.nodeWeights[kind];
  });
  if (weights.every((w) => w <= 0)) return 'fight';
  return ROLLABLE_KINDS[rng.pickWeightedIndex(weights)] ?? 'fight';
}

export function generateMap(config: RunConfig, rng: Rng): RunMap {
  const { visited, links } = drawPaths(config, rng);
  const nodes: Record<string, MapNode> = {};

  // Create nodes floor by floor, left to right, so kinds can look at parents.
  for (let floor = 1; floor <= config.floors; floor++) {
    for (let lane = 0; lane < config.lanes; lane++) {
      const id = nodeId(floor, lane);
      if (!visited.has(id)) continue;

      const parentKinds = (links[floor - 1] ?? [])
        .filter((link) => link.toLane === lane)
        .map((link) => nodes[nodeId(floor - 1, link.fromLane)]?.kind)
        .filter((kind): kind is NodeKind => kind !== undefined);

      const next =
        floor === config.floors
          ? [BOSS_NODE_ID]
          : (links[floor] ?? []).filter((link) => link.fromLane === lane).map((link) => nodeId(floor + 1, link.toLane));

      nodes[id] = { id, floor, lane, kind: rollKind(floor, parentKinds, config, rng), next };
    }
  }

  const bossLane = Math.floor((config.lanes - 1) / 2);
  nodes[BOSS_NODE_ID] = { id: BOSS_NODE_ID, floor: config.floors + 1, lane: bossLane, kind: 'boss', next: [] };

  const startIds = Object.values(nodes)
    .filter((node) => node.floor === 1)
    .map((node) => node.id);

  return { nodes, startIds, bossId: BOSS_NODE_ID };
}

/** Nodes the Operator can move to next (floor-1 nodes at the start of a run). */
export function reachableNodeIds(map: RunMap, currentNodeId: string | null): string[] {
  if (currentNodeId === null) return map.startIds;
  return map.nodes[currentNodeId]?.next ?? [];
}

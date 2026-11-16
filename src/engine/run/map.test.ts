import { describe, expect, it } from 'vitest';
import { TEST_CONFIG } from '../__fixtures__/runContent';
import { Rng } from '../rng';
import { BOSS_NODE_ID, generateMap, nodeId, reachableNodeIds } from './map';
import type { MapNode, RunMap } from './runTypes';

function mapFor(seed: number): RunMap {
  return generateMap(TEST_CONFIG, new Rng(seed));
}

function nodesOn(map: RunMap, floor: number): MapNode[] {
  return Object.values(map.nodes).filter((node) => node.floor === floor);
}

/** Every link as [from, to] nodes. */
function links(map: RunMap): [MapNode, MapNode][] {
  return Object.values(map.nodes).flatMap((from) =>
    from.next.map((id): [MapNode, MapNode] => {
      const to = map.nodes[id];
      if (to === undefined) throw new Error(`Dangling link ${from.id} -> ${id}`);
      return [from, to];
    }),
  );
}

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

describe('generateMap', () => {
  it('is deterministic for a seed', () => {
    expect(mapFor(42)).toEqual(mapFor(42));
  });

  it('gives different maps for different seeds', () => {
    const shapes = new Set(SEEDS.slice(0, 20).map((seed) => JSON.stringify(mapFor(seed))));
    expect(shapes.size).toBeGreaterThan(15);
  });

  it('every floor is reachable and links only step to a neighbor lane (200 seeds)', () => {
    for (const seed of SEEDS) {
      const map = mapFor(seed);
      for (let floor = 1; floor <= TEST_CONFIG.floors; floor++) {
        expect(nodesOn(map, floor).length, `floor ${floor}`).toBeGreaterThan(0);
      }
      expect(map.startIds.length).toBeGreaterThanOrEqual(2);

      for (const [from, to] of links(map)) {
        expect(to.floor).toBe(from.floor + 1);
        if (to.id !== BOSS_NODE_ID) expect(Math.abs(to.lane - from.lane)).toBeLessThanOrEqual(1);
      }

      // Every node past floor 1 has a way in, and every node has a way out (except the boss).
      const hasParent = new Set(links(map).map(([, to]) => to.id));
      for (const node of Object.values(map.nodes)) {
        if (node.floor > 1) expect(hasParent.has(node.id), node.id).toBe(true);
        if (node.id !== BOSS_NODE_ID) expect(node.next.length, node.id).toBeGreaterThan(0);
      }
    }
  });

  it('links never cross (200 seeds)', () => {
    for (const seed of SEEDS) {
      const all = links(mapFor(seed)).filter(([, to]) => to.id !== BOSS_NODE_ID);
      for (const [a1, a2] of all) {
        for (const [b1, b2] of all) {
          if (a1.floor !== b1.floor) continue;
          const crosses = (a1.lane < b1.lane && a2.lane > b2.lane) || (a1.lane > b1.lane && a2.lane < b2.lane);
          expect(crosses, `${a1.id}->${a2.id} crosses ${b1.id}->${b2.id}`).toBe(false);
        }
      }
    }
  });

  it('honors fixed floors, banned kinds and no back-to-back (200 seeds)', () => {
    for (const seed of SEEDS) {
      const map = mapFor(seed);
      for (const node of nodesOn(map, 6)) {
        expect(node.kind).toBe('safehouse');
        expect(node.next).toEqual([BOSS_NODE_ID]);
      }
      for (const node of nodesOn(map, 5)) expect(node.kind).not.toBe('safehouse');
      for (const [from, to] of links(map)) {
        if (from.kind === 'safehouse' || from.kind === 'darkWeb') {
          expect(to.kind, `${from.id} -> ${to.id}`).not.toBe(from.kind);
        }
      }
      expect(map.nodes[BOSS_NODE_ID]?.kind).toBe('boss');
    }
  });

  it('rolls every kind somewhere across many seeds', () => {
    const kinds = new Set(SEEDS.flatMap((seed) => Object.values(mapFor(seed).nodes).map((node) => node.kind)));
    expect([...kinds].sort()).toEqual(['boss', 'darkWeb', 'elite', 'fight', 'intel', 'safehouse']);
  });
});

describe('reachableNodeIds', () => {
  it('starts on floor 1, then follows links', () => {
    const map = mapFor(7);
    expect(reachableNodeIds(map, null)).toEqual(map.startIds);
    const start = map.startIds[0] ?? '';
    expect(reachableNodeIds(map, start)).toEqual(map.nodes[start]?.next);
    expect(nodeId(3, 2)).toBe('3-2');
  });
});

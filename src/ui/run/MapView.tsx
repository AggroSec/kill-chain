/**
 * The act map: floor 1 at the bottom, the boss at the top. Nodes you can
 * move to are bright buttons; everything else is display only. Links are
 * drawn as an SVG layer behind the nodes.
 *
 * Milestone 3 debug map. Milestone 4 replaces it with the real phone UI.
 */
import { useEffect, useRef } from 'react';
import { reachableNodeIds } from '../../engine';
import type { MapNode, NodeKind, RunState } from '../../engine';
import { NODE_NAMES, TERMS } from '../../data/terms';

/** One glyph per node kind (icons, not words, so they don't live in terms.ts). */
const NODE_GLYPHS: Readonly<Record<NodeKind, string>> = {
  fight: '⚔',
  elite: '☠',
  intel: '?',
  safehouse: '⌂',
  darkWeb: '₿',
  boss: '★',
};

/** Vertical space per floor, in px. Nodes are 44px, so this leaves room for links. */
const ROW_HEIGHT = 64;

interface MapViewProps {
  run: RunState;
  floors: number;
  lanes: number;
  onChoose: (nodeId: string) => void;
}

export function MapView({ run, floors, lanes, onChoose }: MapViewProps) {
  const reachableIds = reachableNodeIds(run.map, run.currentNodeId);
  const reachable = new Set(reachableIds);
  const nodes = Object.values(run.map.nodes);
  const height = (floors + 1) * ROW_HEIGHT;
  const firstReachable = useRef<HTMLButtonElement | null>(null);

  // Scroll so the next choices are on screen.
  useEffect(() => {
    firstReachable.current?.scrollIntoView({ block: 'center' });
  }, [run.currentNodeId]);

  /** Position as percent across (x) and px down (y); the boss row is at the top. */
  const position = (node: MapNode) => ({
    // The boss sits centered above the last floor.
    x: node.kind === 'boss' ? 50 : ((node.lane + 0.5) / lanes) * 100,
    y: (floors + 1 - node.floor) * ROW_HEIGHT + ROW_HEIGHT / 2,
  });

  return (
    <section className="map-section">
      <h2>{TERMS.chooseNext}</h2>
      <div className="map" style={{ height }}>
        <svg className="map-links" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {nodes.flatMap((from) =>
            from.next.map((toId) => {
              const to = run.map.nodes[toId];
              if (to === undefined) return null;
              const a = position(from);
              const b = position(to);
              const active = from.id === run.currentNodeId;
              return (
                <line
                  key={`${from.id}>${toId}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  className={active ? 'map-link active' : 'map-link'}
                  vectorEffect="non-scaling-stroke"
                />
              );
            }),
          )}
        </svg>
        {nodes.map((node) => {
          const { x, y } = position(node);
          const canGo = reachable.has(node.id);
          const isHere = node.id === run.currentNodeId;
          const passed = run.currentNodeId !== null && node.floor <= (run.map.nodes[run.currentNodeId]?.floor ?? 0);
          const classes = ['map-node', `node-${node.kind}`, canGo ? 'reachable' : '', isHere ? 'here' : '', passed && !isHere ? 'passed' : ''];
          return (
            <button
              key={node.id}
              ref={node.id === reachableIds[0] ? firstReachable : undefined}
              type="button"
              className={classes.join(' ')}
              style={{ left: `${x}%`, top: y }}
              disabled={!canGo}
              aria-label={`${NODE_NAMES[node.kind]}, ${TERMS.floor} ${node.floor}`}
              onClick={() => onChoose(node.id)}
            >
              {NODE_GLYPHS[node.kind]}
            </button>
          );
        })}
      </div>
      <ul className="map-legend">
        {(Object.keys(NODE_GLYPHS) as NodeKind[]).map((kind) => (
          <li key={kind}>
            <span className={`legend-glyph node-${kind}`}>{NODE_GLYPHS[kind]}</span> {NODE_NAMES[kind]}
          </li>
        ))}
      </ul>
    </section>
  );
}

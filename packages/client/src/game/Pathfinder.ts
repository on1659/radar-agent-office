import type { TileMap } from './TileMap';

export interface PathNode {
  x: number;
  y: number;
}

/** A* pathfinding node (internal) */
interface AStarNode {
  x: number;
  y: number;
  /** Cost from start */
  g: number;
  /** Heuristic estimate to end */
  h: number;
  /** Total cost (g + h) */
  f: number;
  /** Parent node for path reconstruction */
  parent: AStarNode | null;
}

/** 4-directional movement offsets (no diagonals — Pokemon style) */
const DIRS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 }, // up
  { dx: 1, dy: 0 },  // right
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
];

/** Manhattan distance heuristic */
function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/** Encode (x, y) into a single number for use as a Map key */
function key(x: number, y: number): number {
  return y * 10000 + x;
}

/**
 * A* pathfinding on a TileMap.
 *
 * Handles special cases:
 * - The start tile is always considered walkable (agent is already there).
 * - The end tile is considered walkable if it's in the `overrideWalkable` set.
 * - If the end tile is not walkable (and not overridden), tries to path to
 *   the nearest walkable tile adjacent to it.
 *
 * @param startX - Start tile column
 * @param startY - Start tile row
 * @param endX   - Goal tile column
 * @param endY   - Goal tile row
 * @param tileMap - The TileMap instance providing walkability info
 * @param overrideWalkable - Optional set of tile keys that should be treated as walkable
 *                           (e.g., DESK tiles for agents to sit at). Use key(x,y) to generate keys.
 * @returns Array of {x, y} path nodes (excluding start, including end), or null if unreachable.
 *          Empty array if start === end.
 */
export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tileMap: TileMap,
  overrideWalkable?: Set<number>,
): PathNode[] | null {
  // Same position — no movement needed
  if (startX === endX && startY === endY) return [];

  // Build a combined override set: always include start tile
  const overrides = new Set<number>(overrideWalkable);
  overrides.add(key(startX, startY));

  // Check if end is reachable
  const endIsWalkable = tileMap.isWalkable(endX, endY) || overrides.has(key(endX, endY));
  if (!endIsWalkable) {
    // Try to find the nearest walkable tile adjacent to the target
    return findPathToAdjacent(startX, startY, endX, endY, tileMap, overrides);
  }

  return astar(startX, startY, endX, endY, tileMap, overrides);
}

/** Convenience re-export of key() for external use (e.g., building overrideWalkable sets) */
export function tileKey(x: number, y: number): number {
  return key(x, y);
}

/** Core A* implementation */
function astar(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tileMap: TileMap,
  overrides: Set<number>,
): PathNode[] | null {
  const startNode: AStarNode = {
    x: startX,
    y: startY,
    g: 0,
    h: manhattan(startX, startY, endX, endY),
    f: manhattan(startX, startY, endX, endY),
    parent: null,
  };

  // Open set — simple array (map is small 12x8 = 96 tiles, no need for a binary heap)
  const open: AStarNode[] = [startNode];
  const closed = new Set<number>();
  const gScores = new Map<number, number>();
  gScores.set(key(startX, startY), 0);

  while (open.length > 0) {
    // Find node with lowest f in open set
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) {
        bestIdx = i;
      }
    }

    const current = open[bestIdx];
    open.splice(bestIdx, 1);

    // Reached the goal
    if (current.x === endX && current.y === endY) {
      return reconstructPath(current);
    }

    const currentKey = key(current.x, current.y);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    // Expand neighbours
    for (const dir of DIRS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = key(nx, ny);

      if (closed.has(nKey)) continue;

      // A tile is walkable if the tileMap says so, or if it's in the overrides set
      const walkable = tileMap.isWalkable(nx, ny) || overrides.has(nKey);
      if (!walkable) continue;

      const tentativeG = current.g + 1;
      const existingG = gScores.get(nKey);

      if (existingG !== undefined && tentativeG >= existingG) continue;

      gScores.set(nKey, tentativeG);

      const h = manhattan(nx, ny, endX, endY);
      const neighbor: AStarNode = {
        x: nx,
        y: ny,
        g: tentativeG,
        h,
        f: tentativeG + h,
        parent: current,
      };

      open.push(neighbor);
    }
  }

  // No path found
  return null;
}

/**
 * When the target tile itself is not walkable (e.g., a DESK or MEETING_TABLE),
 * find a path to the nearest walkable tile adjacent to the target.
 */
function findPathToAdjacent(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  tileMap: TileMap,
  overrides: Set<number>,
): PathNode[] | null {
  // Collect walkable adjacent tiles to the target
  const candidates: PathNode[] = [];
  for (const dir of DIRS) {
    const ax = endX + dir.dx;
    const ay = endY + dir.dy;
    if (tileMap.isWalkable(ax, ay) || overrides.has(key(ax, ay))) {
      candidates.push({ x: ax, y: ay });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by manhattan distance to start (prefer closer alternatives)
  candidates.sort((a, b) =>
    manhattan(startX, startY, a.x, a.y) - manhattan(startX, startY, b.x, b.y)
  );

  // Try each candidate
  for (const candidate of candidates) {
    const path = astar(startX, startY, candidate.x, candidate.y, tileMap, overrides);
    if (path !== null) return path;
  }

  return null;
}

/** Reconstruct path from end node to start (excluding start node) */
function reconstructPath(endNode: AStarNode): PathNode[] {
  const path: PathNode[] = [];
  let current: AStarNode | null = endNode;
  while (current !== null && current.parent !== null) {
    path.push({ x: current.x, y: current.y });
    current = current.parent;
  }
  path.reverse();
  return path;
}

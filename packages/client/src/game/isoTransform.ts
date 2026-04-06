/**
 * Isometric coordinate transform — pure functions, no side effects.
 * No external imports to avoid circular dependencies with utils.ts.
 */

/** Map dimensions in tiles (duplicated from utils.ts to break circular dep) */
const _MAP_COLS = 20;
const _MAP_ROWS = 14;

// ── Constants ────────────────────────────────────────────────────────

/** Isometric tile width (diamond horizontal span) */
export const ISO_TILE_W = 48; // TILE_SIZE * 2

/** Isometric tile height (diamond vertical span) */
export const ISO_TILE_H = 24; // TILE_SIZE

/** Side-face depth in pixels */
export const FACE_DEPTH = 10; // ISO_TILE_H * 0.4 ≈ 10

/** X offset so the leftmost map vertex sits at x = 0 */
export const ISO_ORIGIN_X = _MAP_ROWS * ISO_TILE_W / 2;

/** Total isometric map pixel width */
export const ISO_MAP_W = (_MAP_COLS + _MAP_ROWS) * ISO_TILE_W / 2;

/** Total isometric map pixel height (including side face) */
export const ISO_MAP_H = (_MAP_COLS + _MAP_ROWS) * ISO_TILE_H / 2 + FACE_DEPTH;

// ── Functions ────────────────────────────────────────────────────────

/**
 * Tile coordinate to isometric screen position (top vertex of diamond).
 * Accepts fractional col/row for interpolated movement.
 */
export function tileToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (ISO_TILE_W / 2) + ISO_ORIGIN_X,
    y: (col + row) * (ISO_TILE_H / 2),
  };
}

/**
 * Screen position to tile coordinate (inverse transform).
 * Uses Math.floor rounding for click hit-testing.
 */
export function screenToTile(x: number, y: number): { col: number; row: number } {
  const ox = x - ISO_ORIGIN_X;
  return {
    col: Math.floor((ox / (ISO_TILE_W / 2) + y / (ISO_TILE_H / 2)) / 2),
    row: Math.floor((y / (ISO_TILE_H / 2) - ox / (ISO_TILE_W / 2)) / 2),
  };
}

/**
 * Z-ordering depth value. Higher = closer to viewer (drawn later).
 */
export function getIsoDepth(col: number, row: number): number {
  return col + row;
}

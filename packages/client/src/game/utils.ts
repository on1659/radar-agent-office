// Re-export isometric constants and functions so other modules only need to import from utils
export {
  ISO_TILE_W, ISO_TILE_H, FACE_DEPTH,
  ISO_ORIGIN_X, ISO_MAP_W, ISO_MAP_H,
  tileToScreen, screenToTile, getIsoDepth,
} from './isoTransform';

/** Tile size in CSS pixels */
export const TILE_SIZE = 24;

/** Map dimensions in tiles */
export const MAP_COLS = 20;
export const MAP_ROWS = 14;

/** Convert tile coordinates to CSS pixel coordinates */
export function tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
  return {
    x: tileX * TILE_SIZE,
    y: tileY * TILE_SIZE,
  };
}

/**
 * Set up a canvas element for crisp rendering on high-DPI displays.
 * Scales the backing store by devicePixelRatio while keeping CSS size unchanged.
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  // Pixel art should be crisp, not blurred
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

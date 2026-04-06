import { MAP_COLS, MAP_ROWS } from './utils';
import {
  tileToScreen,
  ISO_TILE_W,
  ISO_TILE_H,
  ISO_MAP_W,
  ISO_MAP_H,
  FACE_DEPTH,
} from './isoTransform';

/** Types of tiles in the office map */
export enum TileType {
  FLOOR = 0,
  WALL = 1,
  DESK = 2,
  MONITOR = 3,
  MEETING_TABLE = 4,
  CORRIDOR = 5,
  PLANT = 6,
  BOOKSHELF = 7,
  SOFA = 8,
  KITCHEN = 9,
}

// Abbreviations for readability
const F = TileType.FLOOR;
const W = TileType.WALL;
const D = TileType.DESK;
const M = TileType.MEETING_TABLE;
const C = TileType.CORRIDOR;
const P = TileType.PLANT;
const B = TileType.BOOKSHELF;
const S = TileType.SOFA;
const K = TileType.KITCHEN;

/**
 * 20×14 office layout — Claw3D-inspired warm retro office.
 *
 * Work Zone A (rows 1-2, cols 1-7):  Desks with monitors
 * Work Zone B (rows 6-7, cols 1-7):  Desks with monitors
 * Meeting Room (rows 1-2, cols 14-17): Conference table
 * Lounge (rows 6-7, cols 15-16):      Sofas
 * Open Area (cols 9-11):              Floor with plants
 * Bottom Zone (rows 11-12):           Bookshelves + kitchen
 * Corridors: rows 5/10 + cols 4/8/12
 */
const MAP_DATA: TileType[][] = [
  /* row  0 */ [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  /* row  1 */ [W, D, D, D, C, D, D, D, C, F, P, F, C, W, M, M, M, M, W, W],
  /* row  2 */ [W, D, D, D, C, D, D, D, C, F, F, F, C, W, M, M, M, M, W, W],
  /* row  3 */ [W, F, F, F, C, F, F, F, C, F, F, F, C, F, F, F, F, F, F, W],
  /* row  4 */ [W, F, F, F, C, F, F, F, C, F, F, F, C, F, F, F, F, F, F, W],
  /* row  5 */ [W, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, W],
  /* row  6 */ [W, D, D, D, C, D, D, D, C, F, P, F, C, W, F, S, S, F, W, W],
  /* row  7 */ [W, D, D, D, C, D, D, D, C, F, F, F, C, W, F, S, S, F, W, W],
  /* row  8 */ [W, F, F, F, C, F, F, F, C, F, F, F, C, F, F, F, F, F, F, W],
  /* row  9 */ [W, F, F, F, C, F, F, F, C, F, F, F, C, F, F, F, F, F, F, W],
  /* row 10 */ [W, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, W],
  /* row 11 */ [W, B, F, F, C, F, F, B, C, F, F, F, C, B, F, F, F, F, B, W],
  /* row 12 */ [W, F, F, F, C, F, F, F, C, F, K, F, C, F, F, F, F, F, F, W],
  /* row 13 */ [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
];

// Half-tile constants
const HW = ISO_TILE_W / 2; // 24
const HH = ISO_TILE_H / 2; // 12

// ── Color Palette (Claw3D-inspired warm retro office) ────────────────

const COL = {
  floor:    { t: '#d4b98a', l: '#a88860', r: '#bc9c72' },
  wall:     { t: '#787878', l: '#484848', r: '#585858' },
  corridor: { t: '#c8a87a', l: '#9a7a52', r: '#b08e62' },
  desk:     { t: '#8b6b3d', l: '#5c3d20', r: '#6b4a28' },
  meeting:  { t: '#7a5030', l: '#4a2a18', r: '#5a3820' },
  pot:      { t: '#c07040', l: '#8a4828', r: '#a05830' },
  shelf:    { t: '#5a4030', l: '#3a2818', r: '#4a3420' },
  sofa:     { t: '#4a6898', l: '#2e4468', r: '#3a5480' },
  sofaBack: { t: '#3a5888', l: '#243858', r: '#2e4870' },
  kitchen:  { t: '#b0a898', l: '#807870', r: '#988e80' },
  machine:  { t: '#505050', l: '#333333', r: '#404040' },
};

// ── Helper: isometric box ────────────────────────────────────────────

/** Draw an isometric box (diamond top-face + left/right side-faces) */
function isoBox(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  hw: number, hh: number,
  depth: number,
  top: string, left: string, right: string,
): void {
  // Top face (diamond)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + hw, cy + hh);
  ctx.lineTo(cx, cy + 2 * hh);
  ctx.lineTo(cx - hw, cy + hh);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();

  if (depth > 0) {
    // Left side-face
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy + hh);
    ctx.lineTo(cx, cy + 2 * hh);
    ctx.lineTo(cx, cy + 2 * hh + depth);
    ctx.lineTo(cx - hw, cy + hh + depth);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();

    // Right side-face
    ctx.beginPath();
    ctx.moveTo(cx + hw, cy + hh);
    ctx.lineTo(cx, cy + 2 * hh);
    ctx.lineTo(cx, cy + 2 * hh + depth);
    ctx.lineTo(cx + hw, cy + hh + depth);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();
  }
}

// ── TileMap class ────────────────────────────────────────────────────

export class TileMap {
  /** Off-screen canvas used as a render cache (the tile map never changes). */
  private cache: HTMLCanvasElement | null = null;

  /** Width of the full isometric map in CSS pixels */
  readonly pixelWidth = ISO_MAP_W;
  /** Height of the full isometric map in CSS pixels */
  readonly pixelHeight = ISO_MAP_H;

  /** Read a tile type at the given coordinate */
  getTile(col: number, row: number): TileType {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return TileType.WALL;
    return MAP_DATA[row][col];
  }

  /** Check if a tile is walkable. FLOOR + CORRIDOR = walkable. */
  isWalkable(col: number, row: number): boolean {
    const tile = this.getTile(col, row);
    return tile === TileType.FLOOR || tile === TileType.CORRIDOR;
  }

  /**
   * Render the entire tilemap with Painter's Algorithm (back-to-front).
   * Each tile draws its own floor base + 3D furniture object on top.
   */
  render(ctx: CanvasRenderingContext2D): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = MAP_DATA[row][col];
        const { x: cx, y: cy } = tileToScreen(col, row);

        switch (tile) {
          case TileType.FLOOR:         this.drawFloor(ctx, cx, cy); break;
          case TileType.WALL:          this.drawWall(ctx, cx, cy); break;
          case TileType.DESK:          this.drawDesk(ctx, cx, cy); break;
          case TileType.MEETING_TABLE: this.drawMeetingTable(ctx, cx, cy); break;
          case TileType.CORRIDOR:      this.drawCorridor(ctx, cx, cy); break;
          case TileType.PLANT:         this.drawPlant(ctx, cx, cy); break;
          case TileType.BOOKSHELF:     this.drawBookshelf(ctx, cx, cy); break;
          case TileType.SOFA:          this.drawSofa(ctx, cx, cy); break;
          case TileType.KITCHEN:       this.drawKitchen(ctx, cx, cy); break;
        }

        // Subtle grid line on top face
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + HW, cy + HH);
        ctx.lineTo(cx, cy + ISO_TILE_H);
        ctx.lineTo(cx - HW, cy + HH);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // ── Tile renderers ─────────────────────────────────────────────────

  /** Warm oak floor with subtle wood-plank lines */
  private drawFloor(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const c = COL.floor;
    isoBox(ctx, cx, cy, HW, HH, FACE_DEPTH, c.t, c.l, c.r);

    // Wood plank hints
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + HH - 3);
    ctx.lineTo(cx + 10, cy + HH + 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + HH + 1);
    ctx.lineTo(cx + 14, cy + HH - 1);
    ctx.stroke();
  }

  /** Concrete wall with baseboard trim */
  private drawWall(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const c = COL.wall;
    isoBox(ctx, cx, cy, HW, HH, FACE_DEPTH, c.t, c.l, c.r);

    // Cross-hatch texture on top face
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 6, cy + HH - 3);
      ctx.lineTo(cx + i * 6 + 3, cy + HH + 3);
      ctx.stroke();
    }

    // Baseboard (dark strip at bottom of side faces)
    ctx.fillStyle = '#1a1a1a';
    // Left baseboard
    ctx.beginPath();
    ctx.moveTo(cx - HW, cy + HH + FACE_DEPTH - 2);
    ctx.lineTo(cx, cy + ISO_TILE_H + FACE_DEPTH - 2);
    ctx.lineTo(cx, cy + ISO_TILE_H + FACE_DEPTH);
    ctx.lineTo(cx - HW, cy + HH + FACE_DEPTH);
    ctx.closePath();
    ctx.fill();
    // Right baseboard
    ctx.beginPath();
    ctx.moveTo(cx + HW, cy + HH + FACE_DEPTH - 2);
    ctx.lineTo(cx, cy + ISO_TILE_H + FACE_DEPTH - 2);
    ctx.lineTo(cx, cy + ISO_TILE_H + FACE_DEPTH);
    ctx.lineTo(cx + HW, cy + HH + FACE_DEPTH);
    ctx.closePath();
    ctx.fill();
  }

  /** 3D desk with monitor, screen glow, and monitor stand */
  private drawDesk(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    // Floor base
    this.drawFloor(ctx, cx, cy);

    // Drop shadow under desk
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + 16, cy + 12);
    ctx.lineTo(cx, cy + 20);
    ctx.lineTo(cx - 16, cy + 12);
    ctx.closePath();
    ctx.fill();

    // Desk surface (thin elevated box)
    const dc = COL.desk;
    const elev = 5;
    isoBox(ctx, cx, cy - elev, 16, 8, 3, dc.t, dc.l, dc.r);

    // Inner bevel highlight on desk surface
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - elev + 3);
    ctx.lineTo(cx + 10, cy - elev + 8);
    ctx.lineTo(cx, cy - elev + 13);
    ctx.lineTo(cx - 10, cy - elev + 8);
    ctx.closePath();
    ctx.fill();

    // Monitor screen (dark rectangle)
    const my = cy - elev - 4;
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - 5, my + 4, 10, 6);
    // Screen glow
    ctx.fillStyle = 'rgba(80,200,255,0.25)';
    ctx.fillRect(cx - 4, my + 5, 8, 4);
    // Monitor stand
    ctx.fillStyle = '#444';
    ctx.fillRect(cx - 1, my + 10, 2, 2);

    // Keyboard hint (tiny lighter rectangle on desk)
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(cx - 4, cy - elev + 10, 8, 3);
  }

  /** Conference table with wood grain detail */
  private drawMeetingTable(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    this.drawFloor(ctx, cx, cy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx + 20, cy + 13);
    ctx.lineTo(cx, cy + 23);
    ctx.lineTo(cx - 20, cy + 13);
    ctx.closePath();
    ctx.fill();

    // Table (large elevated box)
    const mc = COL.meeting;
    isoBox(ctx, cx, cy - 4, 20, 10, 4, mc.t, mc.l, mc.r);

    // Wood grain on top face
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 4 + 10);
    ctx.lineTo(cx + 12, cy - 4 + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 4 + 7);
    ctx.lineTo(cx + 8, cy - 4 + 13);
    ctx.stroke();
  }

  /** Corridor carpet with centre stripe */
  private drawCorridor(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const c = COL.corridor;
    isoBox(ctx, cx, cy, HW, HH, FACE_DEPTH, c.t, c.l, c.r);

    // Centre diamond stripe
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + HH - 4);
    ctx.lineTo(cx + 3, cy + HH);
    ctx.lineTo(cx, cy + HH + 4);
    ctx.lineTo(cx - 3, cy + HH);
    ctx.closePath();
    ctx.fill();
  }

  /** Potted plant with terracotta pot and lush foliage */
  private drawPlant(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    this.drawFloor(ctx, cx, cy);

    // Pot shadow
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.arc(cx, cy + HH + 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta pot (small box)
    const pc = COL.pot;
    isoBox(ctx, cx, cy + 2, 6, 3, 5, pc.t, pc.l, pc.r);

    // Foliage — overlapping green circles for volume
    ctx.fillStyle = '#3a7a2a';
    ctx.beginPath();
    ctx.arc(cx - 3, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a8a3a';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5a9a4a';
    ctx.beginPath();
    ctx.arc(cx + 3, cy - 1, 5, 0, Math.PI * 2);
    ctx.fill();

    // Leaf highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(cx + 1, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Tall bookshelf with coloured book spines */
  private drawBookshelf(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    this.drawFloor(ctx, cx, cy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx + 14, cy + 10);
    ctx.lineTo(cx, cy + 17);
    ctx.lineTo(cx - 14, cy + 10);
    ctx.closePath();
    ctx.fill();

    // Bookshelf body (tall box)
    const sc = COL.shelf;
    isoBox(ctx, cx, cy - 10, 14, 7, 16, sc.t, sc.l, sc.r);

    // Book spines on top face (coloured dots viewed from above)
    const bookColors = ['#c04040', '#4060a0', '#40a060', '#c0a040', '#8060a0'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = bookColors[i];
      ctx.fillRect(cx - 8 + i * 4, cy - 10 + 5, 3, 4);
    }

    // Shelf divider lines (horizontal stripes on left face)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 3; i++) {
      const fy = cy - 10 + 7 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - 14, fy);
      ctx.lineTo(cx, fy + 7);
      ctx.stroke();
    }
  }

  /** Comfy sofa with cushion highlight and backrest */
  private drawSofa(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    this.drawFloor(ctx, cx, cy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + 18, cy + 13);
    ctx.lineTo(cx, cy + 22);
    ctx.lineTo(cx - 18, cy + 13);
    ctx.closePath();
    ctx.fill();

    // Sofa seat (wide, low box)
    const oc = COL.sofa;
    isoBox(ctx, cx, cy - 2, 18, 9, 5, oc.t, oc.l, oc.r);

    // Cushion highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 1);
    ctx.lineTo(cx + 12, cy + 7);
    ctx.lineTo(cx, cy + 13);
    ctx.lineTo(cx - 12, cy + 7);
    ctx.closePath();
    ctx.fill();

    // Backrest (thin strip along back edge)
    const bc = COL.sofaBack;
    isoBox(ctx, cx - 6, cy - 6, 10, 5, 3, bc.t, bc.l, bc.r);
  }

  /** Kitchen counter with coffee machine and cup */
  private drawKitchen(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    this.drawFloor(ctx, cx, cy);

    // Counter (medium elevated box)
    const kc = COL.kitchen;
    isoBox(ctx, cx, cy - 4, 16, 8, 6, kc.t, kc.l, kc.r);

    // Coffee machine (tiny dark box on counter)
    const mc = COL.machine;
    isoBox(ctx, cx - 4, cy - 9, 4, 2, 4, mc.t, mc.l, mc.r);

    // Cup (small circle on counter surface)
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 4 + 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Steam wisps above coffee machine
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 13);
    ctx.lineTo(cx - 3, cy - 16);
    ctx.lineTo(cx - 4, cy - 19);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 13);
    ctx.lineTo(cx - 1, cy - 15);
    ctx.lineTo(cx - 2, cy - 18);
    ctx.stroke();
  }

  // ── Cache system ───────────────────────────────────────────────────

  /** Render the entire tilemap to an offscreen cache canvas. */
  renderOnce(_ctx?: CanvasRenderingContext2D): void {
    const dpr = window.devicePixelRatio || 1;
    const offscreen = document.createElement('canvas');
    offscreen.width = ISO_MAP_W * dpr;
    offscreen.height = ISO_MAP_H * dpr;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.imageSmoothingEnabled = false;
    offCtx.scale(dpr, dpr);

    this.render(offCtx);
    this.cache = offscreen;
  }

  /**
   * Draw the cached tilemap onto the target context, applying camera offset.
   * Only the visible viewport region is blitted from the full-map cache.
   */
  drawCached(
    ctx: CanvasRenderingContext2D,
    cameraX = 0,
    cameraY = 0,
    vpWidth?: number,
    vpHeight?: number,
  ): void {
    if (!this.cache) return;
    const dpr = window.devicePixelRatio || 1;
    const w = vpWidth ?? this.pixelWidth;
    const h = vpHeight ?? this.pixelHeight;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Background fill
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(0, 0, w * dpr, h * dpr);

    // Source rect in the cache (DPR-scaled), clamped to cache bounds
    const sx = Math.max(0, cameraX * dpr);
    const sy = Math.max(0, cameraY * dpr);
    const sw = Math.min(w * dpr, this.cache.width - sx);
    const sh = Math.min(h * dpr, this.cache.height - sy);

    if (sw > 0 && sh > 0) {
      const dx = Math.max(0, -cameraX * dpr);
      const dy = Math.max(0, -cameraY * dpr);
      ctx.drawImage(this.cache, sx, sy, sw, sh, dx, dy, sw, sh);
    }

    ctx.restore();
  }

  /** Release the offscreen cache. */
  destroy(): void {
    this.cache = null;
  }
}

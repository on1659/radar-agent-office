import { PIXEL_DATA } from '../shared/pixel-data';
import type { PixelChar, SpriteDirection } from '../shared/pixel-data';
import { tileToScreen } from './utils';

/** Simple deterministic hash: string → non-negative integer */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** HSL (h: 0–360, s: 0–100, l: 0–100) → '#rrggbb' */
function hslToHex(h: number, s: number, l: number): string {
  const sv = s / 100;
  const lv = l / 100;
  const a = sv * Math.min(lv, 1 - lv);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = lv - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generate a deterministic PixelChar for any agentId not found in PIXEL_DATA.
 * Uses a hash of the agentId to derive a unique hue, then maps it to
 * the standard 9-slot palette shared by all PIXEL_DATA characters.
 * Returns a grid-only PixelChar (no sprites); prerenderSprites() will
 * fall back to the baseImage path (single static frame), which is fine
 * for agents without dedicated pixel art.
 */
function getDefaultPixelData(agentId: string): PixelChar {
  const hue = hashString(agentId) % 360;

  const palette: Record<number, string> = {
    1: '#2d2d38',
    2: '#f0c8a0',
    3: hslToHex(hue, 70, 50),
    4: hslToHex(hue, 70, 35),
    5: hslToHex(hue, 30, 25),
    6: hslToHex(hue, 80, 65),
    7: '#ffffff',
    8: hslToHex(hue, 60, 75),
    9: '#1a1a2e',
  };

  // Generic chibi silhouette — identical structure to PIXEL_DATA entries
  const grid: number[][] = [
    [0,0,0,0,0,5,5,5,5,5,0,0,0,0,0,0],
    [0,0,0,0,5,5,5,5,5,5,5,0,0,0,0,0],
    [0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
    [0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],
    [0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],
    [0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],
    [0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],
    [0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],
    [0,0,0,1,3,3,7,7,3,3,3,1,0,0,0,0],
    [0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],
    [0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],
  ];

  return { palette, grid };
}

/** Visual state of a character (simplified for the Canvas renderer) */
export type CharacterVisualState = 'idle' | 'selected' | 'meeting' | 'streaming' | 'done' | 'error' | 'cancelled';

/** Character scale: 16px source rendered at 1.5x = 24px (exactly 1 tile) */
const CHAR_SCALE = 1.5;
const CHAR_RENDER_SIZE = 16 * CHAR_SCALE; // 24px

export class Character {
  readonly agentId: string;
  /** Current tile position (the tile we are standing on or moving FROM) */
  tileX: number;
  tileY: number;
  /** Target tile for the current interpolation step */
  targetTileX: number;
  targetTileY: number;
  /** Home desk position */
  readonly homeTileX: number;
  readonly homeTileY: number;
  /** Visual state */
  state: CharacterVisualState = 'idle';
  /** Pixel data from pixel-data.ts */
  private pixelChar: PixelChar | null;

  // --- Sprite rendering cache ---
  /** Cache of pre-rendered sprite images: direction -> frame -> canvas */
  private spriteCache: Map<string, HTMLCanvasElement> = new Map();
  /** Fallback base image (for characters without sprite data) */
  private baseImage: HTMLCanvasElement | null = null;

  // --- Movement / interpolation ---
  /** Progress of current tile-to-tile move (0 = at source, 1 = at target) */
  moveProgress = 0;
  /** Speed in tiles per second (varies per agent for natural feel) */
  moveSpeed: number;
  /** Current facing direction */
  direction: SpriteDirection = 'down';
  /** Walk animation frame: 0 = idle pose, 1 = walk pose */
  walkFrame = 0;
  /** Queued path nodes to follow (result from A*). Each entry is the NEXT tile to move to. */
  path: Array<{ x: number; y: number }> = [];
  /** Whether we are currently interpolating between tiles */
  private moving = false;

  /** Internal blink timer for streaming/error effects */
  private blinkTimer = 0;
  /** Idle animation: breathing offset (subtle vertical bob) */
  private breathOffset = 0;
  /** Idle animation: random look timer */
  private idleLookTimer = 0;
  /** Idle animation: random direction to look at */
  private idleLookDir: SpriteDirection = 'down';

  constructor(agentId: string, tileX: number, tileY: number) {
    this.agentId = agentId;
    this.tileX = tileX;
    this.tileY = tileY;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    // Face up toward the desk by default (agents sit on FLOOR below desks)
    this.direction = 'up';
    this.homeTileX = tileX;
    this.homeTileY = tileY;
    // Each agent walks at a slightly different speed (2.5~3.5 tiles/sec) for natural feel
    this.moveSpeed = 2.5 + Math.random() * 1.0;
    this.pixelChar = PIXEL_DATA[agentId] ?? getDefaultPixelData(agentId);
    this.prerenderSprites();
  }

  /**
   * Pre-render all directional sprite frames to offscreen canvases.
   * Falls back to a single base image if sprite data is not available.
   */
  private prerenderSprites(): void {
    if (!this.pixelChar) return;

    const { palette, sprites, grid } = this.pixelChar;

    if (sprites) {
      // Pre-render each direction x frame
      const directions: SpriteDirection[] = ['down', 'left', 'right', 'up'];
      for (const dir of directions) {
        const frames = sprites[dir];
        for (let f = 0; f < frames.length; f++) {
          const canvas = this.renderGridToCanvas(frames[f], palette);
          this.spriteCache.set(`${dir}_${f}`, canvas);
        }
      }
    } else {
      // Fallback: render the single grid as base image
      this.baseImage = this.renderGridToCanvas(grid, palette);
    }
  }

  /** Render a 16x16 pixel grid to an offscreen canvas at CHAR_SCALE */
  private renderGridToCanvas(grid: number[][], palette: Record<number, string>): HTMLCanvasElement {
    const size = CHAR_RENDER_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const ps = CHAR_SCALE;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const colorIndex = grid[y][x];
        if (colorIndex === 0) continue;
        const color = palette[colorIndex];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * ps, y * ps, ps + 0.5, ps + 0.5);
      }
    }

    return canvas;
  }

  /** Get the correct sprite canvas for the current direction and walkFrame */
  private getCurrentSprite(): HTMLCanvasElement | null {
    const key = `${this.direction}_${this.walkFrame}`;
    return this.spriteCache.get(key) ?? this.baseImage;
  }

  /**
   * Start following a path (array of tile coordinates from A*).
   * The path should NOT include the current position (start is excluded).
   */
  startMove(newPath: Array<{ x: number; y: number }>): void {
    if (newPath.length === 0) return;

    this.path = [...newPath];
    this.beginNextStep();
  }

  /** Begin interpolation to the next tile in the path queue */
  private beginNextStep(): void {
    if (this.path.length === 0) {
      this.moving = false;
      this.walkFrame = 0; // back to idle pose
      return;
    }

    const next = this.path.shift()!;
    this.targetTileX = next.x;
    this.targetTileY = next.y;
    this.moveProgress = 0;
    this.moving = true;

    // Determine facing direction based on movement delta
    const dx = this.targetTileX - this.tileX;
    const dy = this.targetTileY - this.tileY;
    if (dx > 0) this.direction = 'right';
    else if (dx < 0) this.direction = 'left';
    else if (dy > 0) this.direction = 'down';
    else if (dy < 0) this.direction = 'up';

    // Toggle walk frame each step for animation
    this.walkFrame = this.walkFrame === 0 ? 1 : 0;
  }

  /** Whether the character is currently moving along a path */
  isMoving(): boolean {
    return this.moving;
  }

  /** Cancel any in-progress movement, snapping to current interpolated position */
  cancelMove(): void {
    if (this.moving) {
      // If more than halfway, snap to target; otherwise snap back
      if (this.moveProgress >= 0.5) {
        this.tileX = this.targetTileX;
        this.tileY = this.targetTileY;
      }
      // else stay at current tileX/tileY
    }
    this.path = [];
    this.moving = false;
    this.moveProgress = 0;
    this.walkFrame = 0;
  }

  /** Update per-frame timers and interpolation */
  update(deltaTime: number): void {
    this.blinkTimer += deltaTime;
    if (this.blinkTimer > 2000) {
      this.blinkTimer -= 2000;
    }

    // Streaming animation: talking bob (excited, fast)
    if (!this.moving && this.state === 'streaming') {
      this.breathOffset = Math.sin(this.blinkTimer * 0.012) * 1.2;
      // Rapidly glance left/right while "talking"
      this.idleLookTimer += deltaTime;
      if (this.idleLookTimer > 400 + Math.random() * 600) {
        this.idleLookTimer = 0;
        const dirs: SpriteDirection[] = ['left', 'right', 'down', 'left', 'right'];
        this.direction = dirs[Math.floor(Math.random() * dirs.length)];
      }
    }
    // Selected animation: waiting in meeting room — look around at teammates
    else if (!this.moving && this.state === 'selected') {
      this.breathOffset = Math.sin(this.blinkTimer * 0.003) * 0.6;
      this.idleLookTimer += deltaTime;
      if (this.idleLookTimer > 1500 + Math.random() * 2000) {
        this.idleLookTimer = 0;
        const dirs: SpriteDirection[] = ['left', 'right', 'down', 'up', 'left', 'right'];
        this.direction = dirs[Math.floor(Math.random() * dirs.length)];
      }
    }
    // Idle/done animation: breathing bob + occasional look-around at desk
    else if (!this.moving && (this.state === 'idle' || this.state === 'done')) {
      this.breathOffset = Math.sin(this.blinkTimer * 0.002) * 0.5;
      this.idleLookTimer += deltaTime;
      if (this.idleLookTimer > 3000 + Math.random() * 5000) {
        this.idleLookTimer = 0;
        // At desk, mostly face up (toward monitor) with occasional glances
        const dirs: SpriteDirection[] = ['up', 'up', 'left', 'right', 'down'];
        this.direction = dirs[Math.floor(Math.random() * dirs.length)];
      }
    }
    // Error: subtle shake
    else if (!this.moving && this.state === 'error') {
      this.breathOffset = Math.sin(this.blinkTimer * 0.02) * 1.5;
    } else {
      this.breathOffset = 0;
    }

    // Advance interpolation
    if (this.moving) {
      // deltaTime is in ms, moveSpeed is tiles/sec
      const progressPerMs = this.moveSpeed / 1000;
      this.moveProgress += progressPerMs * deltaTime;

      if (this.moveProgress >= 1) {
        // Arrived at target tile
        this.tileX = this.targetTileX;
        this.tileY = this.targetTileY;
        this.moveProgress = 0;

        // Start next step in path
        this.beginNextStep();
      }
    }
  }

  /**
   * Get the current pixel position, accounting for interpolation.
   * This is the position used for rendering and overlay synchronization.
   */
  getCurrentPixelPos(): { x: number; y: number } {
    if (!this.moving || this.moveProgress === 0) {
      return tileToScreen(this.tileX, this.tileY);
    }

    // Smooth easing (ease-in-out) for more natural movement
    const t = this.moveProgress;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // Interpolate in tile-coordinate space, then convert to isometric screen coords
    const col = this.tileX + (this.targetTileX - this.tileX) * eased;
    const row = this.tileY + (this.targetTileY - this.tileY) * eased;
    return tileToScreen(col, row);
  }

  /** Teleport to a tile (instant move, no animation) */
  moveTo(tileX: number, tileY: number): void {
    this.cancelMove();
    this.tileX = tileX;
    this.tileY = tileY;
    this.targetTileX = tileX;
    this.targetTileY = tileY;
  }

  /** Return to home desk position (instant teleport) */
  moveHome(): void {
    this.moveTo(this.homeTileX, this.homeTileY);
  }

  /** Draw the character on the given Canvas context */
  draw(ctx: CanvasRenderingContext2D): void {
    const sprite = this.getCurrentSprite();
    if (!sprite) return;

    const { x, y } = this.getCurrentPixelPos();

    ctx.save();

    // State-specific visual effects
    switch (this.state) {
      case 'idle':
        ctx.globalAlpha = 0.5;
        break;

      case 'selected':
        ctx.globalAlpha = 0.8;
        break;

      case 'streaming': {
        const blink = 0.85 + 0.15 * Math.sin(this.blinkTimer * 0.006);
        ctx.globalAlpha = blink;
        break;
      }

      case 'meeting':
        ctx.globalAlpha = 0.95;
        break;

      case 'done':
        ctx.globalAlpha = 1.0;
        break;

      case 'error':
        ctx.globalAlpha = 0.9;
        break;

      case 'cancelled':
        ctx.globalAlpha = 0.3;
        break;

      default:
        ctx.globalAlpha = 1.0;
    }

    // Centre sprite horizontally on tile; position vertically at diamond centre
    // tileToScreen returns the top vertex of the diamond, so offset accordingly
    const drawX = x - CHAR_RENDER_SIZE / 2;
    const drawY = y + this.breathOffset;

    // Draw the sprite
    ctx.drawImage(sprite, drawX, drawY, CHAR_RENDER_SIZE, CHAR_RENDER_SIZE);

    // Post-draw overlays (drawn at full alpha on top)
    ctx.globalAlpha = 1.0;

    // State border effects
    if (this.state === 'done') {
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(drawX - 1, drawY - 1, CHAR_RENDER_SIZE + 2, CHAR_RENDER_SIZE + 2);
    } else if (this.state === 'error') {
      const pulse = 0.5 + 0.5 * Math.sin(this.blinkTimer * 0.008);
      ctx.strokeStyle = `rgba(231, 76, 60, ${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(drawX - 1, drawY - 1, CHAR_RENDER_SIZE + 2, CHAR_RENDER_SIZE + 2);
    } else if (this.state === 'streaming') {
      const glow = 0.3 + 0.2 * Math.sin(this.blinkTimer * 0.005);
      ctx.strokeStyle = `rgba(41, 128, 185, ${glow})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - 1, drawY - 1, CHAR_RENDER_SIZE + 2, CHAR_RENDER_SIZE + 2);
    }

    ctx.restore();
  }

  /** Clean up resources */
  destroy(): void {
    this.baseImage = null;
    this.pixelChar = null;
    this.spriteCache.clear();
    this.path = [];
  }
}

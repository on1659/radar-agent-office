import { TileMap } from './TileMap';
import { Character } from './Character';
import type { CharacterVisualState } from './Character';
import { Camera } from './Camera';
import { findPath, tileKey } from './Pathfinder';
import { setupCanvas, MAP_COLS, MAP_ROWS } from './utils';
import { ISO_MAP_W, ISO_MAP_H } from './isoTransform';
import type { AgentStatus } from '@radar/shared';

/**
 * Default seat positions for agents.
 * Dynamically assigned based on agent count.
 * Layout: 8 desks (row 3 cols 1-2,5-6 + row 8 cols 1-2,5-6)
 */
const SEAT_POSITIONS: Array<{ tileX: number; tileY: number }> = [
  { tileX: 1, tileY: 3 }, { tileX: 2, tileY: 3 },
  { tileX: 5, tileY: 3 }, { tileX: 6, tileY: 3 },
  { tileX: 1, tileY: 8 }, { tileX: 2, tileY: 8 },
  { tileX: 5, tileY: 8 }, { tileX: 6, tileY: 8 },
  // Overflow seats
  { tileX: 9, tileY: 3 }, { tileX: 10, tileY: 3 },
  { tileX: 9, tileY: 8 }, { tileX: 10, tileY: 8 },
];

/** Map AgentStatus to CharacterVisualState */
function toVisualState(status: AgentStatus): CharacterVisualState {
  switch (status) {
    case 'idle':    return 'idle';
    case 'working': return 'streaming';
    case 'queued':  return 'selected';
    case 'error':   return 'error';
    default:        return 'idle';
  }
}

export interface GameEngineConfig {
  agentIds?: string[];
}

interface PendingTarget {
  tileX: number;
  tileY: number;
}

export class GameEngine {
  private tileMap: TileMap;
  private characters: Map<string, Character> = new Map();
  private tileMapCtx: CanvasRenderingContext2D | null = null;
  private characterCtx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private running = false;
  private destroyed = false;

  camera: Camera;

  private pendingTargets: Map<string, PendingTarget> = new Map();
  private idleWanderTimers: Map<string, number> = new Map();

  onPositionUpdate: (() => void) | null = null;

  private vpWidth: number;
  private vpHeight: number;

  constructor(
    private tileMapCanvas: HTMLCanvasElement,
    private characterCanvas: HTMLCanvasElement,
    config?: GameEngineConfig,
  ) {
    this.tileMap = new TileMap();

    const worldW = ISO_MAP_W;
    const worldH = ISO_MAP_H;

    this.vpWidth = worldW;
    this.vpHeight = worldH;

    this.tileMapCtx = setupCanvas(tileMapCanvas, this.vpWidth, this.vpHeight);
    this.characterCtx = setupCanvas(characterCanvas, this.vpWidth, this.vpHeight);

    this.tileMap.renderOnce();

    this.camera = new Camera(this.vpWidth, this.vpHeight, worldW, worldH);

    if (this.tileMapCtx) {
      this.tileMap.drawCached(this.tileMapCtx, this.camera.x, this.camera.y, this.vpWidth, this.vpHeight);
    }

    // Create characters — assign seats dynamically
    const ids = config?.agentIds ?? [];
    for (let i = 0; i < ids.length; i++) {
      const seat = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
      this.characters.set(ids[i], new Character(ids[i], seat.tileX, seat.tileY));
    }

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /** Add or update a character dynamically */
  ensureCharacter(agentId: string): void {
    if (this.characters.has(agentId)) return;
    const idx = this.characters.size;
    const seat = SEAT_POSITIONS[idx % SEAT_POSITIONS.length];
    this.characters.set(agentId, new Character(agentId, seat.tileX, seat.tileY));
  }

  setViewportSize(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.vpWidth = w;
    this.vpHeight = h;

    if (this.tileMapCanvas) {
      this.tileMapCtx = setupCanvas(this.tileMapCanvas, w, h);
    }
    if (this.characterCanvas) {
      this.characterCtx = setupCanvas(this.characterCanvas, w, h);
    }

    this.camera.setViewportSize(w, h);

    if (this.tileMapCtx) {
      this.tileMap.drawCached(this.tileMapCtx, this.camera.x, this.camera.y, w, h);
    }
  }

  getCamera(): Camera { return this.camera; }

  start(): void {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.scheduleFrame();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private scheduleFrame(): void {
    this.rafId = requestAnimationFrame((timestamp) => {
      if (!this.running || this.destroyed) return;

      const deltaTime = Math.min(timestamp - this.lastTimestamp, 100);
      this.lastTimestamp = timestamp;

      this.tick(deltaTime);
      this.render();

      if (this.onPositionUpdate) this.onPositionUpdate();

      this.scheduleFrame();
    });
  }

  tick(deltaTime: number): void {
    for (const char of this.characters.values()) {
      char.update(deltaTime);

      if (!char.isMoving()) {
        const pending = this.pendingTargets.get(char.agentId);
        if (pending) {
          this.pendingTargets.delete(char.agentId);
          this.navigateTo(char.agentId, pending.tileX, pending.tileY);
          continue;
        }

        // Idle wander
        if (char.state === 'idle') {
          let timer = this.idleWanderTimers.get(char.agentId) ?? (3000 + Math.random() * 8000);
          timer -= deltaTime;

          if (timer <= 0) {
            const candidates: Array<{ x: number; y: number }> = [];
            for (let dx = -2; dx <= 2; dx++) {
              for (let dy = -2; dy <= 2; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = char.homeTileX + dx;
                const ny = char.homeTileY + dy;
                if (this.tileMap.isWalkable(nx, ny)) {
                  candidates.push({ x: nx, y: ny });
                }
              }
            }

            if (candidates.length > 0) {
              const atHome = char.tileX === char.homeTileX && char.tileY === char.homeTileY;
              if (atHome || Math.random() < 0.5) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                this.navigateTo(char.agentId, target.x, target.y);
              } else {
                this.navigateTo(char.agentId, char.homeTileX, char.homeTileY);
              }
            }

            timer = 4000 + Math.random() * 6000;
          }

          this.idleWanderTimers.set(char.agentId, timer);
        }
      }
    }
  }

  render(): void {
    const camX = this.camera.x;
    const camY = this.camera.y;
    const vpW = this.vpWidth;
    const vpH = this.vpHeight;

    if (this.tileMapCtx) {
      this.tileMap.drawCached(this.tileMapCtx, camX, camY, vpW, vpH);
    }

    const ctx = this.characterCtx;
    if (!ctx) return;

    ctx.clearRect(0, 0, vpW, vpH);
    ctx.save();
    ctx.translate(-camX, -camY);

    for (const char of this.characters.values()) {
      char.draw(ctx);
    }

    ctx.restore();
  }

  private navigateTo(agentId: string, targetX: number, targetY: number): void {
    const char = this.characters.get(agentId);
    if (!char) return;

    if (char.isMoving()) {
      this.pendingTargets.set(agentId, { tileX: targetX, tileY: targetY });
      return;
    }

    if (char.tileX === targetX && char.tileY === targetY) return;

    const overrides = new Set<number>();
    overrides.add(tileKey(char.homeTileX, char.homeTileY));
    overrides.add(tileKey(targetX, targetY));

    const path = findPath(char.tileX, char.tileY, targetX, targetY, this.tileMap, overrides);

    if (path && path.length > 0) {
      char.startMove(path);
    } else {
      char.moveTo(targetX, targetY);
    }
  }

  /** Update agent status from @radar/shared AgentStatus */
  updateAgentStatus(agentId: string, status: AgentStatus): void {
    this.ensureCharacter(agentId);
    const char = this.characters.get(agentId)!;
    char.state = toVisualState(status);
  }

  /** Bulk update all agents */
  updateAllAgentStatuses(statuses: Record<string, AgentStatus>): void {
    for (const [id, status] of Object.entries(statuses)) {
      this.updateAgentStatus(id, status);
    }
  }

  getCharacterPixelPos(agentId: string): { x: number; y: number } | null {
    const char = this.characters.get(agentId);
    if (!char) return null;
    return char.getCurrentPixelPos();
  }

  private handleVisibilityChange(): void {
    if (this.destroyed) return;
    if (document.hidden) this.stop();
    else this.start();
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.tileMap.destroy();
    for (const char of this.characters.values()) char.destroy();
    this.characters.clear();
    this.tileMapCtx = null;
    this.characterCtx = null;
    this.pendingTargets.clear();
    this.onPositionUpdate = null;
  }
}

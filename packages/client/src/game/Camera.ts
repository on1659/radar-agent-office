/**
 * Camera system for the tile-map office view.
 *
 * Features:
 * - Viewport / world coordinate transforms
 * - Mouse-drag panning (left button)
 * - Wheel scrolling (vertical; Shift+wheel = horizontal)
 * - Smooth follow (lerp) toward a target position
 * - Clamping so the camera never shows area beyond the map edges
 */

export class Camera {
  /** Camera top-left position in world pixels */
  x = 0;
  y = 0;

  /** Viewport dimensions in CSS pixels */
  viewportWidth: number;
  viewportHeight: number;

  /** Full world (map) dimensions in CSS pixels */
  worldWidth: number;
  worldHeight: number;

  // --- Drag state ---
  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

  /** Publicly readable drag flag (for cursor style in React) */
  get isDragging(): boolean {
    return this.dragging;
  }

  constructor(viewportW: number, viewportH: number, worldW: number, worldH: number) {
    this.viewportWidth = viewportW;
    this.viewportHeight = viewportH;
    this.worldWidth = worldW;
    this.worldHeight = worldH;

    // Start centred on the map
    this.centerOn(worldW / 2, worldH / 2);
  }

  // ------------------------------------------------------------------ //
  //  Positioning helpers                                                //
  // ------------------------------------------------------------------ //

  /** Centre the camera on a world-pixel coordinate */
  centerOn(worldX: number, worldY: number): void {
    this.x = worldX - this.viewportWidth / 2;
    this.y = worldY - this.viewportHeight / 2;
    this.clamp();
  }

  /** Ensure the camera stays within world bounds */
  clamp(): void {
    const maxX = this.worldWidth - this.viewportWidth;
    const maxY = this.worldHeight - this.viewportHeight;

    // If viewport is larger than world, centre the world inside the viewport
    if (maxX <= 0) {
      this.x = maxX / 2;
    } else {
      this.x = Math.max(0, Math.min(this.x, maxX));
    }

    if (maxY <= 0) {
      this.y = maxY / 2;
    } else {
      this.y = Math.max(0, Math.min(this.y, maxY));
    }
  }

  /** Update viewport size (e.g. after container resize) */
  setViewportSize(w: number, h: number): void {
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.clamp();
  }

  // ------------------------------------------------------------------ //
  //  Coordinate conversion                                             //
  // ------------------------------------------------------------------ //

  /** Convert a world-pixel coordinate to a screen (canvas) coordinate */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return { x: worldX - this.x, y: worldY - this.y };
  }

  /** Convert a screen (canvas) coordinate to a world-pixel coordinate */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return { x: screenX + this.x, y: screenY + this.y };
  }

  // ------------------------------------------------------------------ //
  //  Mouse / wheel event handlers                                      //
  // ------------------------------------------------------------------ //

  /** Start drag-pan (call on mousedown) */
  onMouseDown(e: MouseEvent): void {
    // Only left button
    if (e.button !== 0) return;
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.cameraStartX = this.x;
    this.cameraStartY = this.y;
  }

  /** Continue drag-pan (call on mousemove) */
  onMouseMove(e: MouseEvent): void {
    if (!this.dragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    this.x = this.cameraStartX - dx;
    this.y = this.cameraStartY - dy;
    this.clamp();
  }

  /** End drag-pan (call on mouseup / mouseleave) */
  onMouseUp(_e?: MouseEvent): void {
    this.dragging = false;
  }

  /**
   * Wheel scroll handler.
   * - Normal wheel:        vertical scroll
   * - Shift + wheel:       horizontal scroll
   */
  onWheel(e: WheelEvent): void {
    const SCROLL_SPEED = 40;
    if (e.shiftKey) {
      this.x += e.deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED;
    } else {
      this.y += e.deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED;
    }
    this.clamp();
  }

  // ------------------------------------------------------------------ //
  //  Smooth follow                                                     //
  // ------------------------------------------------------------------ //

  /**
   * Smoothly follow a target world position (lerp).
   * @param targetX  - World X to centre on
   * @param targetY  - World Y to centre on
   * @param deltaTime - Frame delta in ms
   * @param speed    - Lerp speed (0..1 per second, default 3)
   */
  smoothFollow(targetX: number, targetY: number, deltaTime: number, speed = 3): void {
    const desiredX = targetX - this.viewportWidth / 2;
    const desiredY = targetY - this.viewportHeight / 2;

    const t = 1 - Math.exp(-speed * deltaTime / 1000);

    this.x += (desiredX - this.x) * t;
    this.y += (desiredY - this.y) * t;
    this.clamp();
  }
}

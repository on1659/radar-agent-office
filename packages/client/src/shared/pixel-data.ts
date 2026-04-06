export interface PixelChar {
  palette: Record<number, string>;
  grid: number[][];
  /** 4-direction sprites, each with 2 frames [idle, walk]. Generated programmatically. */
  sprites?: {
    down: number[][][];
    left: number[][][];
    right: number[][][];
    up: number[][][];
  };
}

export type SpriteDirection = 'down' | 'left' | 'right' | 'up';

// ---- Programmatic sprite generation utilities ----

/** Mirror a 16x16 grid horizontally (left-right flip) */
function mirrorGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row].reverse());
}

/**
 * Create a walk frame from an idle frame by shifting the foot pixels.
 * Rows 14-15 are the feet area in our 16x16 sprites.
 * Walk frame shifts left foot down 1px and right foot up 1px to simulate stepping.
 */
function makeWalkFrame(idle: number[][]): number[][] {
  const walk = idle.map(row => [...row]);

  // Swap foot pixels between row 14 and 15 for left half (cols 3-7)
  // This creates a simple step animation
  for (let x = 3; x <= 7; x++) {
    const tmp = walk[14][x];
    walk[14][x] = walk[15][x];
    walk[15][x] = tmp;
  }

  return walk;
}

/**
 * Create an "up" (back-facing) sprite from the front-facing grid.
 * Replaces the face area (rows 4-7) with hair/back-of-head colour,
 * and removes eye details.
 */
function makeUpGrid(grid: number[][], palette: Record<number, string>): number[][] {
  const up = grid.map(row => [...row]);

  // Find the hair colour index (the dominant non-zero colour in rows 0-3)
  const hairColorCounts: Record<number, number> = {};
  for (let r = 0; r <= 3; r++) {
    for (let x = 0; x < 16; x++) {
      const v = grid[r][x];
      if (v !== 0 && v !== 1) { // not transparent, not outline
        hairColorCounts[v] = (hairColorCounts[v] || 0) + 1;
      }
    }
  }
  let hairColor = 5; // fallback
  let maxCount = 0;
  for (const [idx, count] of Object.entries(hairColorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      hairColor = Number(idx);
    }
  }

  // Replace face (skin=2, eyes=9) with hair colour in rows 4-7
  for (let r = 4; r <= 7; r++) {
    for (let x = 0; x < 16; x++) {
      const v = up[r][x];
      if (v === 2 || v === 9) { // skin or eye colour
        up[r][x] = hairColor;
      }
    }
  }

  // Also remove any mouth/nose detail in row 6-7 area (replace skin with hair)
  // Already covered above since we replace all skin(2) in rows 4-7

  return up;
}

/**
 * Generate 4-direction sprites from a single front-facing grid.
 * - down: original grid (front-facing)
 * - right: original grid (slightly right-facing already in pixel art)
 * - left: horizontally mirrored grid
 * - up: back-of-head variant
 * Each direction has 2 frames: [idle, walk]
 */
function generateSprites(grid: number[][], palette: Record<number, string>): PixelChar['sprites'] {
  const downIdle = grid;
  const downWalk = makeWalkFrame(downIdle);

  const leftIdle = mirrorGrid(grid);
  const leftWalk = makeWalkFrame(leftIdle);

  const rightIdle = grid; // original is slightly right-facing
  const rightWalk = makeWalkFrame(rightIdle);

  const upIdle = makeUpGrid(grid, palette);
  const upWalk = makeWalkFrame(upIdle);

  return {
    down: [downIdle, downWalk],
    left: [leftIdle, leftWalk],
    right: [rightIdle, rightWalk],
    up: [upIdle, upWalk],
  };
}

/** Initialize sprites for all characters (called once at module load) */
function initSprites(): void {
  for (const char of Object.values(PIXEL_DATA)) {
    if (!char.sprites) {
      char.sprites = generateSprites(char.grid, char.palette);
    }
  }
}

// We call initSprites after PIXEL_DATA is defined (see bottom of file)

/**
 * Claw3D-inspired chibi characters — big round heads, stubby bodies, warm tones.
 * Palette: 1=outline, 2=skin, 3=primary, 4=dark primary, 5=hair, 6=accent, 7=white, 8=highlight, 9=eyes
 */
export const PIXEL_DATA: Record<string, PixelChar> = {
  // 지민 (PD) — purple suit, gold badge, styled hair
  jimin: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#7c3aed', 4: '#5b21b6', 5: '#3d2060', 6: '#fbbf24', 7: '#fff', 8: '#ddd', 9: '#2d1b40' },
    grid: [[0,0,0,0,0,5,5,5,5,5,0,0,0,0,0,0],[0,0,0,0,5,5,5,5,5,5,5,0,0,0,0,0],[0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,2,1,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,7,7,7,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,6,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 현우 (기획①) — blue shirt, glasses, neat short hair
  hyunwoo: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#3b82f6', 4: '#1d4ed8', 5: '#4a3728', 6: '#60a5fa', 7: '#fff', 8: '#93c5fd', 9: '#1a1a2e' },
    grid: [[0,0,0,0,0,5,5,5,5,5,0,0,0,0,0,0],[0,0,0,0,5,5,5,5,5,5,5,0,0,0,0,0],[0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,1,2,8,9,8,2,8,9,8,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,7,7,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 소연 (기획②) — navy blazer, long brown hair with gold earring
  soyeon: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#1e40af', 4: '#172554', 5: '#7c4a2a', 6: '#b45309', 7: '#fff', 8: '#fbbf24', 9: '#1a1a2e' },
    grid: [[0,0,0,0,5,5,5,5,5,5,0,0,0,0,0,0],[0,0,0,5,5,6,6,6,6,5,5,0,0,0,0,0],[0,0,5,1,5,5,5,5,5,5,1,5,0,0,0,0],[0,0,5,1,2,2,2,2,2,2,1,5,0,0,0,0],[0,0,5,1,2,9,2,2,2,9,1,5,0,0,0,0],[0,0,5,1,2,9,2,2,2,9,1,8,0,0,0,0],[0,0,5,1,2,2,2,2,2,2,1,5,0,0,0,0],[0,0,5,0,1,2,2,2,2,1,0,5,0,0,0,0],[0,0,5,0,0,1,1,1,1,0,0,5,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,7,7,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 태준 (BE개발) — green hoodie, headset, messy dark hair
  taejun: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#10b981', 4: '#047857', 5: '#1f2937', 6: '#34d399', 7: '#fff', 8: '#6ee7b7', 9: '#1a1a2e' },
    grid: [[0,0,0,0,0,5,5,5,5,5,0,0,0,0,0,0],[0,0,0,0,5,5,5,5,5,5,5,0,0,0,0,0],[0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[6,1,1,2,2,9,2,2,2,9,2,2,1,1,6,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,8,8,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,5,5,0,5,5,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 미래 (FE개발) — cyan top, ponytail with bow, laptop sticker vibe
  mirae: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#06b6d4', 4: '#0891b2', 5: '#4b3832', 6: '#f472b6', 7: '#fff', 8: '#67e8f9', 9: '#1a1a2e' },
    grid: [[0,0,0,0,0,5,5,5,5,5,0,0,0,0,0,0],[0,0,0,0,5,5,5,5,5,5,5,5,6,0,0,0],[0,0,0,1,5,5,5,5,5,5,1,5,5,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,5,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,2,6,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,7,7,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 윤서 (QA) — yellow-green vest, cap, checklist vibe
  yunso: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#eab308', 4: '#ca8a04', 5: '#374151', 6: '#fbbf24', 7: '#fff', 8: '#fde047', 9: '#1a1a2e' },
    grid: [[0,0,0,0,6,6,6,6,6,6,6,0,0,0,0,0],[0,0,0,0,1,5,5,5,5,5,1,0,0,0,0,0],[0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,7,7,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 다은 (UI) — pink top, beret, long wavy hair
  daeun: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#ec4899', 4: '#be185d', 5: '#5c3420', 6: '#f472b6', 7: '#fff', 8: '#f9a8d4', 9: '#1a1a2e' },
    grid: [[0,0,0,3,3,3,3,3,3,3,0,0,0,0,0,0],[0,0,3,6,6,5,5,5,5,6,3,0,0,0,0,0],[0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0],[0,5,1,2,2,2,2,2,2,2,2,2,1,5,0,0],[0,5,1,2,2,9,2,2,2,9,2,2,1,5,0,0],[0,5,1,2,2,9,2,2,2,9,2,2,1,5,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,8,2,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,7,7,3,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
  // 승호 (UX) — orange jacket, beanie, friendly vibe
  seungho: {
    palette: { 1: '#2d2d38', 2: '#f0c8a0', 3: '#f97316', 4: '#c2410c', 5: '#3d2828', 6: '#fb923c', 7: '#fff', 8: '#fdba74', 9: '#1a1a2e' },
    grid: [[0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],[0,0,0,4,3,3,6,6,3,3,4,0,0,0,0,0],[0,0,0,1,5,5,5,5,5,5,5,1,0,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,9,2,2,2,9,2,2,1,0,0,0],[0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0],[0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0],[0,0,0,0,1,1,2,2,2,1,1,0,0,0,0,0],[0,0,0,0,1,3,3,3,3,3,1,0,0,0,0,0],[0,0,0,1,3,3,7,3,7,3,3,1,0,0,0,0],[0,0,0,1,3,3,3,3,3,3,3,1,0,0,0,0],[0,0,0,1,4,3,3,3,3,3,4,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,4,4,0,4,4,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0]],
  },
};

// Generate directional sprites for all characters
initSprites();

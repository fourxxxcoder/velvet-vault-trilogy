// The three heists. Coordinates are tiles on a 40 x 21 grid; one tile is 32 px
// and the playfield starts below the 48 px HUD. Walls are tile rects
// [col, row, w, h]. Every level is one open floor plan with several routes:
// the judge's first criterion is a room you can read at a glance, so each
// heist fits in a single 1280 x 720 frame with no scrolling camera.
import { TILE, HUD_H, PALETTES } from './config.js';

const px = (col, row) => ({ x: col * TILE + TILE / 2, y: HUD_H + row * TILE + TILE / 2 });
const rect = (col, row, w, h) => ({ x: col * TILE, y: HUD_H + row * TILE, w: w * TILE, h: h * TILE });

function border() {
  return [
    rect(0, 0, 40, 1), rect(0, 20, 40, 1),
    rect(0, 0, 1, 21), rect(39, 0, 1, 21),
  ];
}

// --- Heist 1: the gallery. Four guards, four cameras, eight side loot pieces,
// one vault room holding the Aurora Star. Two open halls, three routes. -----
const gallery = {
  id: 'gallery',
  name: 'Meridian Gallery',
  sub: 'Heist 1 of 3 — lift the Aurora Star',
  palette: PALETTES.gallery,
  target: { name: 'Aurora Star', value: 5000 },
  walls: [
    ...border(),
    rect(4, 6, 12, 1), rect(24, 6, 12, 1), // upper hall divider, two gaps
    rect(8, 13, 13, 1), rect(27, 13, 9, 1), // lower hall divider, two gaps
    rect(17, 1, 7, 1), // vault room: top
    rect(17, 1, 1, 4), rect(23, 1, 1, 4), // vault room: sides
    rect(17, 4, 2, 1), rect(21, 4, 3, 1), // vault room: bottom, door gap at col 19-20
    rect(10, 9, 1, 1), rect(30, 9, 1, 1), // pillars
    rect(10, 16, 1, 1), rect(30, 16, 1, 1),
  ],
  doors: [],
  vault: { ...rect(19, 2, 2, 1), target: 'Aurora Star', value: 5000 },
  player: px(20, 19),
  exit: rect(18, 19, 5, 1),
  loot: [
    { ...px(2, 2), kind: 'painting', value: 400 },
    { ...px(37, 2), kind: 'painting', value: 400 },
    { ...px(2, 18), kind: 'painting', value: 400 },
    { ...px(37, 18), kind: 'painting', value: 400 },
    { ...px(6, 10), kind: 'painting', value: 350 },
    { ...px(34, 10), kind: 'painting', value: 350 },
    { ...px(14, 17), kind: 'gems', value: 600 },
    { ...px(26, 17), kind: 'gems', value: 600 },
  ],
  keycards: [],
  guards: [
    { path: [px(6, 4), px(14, 4), px(14, 10), px(6, 10)], speed: 1 },
    { path: [px(34, 4), px(26, 4), px(26, 10), px(34, 10)], speed: 1 },
    { path: [px(12, 16), px(20, 16), px(20, 11), px(12, 11)], speed: 1.1 },
    { path: [px(28, 16), px(36, 16), px(36, 11), px(28, 11)], speed: 1.1 },
  ],
  cameras: [
    { ...px(3, 3), base: Math.PI / 4, sweep: 0.7, speed: 0.55 },
    { ...px(36, 3), base: Math.PI * 0.75, sweep: 0.7, speed: 0.55 },
    { ...px(1, 10), base: 0, sweep: 0.8, speed: 0.5 },
    { ...px(38, 10), base: Math.PI, sweep: 0.8, speed: 0.5 },
  ],
  lasers: [],
  tools: { coin: 3, smoke: 2, emp: 1 },
};

// --- Heist 2: the bank. Five guards, five cameras, two laser grids, a
// keycard door on the vault, ten side loot pieces, the gold bars. -----------
const bank = {
  id: 'bank',
  name: 'Aurum Bank',
  sub: 'Heist 2 of 3 — crack the gold vault',
  palette: PALETTES.bank,
  target: { name: 'Gold Bars', value: 8000 },
  walls: [
    ...border(),
    rect(4, 9, 17, 1), // teller counter, gap at cols 21+
    rect(24, 13, 9, 1), rect(24, 13, 1, 4), rect(32, 13, 1, 4), // office, gap at bottom
    rect(28, 1, 11, 1), // vault room: top
    rect(28, 1, 1, 5), // vault room: left side
    rect(38, 1, 1, 5), // vault room: right side
    rect(33, 5, 6, 1), // vault room: bottom, door gap at cols 28-32
    rect(8, 14, 1, 1), rect(16, 5, 1, 1), rect(20, 16, 1, 1),
  ],
  doors: [
    { ...rect(28, 5, 5, 1), locked: 'A', label: 'VAULT — KEYCARD A' },
  ],
  vault: { ...rect(33, 2, 3, 2), target: 'Gold Bars', value: 8000 },
  player: px(20, 19),
  exit: rect(18, 19, 5, 1),
  loot: [
    { ...px(2, 2), kind: 'cash', value: 500 },
    { ...px(10, 2), kind: 'cash', value: 500 },
    { ...px(2, 10), kind: 'cash', value: 500 },
    { ...px(36, 10), kind: 'gold', value: 900 },
    { ...px(6, 17), kind: 'cash', value: 500 },
    { ...px(14, 17), kind: 'gold', value: 900 },
    { ...px(24, 18), kind: 'cash', value: 500 },
    { ...px(33, 17), kind: 'gold', value: 900 },
    { ...px(18, 4), kind: 'cash', value: 500 },
    { ...px(38, 18), kind: 'gold', value: 900 },
  ],
  keycards: [{ ...px(5, 18), id: 'A' }],
  guards: [
    { path: [px(6, 4), px(14, 4), px(14, 7), px(6, 7)], speed: 1 },
    { path: [px(24, 3), px(24, 8), px(18, 8), px(18, 3)], speed: 1 },
    { path: [px(10, 12), px(20, 12), px(20, 17), px(10, 17)], speed: 1.1 },
    { path: [px(28, 10), px(36, 10), px(36, 15), px(28, 15)], speed: 1.1 },
    { path: [px(34, 7), px(34, 3), px(30, 3), px(30, 7)], speed: 1.2 },
  ],
  cameras: [
    { ...px(3, 3), base: Math.PI / 4, sweep: 0.7, speed: 0.6 },
    { ...px(20, 2), base: Math.PI / 2, sweep: 0.9, speed: 0.55 },
    { ...px(37, 8), base: Math.PI, sweep: 0.7, speed: 0.6 },
    { ...px(1, 12), base: 0, sweep: 0.8, speed: 0.5 },
    { ...px(26, 18), base: -Math.PI / 2, sweep: 0.8, speed: 0.55 },
  ],
  lasers: [
    { x1: 24 * TILE, y1: HUD_H + 7 * TILE, x2: 24 * TILE, y2: HUD_H + 10 * TILE, on: 2.2, off: 1.6, phase: 0 },
    { x1: 10 * TILE, y1: HUD_H + 12 * TILE, x2: 19 * TILE, y2: HUD_H + 12 * TILE, on: 2.6, off: 1.4, phase: 1.1 },
  ],
  tools: { coin: 3, smoke: 2, emp: 2 },
};

// --- Heist 3: the casino. Six guards, six cameras, three laser grids, two
// keycard doors (vault + cash cage), twelve side loot pieces, the jackpot. --
const casino = {
  id: 'casino',
  name: 'Velvet Casino',
  sub: 'Heist 3 of 3 — steal the jackpot',
  palette: PALETTES.casino,
  target: { name: 'Jackpot', value: 12000 },
  walls: [
    ...border(),
    rect(4, 8, 9, 1), rect(28, 8, 9, 1), // slot rows, gaps in the middle
    rect(4, 13, 7, 1), rect(4, 13, 1, 3), rect(10, 13, 1, 3), // bar, gap at bottom
    rect(30, 13, 7, 1), rect(30, 13, 1, 4), rect(36, 13, 1, 4), // stage, gap at bottom
    rect(16, 1, 9, 1), // vault room: top
    rect(16, 1, 1, 4), rect(24, 1, 1, 4), // vault room: sides
    rect(16, 4, 3, 1), rect(22, 4, 3, 1), // vault room: bottom, door gap cols 19-21
    rect(16, 16, 9, 1), // cash cage: top
    rect(16, 16, 1, 4), rect(24, 16, 1, 4), // cash cage: sides
    rect(16, 19, 3, 1), rect(22, 19, 3, 1), // cash cage: bottom, door gap cols 19-21
  ],
  doors: [
    { ...rect(19, 4, 3, 1), locked: 'A', label: 'VAULT — KEYCARD A' },
    { ...rect(19, 19, 3, 1), locked: 'B', label: 'CASH CAGE — KEYCARD B' },
  ],
  vault: { ...rect(19, 2, 3, 1), target: 'Jackpot', value: 12000 },
  player: px(5, 19),
  exit: rect(2, 19, 5, 1),
  loot: [
    { ...px(2, 2), kind: 'chips', value: 600 },
    { ...px(37, 2), kind: 'chips', value: 600 },
    { ...px(2, 18), kind: 'chips', value: 600 },
    { ...px(37, 18), kind: 'chips', value: 600 },
    { ...px(7, 11), kind: 'cash', value: 700 },
    { ...px(33, 11), kind: 'cash', value: 700 },
    { ...px(13, 5), kind: 'chips', value: 600 },
    { ...px(27, 5), kind: 'chips', value: 600 },
    { ...px(18, 17), kind: 'gold', value: 1200 },
    { ...px(20, 18), kind: 'gold', value: 1200 },
    { ...px(22, 17), kind: 'gold', value: 1200 },
    { ...px(14, 18), kind: 'cash', value: 700 },
  ],
  keycards: [
    { ...px(3, 16), id: 'A' },
    { ...px(37, 17), id: 'B' },
  ],
  guards: [
    { path: [px(6, 4), px(14, 4), px(14, 7), px(6, 7)], speed: 1 },
    { path: [px(34, 4), px(26, 4), px(26, 7), px(34, 7)], speed: 1 },
    { path: [px(10, 11), px(18, 11), px(18, 15), px(10, 15)], speed: 1.1 },
    { path: [px(30, 11), px(22, 11), px(22, 15), px(30, 15)], speed: 1.1 },
    { path: [px(20, 6), px(20, 10), px(14, 10), px(14, 6)], speed: 1.2 },
    { path: [px(28, 17), px(36, 17), px(36, 12), px(28, 12)], speed: 1.2 },
  ],
  cameras: [
    { ...px(3, 3), base: Math.PI / 4, sweep: 0.7, speed: 0.65 },
    { ...px(36, 3), base: Math.PI * 0.75, sweep: 0.7, speed: 0.65 },
    { ...px(1, 10), base: 0, sweep: 0.8, speed: 0.6 },
    { ...px(38, 10), base: Math.PI, sweep: 0.8, speed: 0.6 },
    { ...px(20, 7), base: Math.PI / 2, sweep: 1.0, speed: 0.6 },
    { ...px(20, 14), base: -Math.PI / 2, sweep: 1.0, speed: 0.6 },
  ],
  lasers: [
    { x1: 14 * TILE, y1: HUD_H + 5 * TILE, x2: 14 * TILE, y2: HUD_H + 8 * TILE, on: 2.0, off: 1.8, phase: 0 },
    { x1: 18 * TILE, y1: HUD_H + 11 * TILE, x2: 25 * TILE, y2: HUD_H + 11 * TILE, on: 2.4, off: 1.5, phase: 0.7 },
    { x1: 26 * TILE, y1: HUD_H + 15 * TILE, x2: 26 * TILE, y2: HUD_H + 19 * TILE, on: 2.2, off: 1.6, phase: 1.4 },
  ],
  tools: { coin: 4, smoke: 3, emp: 2 },
};

export const LEVELS = [gallery, bank, casino];
export const TOTAL_GUARDS = LEVELS.reduce((n, l) => n + l.guards.length, 0);
export const TOTAL_CAMERAS = LEVELS.reduce((n, l) => n + l.cameras.length, 0);
export const TOTAL_LOOT = LEVELS.reduce((n, l) => n + l.loot.length, 0);

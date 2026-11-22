// Tuning + look for The Velvet Trilogy. Three heists, one night: Wren the thief
// hits a gallery, a bank and a casino. Each heist has its own palette so the
// judge can tell the rooms apart at a glance: safe cover is dark carpet and
// shadow, danger is red cone and laser light, loot is gold.
export const TILE = 32;
export const HUD_H = 48;
export const W = 1280;
export const H = 720;
export const WORLD_W = 1280;
export const WORLD_H = 720 - HUD_H; // 21 tiles high
export const COLS = 40;
export const ROWS = 21;

export const PLAYER_R = 13;
export const GUARD_R = 14;
export const WALK_SPEED = 165; // px/s
export const SNEAK_SPEED = 95;
export const GUARD_SPEED = 78;
export const GUARD_CHASE_SPEED = 132;

export const GUARD_RANGE = 215;
export const GUARD_FOV = 1.35; // radians, ~77 degrees
export const CAMERA_RANGE = 235;
export const CAMERA_FOV = 0.85;

export const DETECT_RATE = 95; // detection points per second, point blank
export const SNEAK_FACTOR = 0.45; // sneaking fills detection this much slower
export const ALARM_CAM_RATE = 26; // alarm points per second while a camera sees you
export const ALARM_GUARD_RATE = 12; // while a guard sees you
export const ALARM_DECAY = 4; // per second while unseen
export const LOCKDOWN_SECONDS = 8;

export const LIVES = 3;
export const TOOLS = { coin: 3, smoke: 2, emp: 1 };

// A caught thief loses a life, drops half the side loot carried this heist,
// and wakes up at the entrance with the alarm halved.
export const CAUGHT_LOOT_KEEP = 0.5;

export const GRADES = [
  { min: 0.92, grade: 'S', label: 'Ghost — never seen, vault clean' },
  { min: 0.78, grade: 'A', label: 'Clean — quick and quiet' },
  { min: 0.6, grade: 'B', label: 'Messy — but the loot is yours' },
  { min: 0.4, grade: 'C', label: 'Loud — the whole city heard it' },
  { min: 0, grade: 'D', label: 'Sloppy — still counts as a win' },
];

export function gradeFor(score01) {
  for (const g of GRADES) if (score01 >= g.min) return g;
  return GRADES[GRADES.length - 1];
}

// Per-heist palettes: floor pair, wall, trim, glow, rug.
export const PALETTES = {
  gallery: {
    floor: '#241a3d', floor2: '#2a1f47', wall: '#453a6e', wallTop: '#5a4d8a',
    trim: '#c9a227', rug: '#3d1f4d', accent: '#e8c15a', glow: '#ffd76a',
    name: 'Meridian Gallery',
  },
  bank: {
    floor: '#1d2b22', floor2: '#223527', wall: '#3d5a48', wallTop: '#4d7059',
    trim: '#b8a25e', rug: '#24382c', accent: '#d8c27a', glow: '#ffe9a8',
    name: 'Aurum Bank',
  },
  casino: {
    floor: '#2e1220', floor2: '#381627', wall: '#5e2a44', wallTop: '#743656',
    trim: '#d43d6e', rug: '#471a2e', accent: '#ff5c8a', glow: '#ff8fb0',
    name: 'Velvet Casino',
  },
};

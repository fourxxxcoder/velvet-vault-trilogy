// The world: walls, doors, line of sight and collision. Everything is
// axis-aligned rectangles; the thief and the guards are circles.
import { TILE, HUD_H, PLAYER_R, GUARD_R } from './config.js';

export function makeWorld(level) {
  const walls = level.walls.map((w) => ({ ...w }));
  const doors = level.doors.map((d) => ({ ...d, open: false }));
  const state = {
    level, walls, doors,
    vault: { ...level.vault },
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    keycards: level.keycards.map((k) => ({ ...k, taken: false })),
    vaultOpen: false,
    targetTaken: false,
  };
  return state;
}

// Solid rectangles right now: walls plus locked doors.
export function solids(world) {
  const list = world.walls.slice();
  for (const d of world.doors) if (!d.open) list.push(d);
  return list;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Push a circle out of every solid rect it overlaps. Returns true if it hit.
export function collide(world, p, r) {
  let hit = false;
  for (const s of solids(world)) {
    if (!circleHitsRect(p.x, p.y, r, s)) continue;
    hit = true;
    const nx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(p.y, s.y + s.h));
    let dx = p.x - nx;
    let dy = p.y - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 === 0) {
      // Centre inside the rect: push out along the smallest penetration.
      const left = p.x - s.x, right = s.x + s.w - p.x;
      const top = p.y - s.y, bottom = s.y + s.h - p.y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) p.x = s.x - r;
      else if (m === right) p.x = s.x + s.w + r;
      else if (m === top) p.y = s.y - r;
      else p.y = s.y + s.h + r;
    } else {
      const d = Math.sqrt(d2);
      p.x = nx + (dx / d) * r;
      p.y = ny + (dy / d) * r;
    }
  }
  return hit;
}

// Can `a` see `b`? A segment is blocked when it crosses any solid rect.
// A segment that only touches a rect's edge counts as clear.
function segHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  if (dx === 0) {
    if (x1 <= r.x || x1 >= r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx, t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 <= r.y || y1 >= r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy, t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return tmax > 0 && tmin < 1;
}

export function hasLOS(world, x1, y1, x2, y2) {
  for (const s of solids(world)) {
    if (segHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

export function insideRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Distance from a point to a segment (for laser crossings and loot pickup).
export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export { TILE, HUD_H, PLAYER_R, GUARD_R };

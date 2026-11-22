// Laser grids and keycard doors. A laser blinks on a fixed cycle: cross it
// while it is lit and the alarm jumps and every guard is alerted to your
// position. A keycard door stays shut until its card is picked up.
import { distToSegment, insideRect } from './world.js';

export function makeLasers(level) {
  return level.lasers.map((l, i) => ({
    id: i, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2,
    on: l.on, off: l.off, t: l.phase,
    lit: false, tripped: false,
  }));
}

export function updateLasers(lasers, player, dt) {
  let tripped = false;
  for (const l of lasers) {
    l.t += dt;
    const cycle = l.on + l.off;
    l.lit = (l.t % cycle) < l.on;
    if (l.lit && !l.tripped && distToSegment(player.x, player.y, l.x1, l.y1, l.x2, l.y2) < 13) {
      l.tripped = true;
      tripped = true;
    }
    if (!l.lit) l.tripped = false;
  }
  return tripped;
}

// Doors open the moment the matching keycard is carried.
export function updateDoors(doors, carriedCards) {
  for (const d of doors) {
    if (!d.open && d.locked && carriedCards.has(d.locked)) d.open = true;
  }
}

export function doorAt(doors, x, y) {
  for (const d of doors) if (!d.open && insideRect(x, y, d)) return d;
  return null;
}

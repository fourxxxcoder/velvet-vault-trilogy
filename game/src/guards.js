// Guards: patrol waypoints, read the room with a vision cone, and escalate
// patrol -> suspicious -> chase -> catch. A guard that loses you investigates
// the last place it saw you, then goes back to its patrol.
import {
  GUARD_R, GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_RANGE, GUARD_FOV,
  DETECT_RATE, SNEAK_FACTOR,
} from './config.js';
import { collide, hasLOS } from './world.js';

export function makeGuards(level) {
  return level.guards.map((g, i) => ({
    id: i,
    path: g.path,
    speed: GUARD_SPEED * g.speed,
    x: g.path[0].x,
    y: g.path[0].y,
    wp: 1,
    pause: 0,
    angle: 0,
    state: 'patrol', // patrol | suspicious | chase
    detection: 0,
    lastSeen: null,
    investigate: null,
    chaseT: 0,
    lured: null, // {x, y} a coin sent this guard to
    alerted: 0, // seconds of forced alert (laser trip, EMP noise)
  }));
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does this guard see the player right now? Distance, cone, line of sight,
// and smoke. Returns a 0..1 visibility factor.
export function guardSees(guard, world, player, smoke) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const d = Math.hypot(dx, dy);
  if (d > GUARD_RANGE) return 0;
  if (Math.abs(angDiff(angleTo(guard.x, guard.y, player.x, player.y), guard.angle)) > GUARD_FOV / 2) return 0;
  if (!hasLOS(world, guard.x, guard.y, player.x, player.y)) return 0;
  if (smoke) {
    for (const s of smoke) {
      if (Math.hypot(player.x - s.x, player.y - s.y) < s.r) return 0;
    }
  }
  // Close is obvious; far away through a cone edge is a whisper.
  return Math.max(0.25, 1 - d / (GUARD_RANGE * 1.15));
}

function moveToward(guard, world, tx, ty, speed, dt) {
  const dx = tx - guard.x, dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  guard.x += (dx / d) * step;
  guard.y += (dy / d) * step;
  guard.angle = angleTo(guard.x, guard.y, tx, ty);
  collide(world, guard, GUARD_R);
  return d - step < 2;
}

export function updateGuards(guards, world, player, smoke, dt, onCaught) {
  for (const g of guards) {
    if (g.alerted > 0) g.alerted -= dt;

    const vis = guardSees(g, world, player, smoke);
    const sneaking = player.sneaking;
    if (vis > 0) {
      const rate = DETECT_RATE * vis * (sneaking ? SNEAK_FACTOR : 1);
      g.detection = Math.min(100, g.detection + rate * dt);
      g.lastSeen = { x: player.x, y: player.y };
      if (g.detection >= 100 && g.state !== 'chase') {
        g.state = 'chase';
        g.chaseT = 0;
      } else if (g.detection > 35 && g.state === 'patrol') {
        g.state = 'suspicious';
        g.investigate = { ...g.lastSeen };
      }
    } else {
      g.detection = Math.max(0, g.detection - 55 * dt);
      if (g.state === 'suspicious' && g.detection <= 0 && g.investigate) {
        // Reached the spot (or gave up): back to patrol.
        if (moveToward(g, world, g.investigate.x, g.investigate.y, g.speed * 1.15, dt)) {
          g.state = 'patrol';
          g.investigate = null;
        }
        continue;
      }
    }

    if (g.alerted > 0 && g.state !== 'chase' && player.x !== undefined) {
      g.state = 'suspicious';
      g.investigate = { x: player.x, y: player.y };
    }

    if (g.state === 'chase') {
      g.chaseT += dt;
      const arrived = moveToward(g, world, player.x, player.y, GUARD_CHASE_SPEED, dt);
      if (Math.hypot(player.x - g.x, player.y - g.y) < GUARD_R + 13) {
        onCaught(g);
        return;
      }
      if (vis === 0 && g.chaseT > 4) {
        // Lost you for four seconds: hunt the last seen spot, then give up.
        g.state = 'suspicious';
        g.investigate = g.lastSeen ? { ...g.lastSeen } : { x: g.path[0].x, y: g.path[0].y };
        g.detection = 30;
      }
      continue;
    }

    if (g.state === 'suspicious') {
      if (g.investigate) {
        if (moveToward(g, world, g.investigate.x, g.investigate.y, g.speed * 1.15, dt)) {
          g.state = 'patrol';
          g.investigate = null;
        }
      }
      continue;
    }

    // Patrol: walk the waypoints, pause and look around at each one.
    if (g.lured) {
      if (moveToward(g, world, g.lured.x, g.lured.y, g.speed * 1.2, dt)) {
        g.lured = null;
        g.pause = 1.2; // stands over the coin, puzzled
      }
      continue;
    }
    if (g.pause > 0) {
      g.pause -= dt;
      g.angle += dt * 0.9; // scans the room while paused
      continue;
    }
    const target = g.path[g.wp];
    if (moveToward(g, world, target.x, target.y, g.speed, dt)) {
      g.wp = (g.wp + 1) % g.path.length;
      g.pause = 0.9;
    }
  }
}

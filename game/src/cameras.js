// CCTV cameras: fixed pivots sweeping a cone. A camera that sees you feeds
// the alarm meter; an EMP kills every camera for a while — loudly.
import { CAMERA_RANGE, CAMERA_FOV, ALARM_CAM_RATE } from './config.js';
import { hasLOS } from './world.js';

export function makeCameras(level) {
  return level.cameras.map((c, i) => ({
    id: i, x: c.x, y: c.y,
    base: c.base, sweep: c.sweep, speed: c.speed,
    angle: c.base, t: i * 1.7,
    disabled: 0, // seconds left of EMP shutdown
    seeing: false,
  }));
}

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function updateCameras(cameras, world, player, smoke, dt) {
  let alarmGain = 0;
  for (const c of cameras) {
    if (c.disabled > 0) {
      c.disabled -= dt;
      c.seeing = false;
      continue;
    }
    c.t += dt;
    c.angle = c.base + Math.sin(c.t * c.speed) * c.sweep;
    const dx = player.x - c.x, dy = player.y - c.y;
    const d = Math.hypot(dx, dy);
    let sees = false;
    if (d < CAMERA_RANGE) {
      const a = Math.atan2(dy, dx);
      if (Math.abs(angDiff(a, c.angle)) < CAMERA_FOV / 2 && hasLOS(world, c.x, c.y, player.x, player.y)) {
        sees = true;
        if (smoke) {
          for (const s of smoke) {
            if (Math.hypot(player.x - s.x, player.y - s.y) < s.r) sees = false;
          }
        }
      }
    }
    c.seeing = sees;
    if (sees) alarmGain += ALARM_CAM_RATE;
  }
  return alarmGain;
}

export function empBlast(cameras, seconds) {
  for (const c of cameras) c.disabled = Math.max(c.disabled, seconds);
}

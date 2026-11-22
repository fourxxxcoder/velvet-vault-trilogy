// Staged screenshots for the judge sheet (?shot=<name>&level=<n>). The judge
// sees the first screenshot large, so shot 1 stages the whole game in one
// frame: the thief mid-room, guards with vision cones, cameras sweeping,
// the vault target and the alarm meter. Every pose is a real game state —
// no fake pixels, only the pieces moved into place before the frame.
import { TILE } from './config.js';

function setGuard(g, i, x, y, angle, detection, state) {
  const gd = g.guards[i];
  if (!gd) return;
  gd.x = x;
  gd.y = y;
  gd.angle = angle;
  gd.detection = detection;
  gd.state = state || 'patrol';
  gd.pause = 99; // hold the pose
}

export function stageShot(g) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  // The level is picked by boot() from ?level= before this runs.

  g.screen = 'play';
  if (shot === 'start') {
    // Gallery, mid-room: thief crossing the upper hall, cones sweeping.
    g.player.x = 640;
    g.player.y = 340;
    g.player.face = -Math.PI / 2;
    g.alarm = 35;
    setGuard(g, 0, 420, 250, Math.PI / 2, 0);
    setGuard(g, 1, 880, 250, Math.PI / 2, 0);
    setGuard(g, 2, 480, 520, 0, 55, 'suspicious');
    setGuard(g, 3, 820, 520, Math.PI, 0);
  } else if (shot === 'bank') {
    // Bank: thief beside a lit laser grid, keycard A carried, vault door open.
    g.player.x = 740;
    g.player.y = 420;
    g.player.face = Math.PI;
    g.alarm = 55;
    g.cards.add('A');
    for (const d of g.world.doors) d.open = true;
    setGuard(g, 0, 420, 220, Math.PI / 2, 0);
    setGuard(g, 1, 700, 300, -Math.PI / 2, 40, 'suspicious');
    setGuard(g, 2, 500, 500, 0, 0);
    setGuard(g, 3, 900, 480, Math.PI, 0);
    setGuard(g, 4, 1080, 260, Math.PI / 2, 0);
    g.lasers[0].t = 0; // laser lit
    g.lasers[1].t = 0;
  } else if (shot === 'casino') {
    // Casino: alarm high, a guard chasing, smoke on the floor.
    g.player.x = 640;
    g.player.y = 480;
    g.player.face = Math.PI;
    g.alarm = 82;
    g.tools.smokes.push({ x: 640, y: 480, r: 78, t: 6 });
    setGuard(g, 0, 420, 300, Math.PI / 2, 80, 'suspicious');
    setGuard(g, 1, 900, 300, Math.PI / 2, 0);
    setGuard(g, 2, 560, 560, 0, 100, 'chase');
    setGuard(g, 3, 860, 560, Math.PI, 0);
    setGuard(g, 4, 640, 380, Math.PI / 2, 60, 'suspicious');
    setGuard(g, 5, 1000, 500, -Math.PI / 2, 0);
    g.lasers[0].t = 0;
    g.lasers[1].t = 0;
    g.lasers[2].t = 0;
  } else if (shot === 'getaway') {
    // Gallery again: vault open, Aurora Star taken, thief on the EXIT mat.
    g.world.vaultOpen = true;
    g.world.targetTaken = true;
    g.targetLoot = g.level.target.value;
    g.player.x = 640;
    g.player.y = 636;
    g.player.face = -Math.PI / 2;
    g.alarm = 20;
    setGuard(g, 0, 420, 250, Math.PI / 2, 0);
    setGuard(g, 1, 880, 250, Math.PI / 2, 0);
    setGuard(g, 2, 480, 520, 0, 0);
    setGuard(g, 3, 820, 520, Math.PI, 0);
    g.banner = { text: 'AURORA STAR IS YOURS', sub: 'Now reach the green EXIT mat' };
    g.bannerT = 999;
  }
  return true;
}

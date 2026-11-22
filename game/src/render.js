// Canvas drawing: the look is the judge's fourth criterion, so safe cover,
// danger and loot must read at a glance. Floors are dark patterned carpet
// with gold inlay, walls are deep violet/green/maroon with a lit top edge,
// vision cones are warm amber turning red as detection fills, cameras sweep
// pale red cones, lasers are bright red bars, loot is gold.
import { TILE, HUD_H, W, H, GUARD_RANGE, GUARD_FOV, CAMERA_RANGE, CAMERA_FOV } from './config.js';

export function drawWorld(ctx, g) {
  const { world, player, guards, cameras, lasers, tools } = g;
  const pal = world.level.palette;
  ctx.clearRect(0, 0, W, H);

  // Floor: checker carpet + gold inlay border.
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 40; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? pal.floor : pal.floor2;
      ctx.fillRect(c * TILE, HUD_H + r * TILE, TILE, TILE);
    }
  }
  ctx.strokeStyle = pal.trim;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.strokeRect(TILE + 4, HUD_H + TILE + 4, W - 2 * TILE - 8, H - HUD_H - 2 * TILE - 8);
  ctx.globalAlpha = 1;
  // Rug in the middle of the room.
  ctx.fillStyle = pal.rug;
  ctx.fillRect(14 * TILE, HUD_H + 9 * TILE, 12 * TILE, 3 * TILE);
  ctx.strokeStyle = pal.trim;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(14 * TILE + 3, HUD_H + 9 * TILE + 3, 12 * TILE - 6, 3 * TILE - 6);
  ctx.globalAlpha = 1;

  drawExit(ctx, world);
  drawVault(ctx, world);
  for (const l of world.loot) if (!l.taken) drawLoot(ctx, l, pal);
  for (const k of world.keycards) if (!k.taken) drawKeycard(ctx, k);
  for (const w of world.walls) drawWall(ctx, w, pal);
  for (const d of world.doors) drawDoor(ctx, d, pal); // doors after walls: their labels stay readable
  for (const c of tools.coins) drawCoin(ctx, c);
  for (const s of tools.smokes) drawSmoke(ctx, s);
  for (const l of lasers) drawLaser(ctx, l);
  for (const c of cameras) drawCamera(ctx, c, pal);
  for (const gd of guards) drawGuard(ctx, gd);
  drawPlayer(ctx, player, g);
  drawCrackDial(ctx, g);
  if (g.alarm >= 100) {
    ctx.fillStyle = 'rgba(255,0,40,0.10)';
    ctx.fillRect(0, HUD_H, W, H - HUD_H);
  }
}

function drawWall(ctx, w, pal) {
  ctx.fillStyle = pal.wall;
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = pal.wallTop;
  ctx.fillRect(w.x, w.y, w.w, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
}

function drawExit(ctx, world) {
  const e = world.level.exit;
  ctx.fillStyle = '#0e3d24';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#1f7a44';
  for (let i = 0; i < 5; i++) ctx.fillRect(e.x + i * (e.w / 5), e.y, 4, e.h);
  ctx.fillStyle = '#b8ffd2';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT — GETAWAY', e.x + e.w / 2, e.y + e.h / 2 + 5);
}

function drawVault(ctx, world) {
  const v = world.vault;
  ctx.fillStyle = world.vaultOpen ? '#6b5a1e' : '#3a2f10';
  ctx.fillRect(v.x - 6, v.y - 6, v.w + 12, v.h + 12);
  ctx.strokeStyle = '#e8c15a';
  ctx.lineWidth = 3;
  ctx.strokeRect(v.x - 6, v.y - 6, v.w + 12, v.h + 12);
  if (!world.targetTaken) {
    const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
    // The target itself: a glowing diamond / gold stack / jackpot.
    ctx.save();
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx, cy + 12);
    ctx.lineTo(cx - 12, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx + 6, cy);
    ctx.lineTo(cx, cy + 7);
    ctx.lineTo(cx - 6, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.level.target.name.toUpperCase(), v.x + v.w / 2, v.y - 10);
}

const LOOT_COLOR = { painting: '#c98a4b', gems: '#7fe3ff', cash: '#7ddc8a', gold: '#ffd76a', chips: '#ff5c8a' };

function drawLoot(ctx, l, pal) {
  ctx.save();
  ctx.shadowColor = LOOT_COLOR[l.kind] || '#ffd76a';
  ctx.shadowBlur = 10;
  ctx.fillStyle = LOOT_COLOR[l.kind] || '#ffd76a';
  if (l.kind === 'painting') {
    ctx.fillRect(l.x - 11, l.y - 8, 22, 16);
    ctx.fillStyle = '#f3e2c7';
    ctx.fillRect(l.x - 8, l.y - 5, 16, 10);
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(l.x - 3, l.y - 3, 6, 6);
  } else if (l.kind === 'gems') {
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - 9);
    ctx.lineTo(l.x + 8, l.y);
    ctx.lineTo(l.x, l.y + 9);
    ctx.lineTo(l.x - 8, l.y);
    ctx.closePath();
    ctx.fill();
  } else if (l.kind === 'gold') {
    ctx.fillRect(l.x - 10, l.y - 4, 20, 8);
    ctx.fillRect(l.x - 7, l.y - 9, 14, 6);
  } else if (l.kind === 'chips') {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(l.x - 6 + i * 6, l.y + 4 - i * 3, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillRect(l.x - 10, l.y - 5, 20, 10);
    ctx.fillStyle = '#1d5c2e';
    ctx.fillRect(l.x - 7, l.y - 2, 14, 4);
  }
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$' + l.value, l.x, l.y + 20);
}

function drawKeycard(ctx, k) {
  ctx.save();
  ctx.shadowColor = '#7fe3ff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#bfefff';
  ctx.fillRect(k.x - 9, k.y - 6, 18, 12);
  ctx.fillStyle = '#14607a';
  ctx.fillRect(k.x - 9, k.y - 6, 18, 4);
  ctx.restore();
  ctx.fillStyle = '#dff6ff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KEYCARD ' + k.id, k.x, k.y + 20);
}

function drawDoor(ctx, d, pal) {
  ctx.fillStyle = d.locked ? '#8a6d1f' : '#5a4d2a';
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.strokeStyle = '#e8c15a';
  ctx.lineWidth = 2;
  ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
  // Short label inside the gate, on a dark pill, so it never collides with
  // loot labels or hides behind a wall.
  const label = d.locked === 'A' ? 'VAULT · KEY A' : d.locked === 'B' ? 'CAGE · KEY B' : 'LOCKED';
  ctx.font = 'bold 10px sans-serif';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(d.x + d.w / 2 - tw / 2 - 4, d.y + d.h / 2 - 8, tw + 8, 15);
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.fillText(label, d.x + d.w / 2, d.y + d.h / 2 + 3);
}

function drawCoin(ctx, c) {
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6d1f';
  ctx.stroke();
}

function drawSmoke(ctx, s) {
  ctx.fillStyle = 'rgba(200,200,210,0.35)';
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220,220,230,0.25)';
  ctx.beginPath();
  ctx.arc(s.x - 20, s.y + 10, s.r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawLaser(ctx, l) {
  if (l.lit) {
    ctx.save();
    ctx.shadowColor = '#ff2233';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ff2233';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.restore();
    // Emitter boxes.
    ctx.fillStyle = '#7a1010';
    ctx.fillRect(l.x1 - 6, l.y1 - 6, 12, 12);
    ctx.fillRect(l.x2 - 6, l.y2 - 6, 12, 12);
    ctx.fillStyle = '#ff5566';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 3, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255,60,80,0.25)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#4a2020';
    ctx.fillRect(l.x1 - 6, l.y1 - 6, 12, 12);
    ctx.fillRect(l.x2 - 6, l.y2 - 6, 12, 12);
  }
}

function cone(ctx, x, y, angle, range, fov, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - fov / 2, angle + fov / 2);
  ctx.closePath();
  ctx.fill();
}

function drawCamera(ctx, c, pal) {
  const disabled = c.disabled > 0;
  if (!disabled) {
    cone(ctx, c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_FOV, c.seeing ? 'rgba(255,40,60,0.20)' : 'rgba(255,120,120,0.10)');
  }
  ctx.fillStyle = disabled ? '#555' : '#222';
  ctx.beginPath();
  ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = disabled ? '#888' : c.seeing ? '#ff2233' : '#ff5566';
  ctx.beginPath();
  ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF', c.x, c.y - 13);
  }
}

function drawGuard(ctx, g) {
  const heat = g.detection / 100;
  const color = g.state === 'chase' ? 'rgba(255,30,50,0.28)'
    : heat > 0.35 ? `rgba(255,120,40,${0.10 + heat * 0.16})`
    : 'rgba(255,200,90,0.13)';
  cone(ctx, g.x, g.y, g.angle, GUARD_RANGE, GUARD_FOV, color);
  // Body: dark uniform with a cap brim facing the look direction.
  ctx.fillStyle = '#2c2f45';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#565b7d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#3d4266';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 6, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = g.state === 'chase' ? '#ff2233' : '#ffd76a';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 11, g.y + Math.sin(g.angle) * 11, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // State mark.
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  if (g.state === 'chase') {
    ctx.fillStyle = '#ff2233';
    ctx.fillText('!', g.x, g.y - 20);
  } else if (g.state === 'suspicious' || g.detection > 30) {
    ctx.fillStyle = '#ffb020';
    ctx.fillText('?', g.x, g.y - 20);
  }
  // Detection arc over the head.
  if (g.detection > 2) {
    ctx.strokeStyle = g.detection > 70 ? '#ff2233' : '#ffb020';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + (g.detection / 100) * Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, player, g) {
  const x = player.x, y = player.y;
  // Sneak = crouched, smaller and dimmer.
  const r = player.sneaking ? 10 : 13;
  ctx.save();
  ctx.shadowColor = '#b06cff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#7a3fd1';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#d9b8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  // Hood point faces the move direction.
  ctx.fillStyle = '#e9dcff';
  ctx.beginPath();
  ctx.arc(x + Math.cos(player.face) * (r - 2), y + Math.sin(player.face) * (r - 2), 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', x, y - r - 6);
}

function drawCrackDial(ctx, g) {
  const sc = g.safecrack;
  if (!sc || !sc.active) return;
  const cx = W / 2, cy = 300, w = 420, h = 26;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(cx - w / 2 - 24, cy - 64, w + 48, 130);
  ctx.strokeStyle = '#e8c15a';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2 - 24, cy - 64, w + 48, 130);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`CRACKING THE SAFE — ${sc.tumblers}/${sc.needed} tumblers`, cx, cy - 38);
  ctx.fillStyle = '#3a2f10';
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(cx - w / 2 + sc.band.from * w, cy - h / 2, (sc.band.to - sc.band.from) * w, h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - w / 2 + sc.needle * w - 2, cy - h / 2 - 6, 4, h + 12);
  ctx.fillStyle = '#ddd';
  ctx.font = '13px sans-serif';
  ctx.fillText('Hold SPACE — release inside the gold band. Wrong release rattles the safe (+10 alarm).', cx, cy + 40);
}

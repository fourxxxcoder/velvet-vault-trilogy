// The Velvet Trilogy — game state, loop and scoring. One night, three heists:
// grab the target, then reach the green EXIT mat. A full alarm means
// LOCKDOWN: every guard hunts you until it burns off.
import { WALK_SPEED, SNEAK_SPEED, ALARM_DECAY, ALARM_GUARD_RATE, LOCKDOWN_SECONDS, LIVES, CAUGHT_LOOT_KEEP, gradeFor } from './config.js';
import { LEVELS } from './levels.js';
import { makeWorld, collide, hasLOS, insideRect } from './world.js';
import { makeGuards, updateGuards } from './guards.js';
import { makeCameras, updateCameras } from './cameras.js';
import { makeLasers, updateLasers, updateDoors } from './lasers.js';
import { makeTools, throwCoin, popSmoke, fireEmp, updateTools } from './tools.js';
import { makeSafecrack, startCrack, stopCrack, updateSafecrack, releaseCrack } from './safecrack.js';
import { makeInput, attachInput, consumePress, endFrame, moveVector } from './input.js';
import { makeAudio, sfx } from './audio.js';
import { drawWorld } from './render.js';
import { drawHUD, drawTitle, drawPaused, drawCaught, drawHeistComplete, drawCampaignComplete, drawGameOver, drawBanner } from './hud.js';
import { stageShot } from './shots.js';

const HEIST_SECONDS = 300;

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = makeInput();
  attachInput(input, canvas);
  const audio = makeAudio();
  const g = {
    canvas, ctx, input, audio,
    screen: 'title', // title | play | paused | caught | heistComplete | campaignComplete | gameover
    levelIndex: 0, level: LEVELS[0],
    world: null, guards: [], cameras: [], lasers: [], tools: null, safecrack: makeSafecrack(),
    player: { x: 0, y: 0, face: 0, sneaking: false },
    alarm: 0, lockdownT: 0, lives: LIVES,
    sideLoot: 0, targetLoot: 0, cards: new Set(),
    timeLeft: HEIST_SECONDS, spotted: false, seenNow: false,
    results: [], totalLoot: 0, totalScore: 0, lastResult: null,
    banner: null, bannerT: 0,
    spaceWasDown: false,
    elapsed: 0,
  };
  startHeist(g, 0, true);
  g.screen = 'title';
  return g;
}

function startHeist(g, index, resetLives) {
  g.levelIndex = index;
  g.level = LEVELS[index];
  g.world = makeWorld(g.level);
  g.guards = makeGuards(g.level);
  g.cameras = makeCameras(g.level);
  g.lasers = makeLasers(g.level);
  g.tools = makeTools(g.level.tools);
  g.safecrack = makeSafecrack();
  g.player = { x: g.level.player.x, y: g.level.player.y, face: -Math.PI / 2, sneaking: false };
  g.alarm = 0;
  g.lockdownT = 0;
  g.sideLoot = 0;
  g.targetLoot = 0;
  g.cards = new Set();
  g.timeLeft = HEIST_SECONDS;
  g.spotted = false;
  if (resetLives) {
    g.lives = LIVES;
    g.results = [];
    g.totalLoot = 0;
    g.totalScore = 0;
  }
  g.screen = 'play';
}

export function lootValue(g) {
  return g.sideLoot + g.targetLoot;
}

export function maxLoot(level) {
  return level.loot.reduce((n, l) => n + l.value, 0) + level.target.value;
}

function objective(g) {
  if (!g.world.vaultOpen) return 'Crack the vault — hold SPACE';
  if (!g.world.targetTaken) return 'Grab the ' + g.level.target.name;
  return 'Reach the green EXIT mat';
}

function showBanner(g, text, sub, seconds) {
  g.banner = { text, sub: sub || '' };
  g.bannerT = seconds || 2.2;
}

function onCaught(g, reason) {
  if (g.screen !== 'play') return;
  stopCrack(g.safecrack);
  g.lives -= 1;
  g.sideLoot = Math.floor(g.sideLoot * CAUGHT_LOOT_KEEP);
  sfx.caught(g.audio);
  if (g.lives <= 0) {
    g.totalLoot += lootValue(g);
    g.screen = 'gameover';
    return;
  }
  g.screen = 'caught';
  g.caughtReason = reason || 'caught';
}

function heistScore(g) {
  const lootFrac = lootValue(g) / maxLoot(g.level);
  const timeFrac = Math.max(0, g.timeLeft / HEIST_SECONDS);
  const toolsLeft = g.tools.coin + g.tools.smoke + g.tools.emp;
  const toolsMax = g.level.tools.coin + g.level.tools.smoke + g.level.tools.emp;
  const score01 = 0.55 * lootFrac + 0.2 * timeFrac + 0.15 * (g.spotted ? 0 : 1) + 0.1 * (toolsLeft / toolsMax);
  const score = Math.round(
    lootValue(g) + Math.round(g.timeLeft) * 10 + (g.spotted ? 0 : 1500) + toolsLeft * 100,
  );
  return { score01, score, lootFrac, timeFrac, toolsLeft };
}

function finishHeist(g) {
  const s = heistScore(g);
  const grade = gradeFor(s.score01);
  const result = {
    levelName: g.level.name,
    grade: grade.grade,
    gradeLabel: grade.label,
    loot: lootValue(g),
    time: Math.round(HEIST_SECONDS - g.timeLeft),
    spotted: g.spotted,
    toolsLeft: s.toolsLeft,
    score: s.score,
    next: g.levelIndex + 1 < LEVELS.length,
  };
  g.lastResult = result;
  g.results.push(result);
  g.totalLoot += lootValue(g);
  g.totalScore += s.score;
  sfx.win(g.audio);
  g.screen = 'heistComplete';
}

function updatePlay(g, dt) {
  const p = g.player;
  const input = g.input;

  // Pause / mute.
  if (consumePress(input, 'KeyP')) { g.screen = 'paused'; return; }
  if (consumePress(input, 'KeyM')) { g.audio.muted = !g.audio.muted; }

  // Tools: Q or click throws a coin, E smoke, F EMP.
  if (consumePress(input, 'KeyQ') || input.mouse.clicked) {
    const tx = input.mouse.clicked ? input.mouse.x : p.x + Math.cos(p.face) * 90;
    const ty = input.mouse.clicked ? input.mouse.y : p.y + Math.sin(p.face) * 90;
    if (throwCoin(g.tools, tx, ty, g.guards)) sfx.coin(g.audio);
  }
  if (consumePress(input, 'KeyE')) {
    if (popSmoke(g.tools, p.x, p.y)) sfx.smoke(g.audio);
  }
  if (consumePress(input, 'KeyF')) {
    if (fireEmp(g.tools, g.cameras)) {
      g.alarm = Math.min(100, g.alarm + 15);
      sfx.emp(g.audio);
      showBanner(g, 'EMP BLAST — cameras down 12s', 'Loud. The alarm heard that.', 2);
    }
  }

  const spaceDown = input.keys.has('Space');
  const nearVault = !g.world.vaultOpen && !g.world.targetTaken &&
    Math.abs(p.x - (g.world.vault.x + g.world.vault.w / 2)) < g.world.vault.w / 2 + 34 &&
    Math.abs(p.y - (g.world.vault.y + g.world.vault.h / 2)) < g.world.vault.h / 2 + 34;

  // Safe-cracking: hold SPACE at the vault, release in the gold band.
  if (nearVault && !g.safecrack.active && spaceDown && !g.spaceWasDown) {
    startCrack(g.safecrack);
  }
  if (g.safecrack.active) {
    if (!spaceDown && g.spaceWasDown) {
      releaseCrack(g.safecrack);
      const r = g.safecrack.result;
      if (r === 'tumbler') sfx.tumbler(g.audio);
      if (r === 'rattle') {
        g.alarm = Math.min(100, g.alarm + 10);
        sfx.rattle(g.audio);
        showBanner(g, 'The safe rattled!', '+10 alarm — the guards heard that', 1.6);
      }
      if (r === 'open') {
        g.world.vaultOpen = true;
        sfx.vault(g.audio);
        showBanner(g, 'VAULT OPEN — grab the ' + g.level.target.name, '', 2.4);
      }
    }
    updateSafecrack(g.safecrack, spaceDown, dt);
  }
  g.spaceWasDown = spaceDown;

  // Move (not while cracking).
  p.sneaking = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  if (!g.safecrack.active) {
    const mv = moveVector(input);
    if (mv.x !== 0 || mv.y !== 0) {
      p.face = Math.atan2(mv.y, mv.x);
      const speed = p.sneaking ? SNEAK_SPEED : WALK_SPEED;
      p.x += mv.x * speed * dt;
      p.y += mv.y * speed * dt;
      collide(g.world, p, 13);
    }
  }

  // Pickups: side loot, keycards, the target once the vault is open.
  for (const l of g.world.loot) {
    if (!l.taken && Math.hypot(p.x - l.x, p.y - l.y) < 26) {
      l.taken = true;
      g.sideLoot += l.value;
      sfx.pickup(g.audio);
    }
  }
  for (const k of g.world.keycards) {
    if (!k.taken && Math.hypot(p.x - k.x, p.y - k.y) < 26) {
      k.taken = true;
      g.cards.add(k.id);
      sfx.pickup(g.audio);
      showBanner(g, 'KEYCARD ' + k.id + ' — a locked door just opened', '', 2);
    }
  }
  updateDoors(g.world.doors, g.cards);
  if (g.world.vaultOpen && !g.world.targetTaken) {
    const v = g.world.vault;
    if (Math.abs(p.x - (v.x + v.w / 2)) < v.w / 2 + 26 && Math.abs(p.y - (v.y + v.h / 2)) < v.h / 2 + 26) {
      g.world.targetTaken = true;
      g.targetLoot = g.level.target.value;
      sfx.vault(g.audio);
      showBanner(g, g.level.target.name.toUpperCase() + ' IS YOURS', 'Now reach the green EXIT mat', 2.4);
    }
  }

  // Guards, cameras, lasers.
  updateGuards(g.guards, g.world, p, g.tools.smokes, dt, (guard) => onCaught(g, 'caught'));
  if (g.screen !== 'play') return;
  const camAlarm = updateCameras(g.cameras, g.world, p, g.tools.smokes, dt);
  updateTools(g.tools, dt);

  let guardAlarm = 0;
  let anySeen = false;
  for (const gd of g.guards) {
    if (gd.state === 'chase') { guardAlarm = ALARM_GUARD_RATE; anySeen = true; }
    else if (gd.state === 'suspicious') { guardAlarm = Math.max(guardAlarm, ALARM_GUARD_RATE / 2); anySeen = true; }
    if (gd.detection > 60) g.spotted = true;
  }
  if (camAlarm > 0) { anySeen = true; g.spotted = true; }
  if (anySeen) sfx.alarm(g.audio);
  g.alarm += (camAlarm + guardAlarm) * dt;
  if (camAlarm + guardAlarm === 0) g.alarm = Math.max(0, g.alarm - ALARM_DECAY * dt);

  if (updateLasers(g.lasers, p, dt)) {
    g.alarm = Math.min(100, g.alarm + 30);
    for (const gd of g.guards) gd.alerted = 3;
    g.spotted = true;
    sfx.alarm(g.audio);
    showBanner(g, 'LASER TRIPPED!', '+30 alarm — every guard is coming', 2);
  }

  // Lockdown at a full alarm.
  if (g.alarm >= 100 && g.lockdownT <= 0) {
    g.lockdownT = LOCKDOWN_SECONDS;
    for (const gd of g.guards) gd.alerted = LOCKDOWN_SECONDS;
    showBanner(g, 'LOCKDOWN!', 'Every guard is hunting you', 2.4);
  }
  if (g.lockdownT > 0) {
    g.lockdownT -= dt;
    g.alarm = 100;
    if (g.lockdownT <= 0) g.alarm = 50;
  } else {
    g.alarm = Math.min(100, g.alarm);
  }

  // Timer.
  g.timeLeft -= dt;
  if (g.timeLeft <= 0) {
    onCaught(g, 'time');
    return;
  }

  // Getaway.
  const e = g.level.exit;
  if (g.world.targetTaken && insideRect(p.x, p.y, e)) {
    finishHeist(g);
    return;
  }

  if (g.bannerT > 0) g.bannerT -= dt;
}

function update(g, dt) {
  const input = g.input;
  if (g.screen === 'title') {
    if (consumePress(input, 'Space')) startHeist(g, 0, true);
    if (consumePress(input, 'Digit1')) startHeist(g, 0, true);
    if (consumePress(input, 'Digit2')) startHeist(g, 1, true);
    if (consumePress(input, 'Digit3')) startHeist(g, 2, true);
    return;
  }
  if (g.screen === 'paused') {
    if (consumePress(input, 'KeyP')) g.screen = 'play';
    return;
  }
  if (g.screen === 'caught') {
    if (consumePress(input, 'Space')) {
      // Slip back in at the entrance, guards reset to patrol.
      g.player.x = g.level.player.x;
      g.player.y = g.level.player.y;
      g.guards = makeGuards(g.level);
      g.alarm = Math.max(0, g.alarm / 2);
      g.timeLeft = Math.max(60, g.timeLeft);
      g.screen = 'play';
    }
    return;
  }
  if (g.screen === 'heistComplete') {
    if (consumePress(input, 'Space')) {
      if (g.lastResult.next) startHeist(g, g.levelIndex + 1, false);
      else g.screen = 'campaignComplete';
    }
    return;
  }
  if (g.screen === 'campaignComplete' || g.screen === 'gameover') {
    if (consumePress(input, 'Space')) {
      g.screen = 'title';
      startHeist(g, 0, true);
      g.screen = 'title';
    }
    return;
  }
  updatePlay(g, dt);
}

function render(g) {
  const ctx = g.ctx;
  ctx.clearRect(0, 0, 1280, 720);
  if (g.screen === 'title') {
    drawWorld(ctx, g);
    drawTitle(ctx, g);
    return;
  }
  drawWorld(ctx, g);
  drawHUD(ctx, {
    level: g.level, alarm: g.alarm, lootValue: lootValue(g),
    targetValue: g.level.target.value, lives: g.lives, tools: g.tools,
    timeLeft: Math.max(0, g.timeLeft), objective: objective(g), cards: g.cards,
  });
  if (g.screen === 'paused') drawPaused(ctx);
  if (g.screen === 'caught') drawCaught(ctx, g);
  if (g.screen === 'heistComplete') drawHeistComplete(ctx, g);
  if (g.screen === 'campaignComplete') drawCampaignComplete(ctx, g);
  if (g.screen === 'gameover') drawGameOver(ctx, g);
  if (g.screen === 'play' && g.banner && g.bannerT > 0) drawBanner(ctx, g.banner.text, g.banner.sub);
}

export function frame(g, dt) {
  g.elapsed += dt;
  update(g, Math.min(dt, 0.05));
  render(g);
  endFrame(g.input);
  // Debug hook for the screenshot driver and the playtest.
  window.__heist = {
    screen: g.screen,
    level: g.level.id,
    player: { x: Math.round(g.player.x), y: Math.round(g.player.y) },
    alarm: Math.round(g.alarm),
    lives: g.lives,
    loot: lootValue(g),
    tools: { coin: g.tools.coin, smoke: g.tools.smoke, emp: g.tools.emp },
    guards: g.guards.map((gd) => ({ x: Math.round(gd.x), y: Math.round(gd.y), state: gd.state })),
    cameras: g.cameras.map((c) => ({ seeing: c.seeing, disabled: Math.round(c.disabled) })),
    vaultOpen: g.world.vaultOpen,
    targetTaken: g.world.targetTaken,
    score: g.totalScore,
  };
}

export function boot(canvas) {
  const g = createGame(canvas);
  // A staged screenshot may ask for a later heist (?level=1 or 2).
  const params = new URLSearchParams(window.location.search);
  const li = parseInt(params.get('level') || '0', 10);
  if (li > 0 && li < LEVELS.length) startHeist(g, li, true);
  // Staged screenshots for the judge sheet (?shot=... in the URL).
  const staged = stageShot(g);
  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    frame(g, dt);
    if (!staged) requestAnimationFrame(loop);
  }
  if (staged) {
    // Render a few frames so cones, smoke and the HUD settle, then stop:
    // the driver waits for window.__shotReady and screenshots the canvas.
    let n = 0;
    function stagedLoop() {
      frame(g, 1 / 60);
      n += 1;
      if (n < 5) requestAnimationFrame(stagedLoop);
      else window.__shotReady = true;
    }
    requestAnimationFrame(stagedLoop);
  } else {
    requestAnimationFrame(loop);
  }
  return g;
}

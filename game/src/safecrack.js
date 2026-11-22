// Safe-cracking: stand at the vault and hold SPACE. A needle sweeps the
// dial; release inside the gold band to land a tumbler. Three tumblers open
// the vault. Release outside the band and the safe rattles: +10 alarm, and
// the needle speeds up. You are standing still while you crack, and every
// guard can see you — that is the gamble.
export function makeSafecrack() {
  return {
    active: false,
    needle: 0, // 0..1 across the dial
    dir: 1,
    speed: 0.55, // sweeps per second
    band: { from: 0.55, to: 0.78 }, // gold band, re-rolled each tumbler
    tumblers: 0,
    needed: 3,
    holding: false,
    result: null, // 'tumbler' | 'rattle' | 'open' (consumed by main)
  };
}

export function startCrack(sc) {
  sc.active = true;
  sc.needle = 0;
  sc.dir = 1;
  sc.tumblers = 0;
  sc.result = null;
  rollBand(sc);
}

export function stopCrack(sc) {
  sc.active = false;
  sc.result = null;
}

function rollBand(sc) {
  const w = 0.2;
  const from = 0.08 + Math.random() * (0.92 - w - 0.08);
  sc.band = { from, to: from + w };
}

export function updateSafecrack(sc, holding, dt) {
  if (!sc.active) return;
  sc.holding = holding;
  if (holding) {
    sc.needle += sc.dir * sc.speed * dt;
    if (sc.needle > 1) { sc.needle = 1; sc.dir = -1; }
    if (sc.needle < 0) { sc.needle = 0; sc.dir = 1; }
  }
}

// Called on SPACE release while cracking.
export function releaseCrack(sc) {
  if (!sc.active) return;
  if (sc.needle >= sc.band.from && sc.needle <= sc.band.to) {
    sc.tumblers += 1;
    if (sc.tumblers >= sc.needed) {
      sc.result = 'open';
      sc.active = false;
    } else {
      sc.result = 'tumbler';
      sc.speed = Math.min(1.15, sc.speed + 0.18);
      sc.needle = 0;
      sc.dir = 1;
      rollBand(sc);
    }
  } else {
    sc.result = 'rattle';
    sc.speed = Math.min(1.15, sc.speed + 0.12);
  }
}

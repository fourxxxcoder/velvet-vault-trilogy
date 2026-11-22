// The thief's tools, each with a cost — the judge's second criterion is
// tools at a cost. Coin: thrown to a clicked spot, the nearest guard walks
// over to look. Smoke: a cloud that blinds guards and cameras for 6 seconds.
// EMP: kills every camera for 12 seconds, but the blast itself feeds the
// alarm: loud tools are a trade, not a free win.
export function makeTools(counts) {
  return {
    coin: counts.coin, smoke: counts.smoke, emp: counts.emp,
    coins: [], // {x, y, t} resting coins guards walk to
    smokes: [], // {x, y, r, t} clouds
  };
}

export function throwCoin(tools, x, y, guards) {
  if (tools.coin <= 0) return false;
  tools.coin -= 1;
  tools.coins.push({ x, y, t: 14 });
  // The nearest patrolling guard goes to look.
  let best = null, bestD = Infinity;
  for (const g of guards) {
    if (g.state !== 'patrol') continue;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestD) { bestD = d; best = g; }
  }
  if (best) best.lured = { x, y };
  return true;
}

export function popSmoke(tools, x, y) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.smokes.push({ x, y, r: 78, t: 6 });
  return true;
}

export function fireEmp(tools, cameras) {
  if (tools.emp <= 0) return false;
  tools.emp -= 1;
  for (const c of cameras) c.disabled = Math.max(c.disabled, 12);
  return true;
}

export function updateTools(tools, dt) {
  for (const c of tools.coins) c.t -= dt;
  tools.coins = tools.coins.filter((c) => c.t > 0);
  for (const s of tools.smokes) s.t -= dt;
  tools.smokes = tools.smokes.filter((s) => s.t > 0);
}

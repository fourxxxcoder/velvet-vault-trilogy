// Tiny WebAudio synth: no audio files, no network. Short blips for pickup,
// coin, smoke, EMP, alarm, crack tumblers, caught and the getaway.
export function makeAudio() {
  const a = { ctx: null, muted: false };
  return a;
}

function ctx(a) {
  if (!a.ctx) {
    try {
      a.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (a.ctx.state === 'suspended') a.ctx.resume();
  return a.ctx;
}

function tone(a, freq, dur, type, vol, slideTo) {
  if (a.muted) return;
  const c = ctx(a);
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.12, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export const sfx = {
  pickup(a) { tone(a, 880, 0.09, 'sine', 0.1); tone(a, 1320, 0.12, 'sine', 0.08); },
  coin(a) { tone(a, 1560, 0.07, 'triangle', 0.1); },
  smoke(a) { tone(a, 300, 0.25, 'sine', 0.08, 120); },
  emp(a) { tone(a, 1200, 0.3, 'sawtooth', 0.07, 120); },
  alarm(a) { tone(a, 620, 0.16, 'square', 0.06); tone(a, 460, 0.16, 'square', 0.06); },
  tumbler(a) { tone(a, 1040, 0.1, 'triangle', 0.12); },
  rattle(a) { tone(a, 180, 0.2, 'sawtooth', 0.1, 90); },
  vault(a) { tone(a, 523, 0.12, 'sine', 0.1); tone(a, 659, 0.12, 'sine', 0.1); tone(a, 784, 0.2, 'sine', 0.1); },
  caught(a) { tone(a, 220, 0.4, 'sawtooth', 0.12, 55); },
  win(a) { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(a, f, 0.22, 'sine', 0.1), i * 110)); },
};

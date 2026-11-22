// Keyboard + mouse. WASD/arrows move, Shift sneaks, Q or click throws a
// coin lure, E pops smoke, F fires the EMP, Space starts the game and cracks
// the safe, P pauses, M mutes, 1/2/3 pick a heist on the title screen.
export function makeInput() {
  return {
    keys: new Set(),
    pressed: new Set(), // keys pressed since last consume (edge-triggered)
    mouse: { x: 0, y: 0, clicked: false },
  };
}

export function attachInput(input, canvas) {
  const down = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) input.pressed.add(e.code);
    input.keys.add(e.code);
  };
  const up = (e) => input.keys.delete(e.code);
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    input.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    input.mouse.clicked = true;
  });
  window.addEventListener('blur', () => input.keys.clear());
}

export function consumePress(input, code) {
  if (input.pressed.has(code)) {
    input.pressed.delete(code);
    return true;
  }
  return false;
}

export function endFrame(input) {
  input.pressed.clear();
  input.mouse.clicked = false;
}

export function moveVector(input) {
  let x = 0, y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

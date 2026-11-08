// VL10-M6: Newton's three laws on two real set-ups.
//  'N2' (law 2 and law 1): a fan cart of mass M pushed by a constant thrust F: a = F/M. Switch the fan off and, with no
//       net force, the cart keeps its velocity (law 1).
//  'N3' (law 3): two carts with a spring plunger between them. During the push each cart feels a force of the same size
//       and opposite direction; the force sensors read the same number; the accelerations are inversely proportional to the masses.
// Everything on screen reads from this one state.
export const T_MAX = 10; // s of a run
export const DT_C = 0.2; // s, duration of the push in N3
export const RANGE = {F: [0, 10], M: [1, 10], F0: [10, 50], M1: [1, 5], M2: [1, 5]};
export const PRESETS = [
  {id: 'a', vi: 'Định luật 2: F = 4 N, M = 2 kg', note: 'a = F/M = 2 m/s²', mode: 'N2', F: 4, M: 2},
  {id: 'b', vi: 'Định luật 2: gấp đôi khối lượng', note: 'F = 4 N, M = 4 kg → a = 1 m/s²', mode: 'N2', F: 4, M: 4},
  {id: 'c', vi: 'Định luật 3: xe 1 kg đẩy xe 2 kg', note: 'cùng lực, ngược chiều; a₁ = 2·a₂', mode: 'N3', M1: 1, M2: 2, F0: 20},
];

export function createModel() {
  return {mode: 'N2', speed: 1, F: 4, M: 2, fan: true, run: false, t: 0, x: 0, v: 0,
    M1: 1, M2: 2, F0: 20, c: {x1: -0.65, x2: 0.65, v1: 0, v2: 0, t: 0, phase: 'ready', tc: 0}};
}
export function reset(s) { s.run = false; s.t = 0; s.x = 0; s.v = 0; s.fan = s.F > 0; s.c = {x1: -0.65, x2: 0.65, v1: 0, v2: 0, t: 0, phase: 'ready', tc: 0}; }
export const thrust = (s) => (s.fan ? s.F : 0);

export function step(s, dt) {
  if (s.mode === 'N2') {
    if (!s.run) return;
    const a = thrust(s) / s.M; s.x += s.v * dt + 0.5 * a * dt * dt; s.v += a * dt; s.t += dt;
    if (s.t >= T_MAX) { s.t = T_MAX; s.run = false; }
  } else {
    const c = s.c; if (c.phase === 'ready') return;
    const a1 = c.phase === 'contact' ? -s.F0 / s.M1 : 0, a2 = c.phase === 'contact' ? s.F0 / s.M2 : 0;
    c.x1 += c.v1 * dt + 0.5 * a1 * dt * dt; c.x2 += c.v2 * dt + 0.5 * a2 * dt * dt; c.v1 += a1 * dt; c.v2 += a2 * dt; c.t += dt;
    if (c.phase === 'contact') { c.tc += dt; if (c.tc >= DT_C - 1e-9) { c.phase = 'free'; c.tc = DT_C; } }
    if (c.t >= T_MAX) c.phase = 'done';
  }
}
export function advance(s, dt) { let left = Math.min(dt * s.speed, 0.2); while (left > 1e-9) { const h = Math.min(left, 1 / 240); step(s, h); left -= h; } }
export function fire(s) { if (s.mode === 'N3' && s.c.phase === 'ready') s.c.phase = 'contact'; }

/** Values the panels show. N2: a, Fnet. N3: the two sensor readings and both momenta. */
export function readout(s) {
  if (s.mode === 'N2') {
    const F = thrust(s), a = F / s.M;
    return {mode: 'N2', F, Fcmd: s.F, M: s.M, a, v: s.v, x: s.x, t: s.t, Fnet: F, fan: s.fan, law1: F === 0 && Math.abs(s.v) > 1e-9, kind: F === 0 ? (Math.abs(s.v) > 1e-9 ? 'thẳng đều (hợp lực = 0)' : 'đứng yên') : 'nhanh dần đều'};
  }
  const c = s.c, f = c.phase === 'contact' ? s.F0 : 0;
  return {mode: 'N3', phase: c.phase, f, F0: s.F0, M1: s.M1, M2: s.M2, a1: -f / s.M1, a2: f / s.M2, v1: c.v1, v2: c.v2, x1: c.x1, x2: c.x2, t: c.t,
    p1: s.M1 * c.v1, p2: s.M2 * c.v2, p: s.M1 * c.v1 + s.M2 * c.v2, impulse: s.F0 * DT_C};
}
/** settled answers for the lesson (do not depend on the frame rate) */
export const ideal = {
  a: (F, M) => F / M,
  v1: (F0, M1) => (F0 * DT_C) / M1,
  v2: (F0, M2) => (F0 * DT_C) / M2,
};

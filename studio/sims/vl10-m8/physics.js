// VL10-M8: two classic dynamics set-ups (massless string, frictionless light pulley, no friction on the table).
//  'A' Atwood machine:        a = (m2 − m1)·g/(m1 + m2),  T = 2·m1·m2·g/(m1 + m2)
//  'C' cart on a table pulled by a hanging mass m:  a = m·g/(M + m),  T = M·m·g/(M + m)
// One state (t) drives the masses, the string, the force arrows and every number.
export const G = 9.8;
export const SMAX = 1.0; // m, travel before a stop catches the masses
export const RANGE = {m1: [0.1, 1], m2: [0.1, 1], M: [0.2, 2], m: [0.05, 0.5]};
export const PRESETS = [
  {id: 'a', vi: 'Atwood: 200 g và 300 g', note: 'a = (m₂ − m₁)g/(m₁ + m₂) ≈ 1,96 m/s²', mode: 'A', m1: 0.2, m2: 0.3},
  {id: 'b', vi: 'Atwood: hai khối bằng nhau', note: 'cân bằng: a = 0 và T = mg', mode: 'A', m1: 0.3, m2: 0.3},
  {id: 'c', vi: 'Xe 1 kg kéo bởi quả cân 200 g', note: 'a = mg/(M + m) ≈ 1,63 m/s²', mode: 'C', M: 1, m: 0.2},
];
export const createModel = () => ({mode: 'A', m1: 0.2, m2: 0.3, M: 1, m: 0.2, t: 0, running: false, speed: 0.5, stopped: false});
export function dyn(s) {
  if (s.mode === 'A') { const a = ((s.m2 - s.m1) * G) / (s.m1 + s.m2), T = (2 * s.m1 * s.m2 * G) / (s.m1 + s.m2); return {a, T, F1: s.m1 * G, F2: s.m2 * G}; }
  const a = (s.m * G) / (s.M + s.m), T = (s.M * s.m * G) / (s.M + s.m); return {a, T, F1: s.m * G, F2: 0};
}
export function reset(s) { s.t = 0; s.running = false; s.stopped = false; }
export const tStop = (s) => { const a = Math.abs(dyn(s).a); return a < 1e-9 ? Infinity : Math.sqrt((2 * SMAX) / a); };
export function advance(s, dt) {
  if (!s.running) return; const ts = tStop(s); s.t = Math.min(ts, s.t + Math.min(dt * s.speed, 0.25)); if (s.t >= ts - 1e-12) { s.running = false; s.stopped = true; } else if (!isFinite(ts) && s.t > 20) s.running = false;
}
export function readout(s) {
  const d = dyn(s), a = d.a, t = s.t, v = a * t, dist = 0.5 * a * t * t;
  return {mode: s.mode, ...d, t, v, s: dist, dir: Math.sign(a), balanced: Math.abs(a) < 1e-9, stopped: s.stopped, aExp: s.stopped && t > 0 ? (2 * Math.abs(dist)) / (t * t) : null, ts: tStop(s),
    m1: s.m1, m2: s.m2, M: s.M, m: s.m, heavier: s.m2 > s.m1 ? 2 : s.m1 > s.m2 ? 1 : 0, mg: (s.mode === 'A' ? Math.max(s.m1, s.m2) : s.m) * G, total: s.mode === 'A' ? s.m1 + s.m2 : s.M + s.m};
}
export const ideal = {
  aA: (m1, m2) => ((m2 - m1) * G) / (m1 + m2), TA: (m1, m2) => (2 * m1 * m2 * G) / (m1 + m2), aC: (M, m) => (m * G) / (M + m), TC: (M, m) => (M * m * G) / (M + m),
};

// W5: standing waves on a string fixed at x = L and driven at x = 0 (small amplitude a0), with light damping (Q = 40).
// Steady state: U(x) = a0·sin(k*(L−x))/sin(k*L), k* = k·(1 − i/(2Q)), k = 2πf/v, u(x,t) = Re{U(x)·e^{iωt}}.
// It splits exactly into an incident wave (→) and a reflected wave (←); the nodes stay at x = L − mλ/2.
export const MU = 0.1, G = 9.8, Q = 40, LMIN = 1, LMAX = 2.5, F_RANGE = [0.5, 12], M_RANGE = [0.05, 0.5];
export const PRESETS = [
  {id: 'a', vi: 'Dây 1,5 m, treo 200 g', note: 'v ≈ 4,4 m/s, f₁ ≈ 1,5 Hz', L: 1.5, mass: 0.2, f: 1},
  {id: 'b', vi: 'Cộng hưởng bậc 2 (2 bụng)', note: 'f = 2f₁', L: 1.5, mass: 0.2, f: 'n2'},
  {id: 'c', vi: 'Cộng hưởng bậc 3 (3 bụng)', note: 'f = 3f₁', L: 1.5, mass: 0.2, f: 'n3'},
];
export const createModel = () => ({f: 1, L: 1.5, mass: 0.2, a0: 0.006, t: 0, speed: 1, frozen: false, showComp: false, showNodes: true});
export const speedOf = (s) => Math.sqrt((s.mass * G) / MU);
export const fn = (s, n) => (n * speedOf(s)) / (2 * s.L);
// small complex helpers
const C = (re, im = 0) => ({re, im}), cmul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const csin = (z) => C(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im)), cexp = (z) => { const m = Math.exp(z.re); return C(m * Math.cos(z.im), m * Math.sin(z.im)); };
function parts(s, x, f = s.f) {
  const v = speedOf(s), k = (2 * Math.PI * f) / v, ks = C(k, -k / (2 * Q)), den = csin(C(ks.re * s.L, ks.im * s.L)), a0 = C(s.a0);
  const tot = cdiv(cmul(a0, csin(C(ks.re * (s.L - x), ks.im * (s.L - x)))), den);
  // incident: a0/(2i sin(k*L)) e^{ik*(L−x)}; reflected: −a0/(2i sin(k*L)) e^{−ik*(L−x)}
  const pre = cdiv(a0, cmul(C(0, 2), den)), e1 = cexp(C(-ks.im * (s.L - x) * 1 + 0, ks.re * (s.L - x))), e2 = cexp(C(ks.im * (s.L - x), -ks.re * (s.L - x)));
  // e^{i k* d} with k* = kr + i ki → exp(−ki·d)·e^{i kr d};  e^{−i k* d} → exp(ki·d)·e^{−i kr d}
  const inc = cmul(pre, C(e1.re, e1.im)), ref = cmul(C(-pre.re, -pre.im), C(e2.re, e2.im));
  return {tot, inc, ref};
}
const at = (c, w) => c.re * Math.cos(w) - c.im * Math.sin(w);
export function shape(s, x, t = s.t) { const w = 2 * Math.PI * s.f * t, p = parts(s, x); return {u: at(p.tot, w), inc: at(p.inc, w), ref: at(p.ref, w), amp: Math.hypot(p.tot.re, p.tot.im)}; }
export function ampMax(s, f = s.f) { let m = 0; for (let i = 0; i <= 80; i++) { const p = parts(s, (i / 80) * s.L, f).tot; m = Math.max(m, Math.hypot(p.re, p.im)); } return m; }
export function advance(s, dt) { if (!s.frozen) s.t += Math.min(dt, 0.1) * s.speed; }
export function readout(s) {
  const v = speedOf(s), lam = v / s.f, T = s.mass * G, nReal = (2 * s.L * s.f) / v, nNear = Math.max(1, Math.round(nReal)), near = Math.abs(nReal - nNear) / nNear < 0.04, am = ampMax(s);
  const nodes = [], anti = []; for (let m = 0; L2(s, m, lam) >= -1e-9; m++) { nodes.push(s.L - (m * lam) / 2); if (s.L - ((m + 0.5) * lam) / 2 >= -1e-9) anti.push(s.L - ((m + 0.5) * lam) / 2); }
  return {f: s.f, v, lam, T, L: s.L, mass: s.mass, nReal, n: near ? nNear : 0, nNear, near, f1: fn(s, 1), fnNear: fn(s, nNear), ampMax: am, gain: am / s.a0, nodes: nodes.sort((a, b) => a - b), anti: anti.sort((a, b) => a - b), a0: s.a0, t: s.t, frozen: s.frozen};
}
const L2 = (s, m, lam) => s.L - (m * lam) / 2;
export const ideal = {v: (m) => Math.sqrt((m * G) / MU), fn: (n, L, m) => (n * Math.sqrt((m * G) / MU)) / (2 * L), lam: (n, L) => (2 * L) / n};

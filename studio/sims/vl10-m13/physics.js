// VL10-M13: Hooke's law. A spring hangs from a stand; n slotted weights of 100 g are added to the hanger (hanger mass neglected).
//   F = m·g (weight) ; Δl = F/k while F <= F_lim (elastic) ; beyond the limit the spring is permanently stretched.
// Loading curve: slope k up to x_lim = F_lim/k, then slope k/2. Unloading line: slope k from (x_max, Fs(x_max)) down to the permanent set p.
export const G = 9.8, M_W = 0.1, L0 = 0.2, N_MAX = 10;
export const SPRINGS = [
  {id: 'A', vi: 'Lò xo A (mềm)', k: 20, Flim: 6},
  {id: 'B', vi: 'Lò xo B (trung bình)', k: 50, Flim: 9},
  {id: 'C', vi: 'Lò xo C (cứng)', k: 100, Flim: 20},
];
export const PRESETS = [
  {id: 'a', vi: 'Lò xo A, treo 3 quả nặng', note: 'F = 2,94 N → Δl = 14,7 cm', sp: 0, n: 3},
  {id: 'b', vi: 'Lò xo C cứng, cùng 3 quả nặng', note: 'k lớn → giãn ít hơn: Δl = 2,9 cm', sp: 2, n: 3},
  {id: 'c', vi: 'Quá tải lò xo A', note: '8 quả nặng: F = 7,84 N > 6 N (quá giới hạn)', sp: 0, n: 8},
];
export const createModel = () => ({sp: 0, n: 0, x: 0, v: 0, xmax: 0, rows: [], t: 0, speed: 1, running: true, zeta: 1});
const spr = (s) => SPRINGS[s.sp];
const xlim = (k) => spr(k).Flim / spr(k).k;
export const kOf = (s) => spr(s).k;
export const FlimOf = (s) => spr(s).Flim;
/** restoring force at extension x given the max extension reached so far */
export function Fs(s, x, xmax = s.xmax) {
  const sp = spr(s), k = sp.k, xl = sp.Flim / k, load = (y) => (y <= xl ? k * y : sp.Flim + (k / 2) * (y - xl));
  const top = Math.max(xmax, x), Ftop = load(top), p = top - Ftop / k;
  if (x >= top - 1e-12) return load(x);
  return Math.max(0, k * (x - p));
}
export const permSet = (s) => { const sp = spr(s), k = sp.k, xl = sp.Flim / k, xm = s.xmax, Fm = xm <= xl ? k * xm : sp.Flim + (k / 2) * (xm - xl); return xm - Fm / k; };
export const mass = (s) => s.n * M_W;
export const weight = (s) => mass(s) * G;
/** static equilibrium extension with load F (taking the history into account) */
export function eqExt(s, F) {
  const sp = spr(s), k = sp.k, xl = sp.Flim / k, p = permSet(s), Fm = s.xmax <= xl ? k * s.xmax : sp.Flim + (k / 2) * (s.xmax - xl);
  if (F >= Fm - 1e-12) return F <= sp.Flim ? F / k : xl + (F - sp.Flim) / (k / 2);
  return p + F / k;
}
export function reset(s) { s.x = 0; s.v = 0; s.xmax = 0; s.t = 0; }
export function snap(s) { s.x = eqExt(s, weight(s)); s.v = 0; s.xmax = Math.max(s.xmax, s.x); }
export function record(s) { const F = weight(s), dl = eqExt(s, F); if (s.n > 0) s.rows.push({n: s.n, m: mass(s), F, dl}); }
export function advance(s, dt) {
  if (!s.running) return; let h = Math.min(dt * s.speed, 0.1); const m = Math.max(mass(s), 0.02), k = kOf(s), c = 2 * s.zeta * Math.sqrt(k * m);
  while (h > 0) { const e = Math.min(h, 0.002); const F = weight(s) - Fs(s, s.x) - c * s.v; s.v += (F / m) * e; s.x += s.v * e; if (s.x < 0) { s.x = 0; s.v = Math.max(0, s.v); } s.xmax = Math.max(s.xmax, s.x); h -= e; }
  s.t += dt * s.speed;
}
export function readout(s) {
  const F = weight(s), x = s.x, xeq = eqExt(s, F), sp = spr(s), p = permSet(s), over = s.xmax > sp.Flim / sp.k + 1e-6;
  return {n: s.n, m: mass(s), F, x, xeq, k: sp.k, Flim: sp.Flim, xlim: sp.Flim / sp.k, p, over, kest: x > 1e-4 ? F / x : sp.k, Fs: Fs(s, x), len: L0 + x, settled: Math.abs(x - xeq) < 5e-4 && Math.abs(s.v) < 0.01, rows: s.rows};
}
export const ideal = {F: (n) => n * M_W * G, dl: (n, sp) => (n * M_W * G) / SPRINGS[sp].k};

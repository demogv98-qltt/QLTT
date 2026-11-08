// VL10-M15: errors of a measurement. Timing n oscillations of a simple pendulum with a hand-held stopwatch, then measuring g = 4π²l/T².
//   mean t̄ = Σt/N ; absolute error of each reading Δt_i = |t_i − t̄| ; random error = mean of Δt_i ; Δt = random + instrument error
//   relative error δ = Δt/t̄ ; for a quotient/power g = 4π²·l/T²: δg = δl + 2·δT
export const G_TRUE = 9.8, SIGMA = 0.085, DT_DC = 0.005, DL_DC = 0.0005, THETA0 = 6 * Math.PI / 180;
export const N_CHOICES = [1, 5, 10, 20];
export const PRESETS = [
  {id: 'a', vi: 'Đo 1 dao động, 5 lần', note: 'sai số tỉ đối lớn (khoảng 2–4%)', l: 1, n: 1, k: 5},
  {id: 'b', vi: 'Đo 10 dao động, 5 lần', note: 'cùng đồng hồ nhưng sai số tỉ đối nhỏ hơn', l: 1, n: 10, k: 5},
  {id: 'c', vi: 'Đo 20 dao động, 10 lần', note: 'g gần 9,8 hơn, sai số bé nhất', l: 1, n: 20, k: 10},
];
export const createModel = () => ({l: 1, n: 1, rows: [], seed: 20250611, t: 0, speed: 1, show: false, last: null, running: true});
export const Ttrue = (s) => 2 * Math.PI * Math.sqrt(s.l / G_TRUE);
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
/** one hand-timed measurement of n oscillations: true time plus the reaction-time error, read to 0.01 s */
export function measure(s) {
  const r = rng(s.seed + s.rows.length * 7919 + s.n * 104729 + Math.round(s.l * 1000) * 31); r(); r();
  const t = Math.round((s.n * Ttrue(s) + gauss(r) * SIGMA) * 100) / 100; s.rows.push(t); s.last = t; return t;
}
export function clearRows(s) { s.rows = []; s.show = false; s.last = null; }
export function stats(s) {
  const N = s.rows.length; if (!N) return null; const n = s.n, mean = s.rows.reduce((a, b) => a + b, 0) / N, dev = s.rows.map((t) => Math.abs(t - mean)), dng = dev.reduce((a, b) => a + b, 0) / N, dt = dng + DT_DC;
  const T = mean / n, dT = dt / n, dltT = dt / mean, dl = DL_DC / s.l, g = (4 * Math.PI * Math.PI * s.l) / (T * T), dg = dl + 2 * dltT;
  return {N, n, mean, dev, dng, dt, T, dT, dltT, dl, g, dgRel: dg, dgAbs: dg * g, inside: Math.abs(g - G_TRUE) <= dg * g};
}
export function advance(s, dt) { s.t += dt * s.speed; }
export const phase = (s) => THETA0 * Math.cos((2 * Math.PI * s.t) / Ttrue(s));
export function readout(s) { const st = stats(s); return {l: s.l, n: s.n, T: Ttrue(s), theta: phase(s), rows: s.rows, st, last: s.last, show: s.show}; }

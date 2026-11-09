// W4: interference of two coherent point sources on water.  u(x,z,t) = Σ cos(ωt − k·r_i + φ_i), present where v·t ≥ r_i.
// Amplitude at a point = 2A|cos(Δψ/2)| with Δψ = k(r2 − r1) + (φ1 − φ2). Maxima: Δψ = 2πm, i.e. (r2 − r1)/λ − off = m (off = 0 in phase, 1/2 in antiphase).
export const TANK = {X: 0.8, Z: 0.5}, F_RANGE = [1, 3.5], V_RANGE = [0.2, 0.45], A_RANGE = [0.15, 0.5];
export const PRESETS = [
  {id: 'a', vi: 'Hai nguồn cùng pha', note: 'f = 3 Hz, v = 0,3 m/s → λ = 10 cm, a = 35 cm', f: 3, v: 0.3, a: 0.35, opp: false, xM: 0.2, zM: 0.3},
  {id: 'b', vi: 'Hai nguồn ngược pha', note: 'đường trung trực trở thành cực tiểu', f: 3, v: 0.3, a: 0.35, opp: true, xM: 0.2, zM: 0.3},
  {id: 'c', vi: 'Bước sóng ngắn hơn', note: 'f = 4 Hz → nhiều cực đại hơn', f: 3.5, v: 0.25, a: 0.35, opp: false, xM: 0.2, zM: 0.3},
];
export const createModel = () => ({f: 3, v: 0.3, a: 0.35, opp: false, xM: 0.2, zM: 0.3, t: 0, speed: 1, frozen: false, lines: true, ampMode: false});
export const lambda = (s) => s.v / s.f;
export const src = (s) => [{x: -s.a / 2, z: 0}, {x: s.a / 2, z: 0}];
export const dist = (s, x, z, i) => { const p = src(s)[i]; return Math.hypot(x - p.x, z - p.z); };
const ph = (s, i) => (i === 1 && s.opp ? Math.PI : 0);
export function comp(s, x, z, t, i) { const r = dist(s, x, z, i); return t * s.v >= r ? Math.cos(2 * Math.PI * s.f * t - ((2 * Math.PI) / lambda(s)) * r + ph(s, i)) : 0; }
export const u = (s, x, z, t = s.t) => comp(s, x, z, t, 0) + comp(s, x, z, t, 1);
export function advance(s, dt) { if (!s.frozen) s.t += Math.min(dt, 0.1) * s.speed; }
export const restart = (s) => { s.t = 0; };
/** relative amplitude |cos(Δψ/2)| (1 = maximum, 0 = no motion) once both waves have arrived */
export function ampRatio(s, x, z) { const k = (2 * Math.PI) / lambda(s), dpsi = k * (dist(s, x, z, 1) - dist(s, x, z, 0)) + (0 - ph(s, 1)); return Math.abs(Math.cos(dpsi / 2)); }
export function countOnSegment(s) {
  const lam = lambda(s), off = s.opp ? 0.5 : 0; let nMax = 0, nMin = 0;
  for (let m = -40; m <= 40; m++) { if (Math.abs((m + off) * lam) < s.a - 1e-9) nMax++; if (Math.abs((m + 0.5 + off) * lam) < s.a - 1e-9) nMin++; }
  return {nMax, nMin};
}
export function readout(s) {
  const lam = lambda(s), T = 1 / s.f, r1 = dist(s, s.xM, s.zM, 0), r2 = dist(s, s.xM, s.zM, 1), dd = r2 - r1, off = s.opp ? 0.5 : 0, q = dd / lam - off, m = Math.round(q), frac = Math.abs(q - m);
  const both = s.t * s.v >= Math.max(r1, r2), kind = frac < 0.06 ? 'max' : Math.abs(frac - 0.5) < 0.06 ? 'min' : 'mid';
  return {lam, T, f: s.f, v: s.v, a: s.a, opp: s.opp, r1, r2, dd, ddLam: dd / lam, q, order: kind === 'max' ? m : Math.floor(q), kind, ratio: ampRatio(s, s.xM, s.zM), ...countOnSegment(s), uM: u(s, s.xM, s.zM), u1: comp(s, s.xM, s.zM, s.t, 0), u2: comp(s, s.xM, s.zM, s.t, 1), t: s.t, both, aOverLam: s.a / lam, frozen: s.frozen};
}
export const ideal = {lam: (v, f) => v / f, dd: (r1, r2) => r2 - r1};

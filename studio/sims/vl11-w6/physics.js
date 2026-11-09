// W6: resonance tube. Air column of length l (open end at the top, water surface at the bottom: displacement node).
//   v = 331 + 0.6·t ; λ = v/f ; resonance when l + e = (2n − 1)·λ/4, e = 0.6·r ; loudness I = 1/(1 + ((l − l_n)/(0.04·λ))²).
export const LT = 1.0, RT = 0.02, E_CORR = 0.6 * RT, DL = 0.005; // tube length (m), tube radius, end correction, reading uncertainty (m)
export const F_RANGE = [256, 640], T_RANGE = [0, 40], FORKS = [256, 320, 384, 480, 512, 640];
export const PRESETS = [
  {id: 'a', vi: 'Âm thoa 512 Hz, 20 °C', note: 'λ ≈ 67 cm → l₁ ≈ 15,5 cm, l₂ ≈ 49 cm', f: 512, T: 20, l: 30},
  {id: 'b', vi: 'Âm thoa 384 Hz, 20 °C', note: 'λ ≈ 89 cm → chỉ vừa đủ hai cực đại', f: 384, T: 20, l: 30},
  {id: 'c', vi: 'Trời nóng 35 °C, 512 Hz', note: 'v tăng → λ dài hơn, cực đại dịch xuống', f: 512, T: 35, l: 30},
];
export const createModel = () => ({f: 512, T: 20, l: 0.3, t: 0, speed: 1, cur: {f: null, l1: null, l2: null}, trials: []});
export const vTrue = (s) => 331 + 0.6 * s.T;
export const lambda = (s) => vTrue(s) / s.f;
export const lres = (s, n) => ((2 * n - 1) * lambda(s)) / 4 - E_CORR;
export function resonances(s) { const out = []; for (let n = 1; n <= 8; n++) { const l = lres(s, n); if (l > 0 && l <= LT) out.push({n, l}); } return out; }
export function loud(s, l = s.l) { let best = 0; for (const r of resonances(s)) { const d = (l - r.l) / (0.04 * lambda(s)); best = Math.max(best, 1 / (1 + d * d)); } return best; }
export function nearest(s, l = s.l) { let b = null; for (const r of resonances(s)) if (!b || Math.abs(l - r.l) < Math.abs(l - b.l)) b = r; return b; }
export function advance(s, dt) { s.t += Math.min(dt, 0.1) * s.speed; }
export function recordL1(s) { s.cur.f = s.f; s.cur.l1 = Math.round(s.l * 1000) / 10; }
export function recordL2(s) { if (s.cur.f !== s.f) s.cur.f = s.f; s.cur.l2 = Math.round(s.l * 1000) / 10; if (s.cur.l1 != null) { s.trials.push({f: s.cur.f, l1: s.cur.l1, l2: s.cur.l2}); s.cur = {f: null, l1: null, l2: null}; } }
export const clearTrials = (s) => { s.trials = []; s.cur = {f: null, l1: null, l2: null}; };
export function stats(s) {
  const rows = s.trials.map((q) => { const d = (q.l2 - q.l1) / 100, v = 2 * q.f * d, dv = v * ((2 * DL) / Math.abs(d)); return {...q, d, v, dv}; });
  if (!rows.length) return null; const vm = rows.reduce((a, q) => a + q.v, 0) / rows.length, dvm = Math.max(rows.reduce((a, q) => a + Math.abs(q.v - vm), 0) / rows.length, rows.reduce((a, q) => a + q.dv, 0) / rows.length);
  return {rows, vm, dvm, rel: dvm / vm, inside: Math.abs(vm - vTrue(s)) <= dvm + 1e-9};
}
export function readout(s) {
  const lam = lambda(s), rs = resonances(s), nr = nearest(s), I = loud(s);
  return {f: s.f, T: s.T, v: vTrue(s), lam, l: s.l, lcm: s.l * 100, I, res: rs, nearest: nr, onRes: I > 0.9, n: I > 0.9 && nr ? nr.n : 0, e: E_CORR, st: stats(s), cur: s.cur, t: s.t, lamQuarter: lam / 4};
}
export const ideal = {v: (T) => 331 + 0.6 * T, lam: (v, f) => v / f, dl: (lam) => lam / 2, vm: (f, l1, l2) => 2 * f * (l2 - l1)};

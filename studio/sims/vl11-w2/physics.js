// W2: a travelling wave on a long spring (transverse: rings move in z; longitudinal: rings move in x) and the intensity of a point source.
//   u(x,t) = A·sin(2πft − kx) once the wave has arrived (t ≥ x/v);  I = P/(4πr²) for a point source in free space.
export const L = 4.5, N = 61, D0 = L / (N - 1), A_RANGE = [0.01, 0.1], F_RANGE = [0.5, 2.5], V_RANGE = [0.8, 3], P_RANGE = [0.1, 2], R_RANGE = [0.5, 3];
export const AL_MAX = 0.03;
export const PRESETS = [
  {id: 'a', vi: 'Sóng ngang trên lò xo', note: 'f = 1 Hz, v = 2 m/s, λ = 2 m', mode: 'T', A: 0.06, f: 1, v: 2, xP: 1.5},
  {id: 'b', vi: 'Sóng dọc trên lò xo', note: 'cùng f, v: vòng dao động dọc theo lò xo', mode: 'L', A: 0.03, f: 1, v: 2, xP: 1.5},
  {id: 'c', vi: 'Cường độ sóng của loa', note: 'P = 0,5 W, r = 1 m → I = 0,040 W/m²', mode: 'I', P: 0.5, r: 1},
];
export const createModel = () => ({mode: 'T', A: 0.06, f: 1, v: 2, xP: 1.5, P: 0.5, r: 1, t: 0, speed: 1, frozen: false});
export const lambda = (s) => s.v / s.f;
const amp = (s) => (s.mode === 'L' ? Math.min(s.A, AL_MAX) : s.A);
export const u = (s, x, t = s.t) => (t >= x / s.v ? amp(s) * Math.sin(2 * Math.PI * s.f * t - ((2 * Math.PI) / lambda(s)) * x) : 0);
/** local density of rings relative to the rest state (longitudinal wave): 1/(1 + du/dx) − 1 */
export const dens = (s, x, t = s.t) => { if (t < x / s.v) return 0; const k = (2 * Math.PI) / lambda(s), du = -k * amp(s) * Math.cos(2 * Math.PI * s.f * t - k * x); return 1 / (1 + du) - 1; };
export const restart = (s) => { s.t = 0; };
export function advance(s, dt) { if (!s.frozen) s.t += Math.min(dt, 0.1) * s.speed; }
export const area = (r) => 4 * Math.PI * r * r;
export const Iof = (P, r) => P / area(r);
export function readout(s) {
  const lam = lambda(s), T = 1 / s.f, w = 2 * Math.PI * s.f, k = (2 * Math.PI) / lam, A = amp(s), front = s.v * s.t, xmax = Math.min(L, front);
  const centers = (phase0) => { const out = []; for (let m = -8; m <= 8; m++) { const x = lam * (s.f * s.t - phase0 - m); if (x >= 0 && x <= xmax) out.push(x); } return out.sort((a, b) => a - b); };
  const nen = centers(0), dan = centers(0.5), crest = centers(0.25);
  const ip = Math.max(0, Math.min(N - 1, Math.round(s.xP / D0)));
  const r2 = 2 * s.r;
  return {mode: s.mode, A, f: s.f, v: s.v, lam, T, w, k, vmax: w * A, front, xmax, nen, dan, crest, nCompress: nen.length, uP: u(s, ip * D0), xP: ip * D0, ip, rho: dens(s, ip * D0), P: s.P, r: s.r, r2, S1: area(s.r), S2: area(r2), I1: Iof(s.P, s.r), I2: Iof(s.P, r2), ratio: Iof(s.P, s.r) / Iof(s.P, r2), t: s.t, frozen: s.frozen};
}
export const ideal = {lam: (v, f) => v / f, I: (P, r) => P / (4 * Math.PI * r * r)};

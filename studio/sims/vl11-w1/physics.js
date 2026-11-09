// W1: a travelling transverse wave on a long string, driven at x = 0 by a crank and absorbed at the far end.
//   u(x,t) = A·sin(ωt − kx) once the wave has arrived (t ≥ x/v), 0 before it; λ = v/f; k = 2π/λ; ω = 2πf
export const L = 4.5, A_RANGE = [0.02, 0.2], F_RANGE = [0.5, 2.5], V_RANGE = [0.8, 3];
export const PRESETS = [
  {id: 'a', vi: 'Sóng chậm: f = 1 Hz, v = 2 m/s', note: 'T = 1 s, λ = 2 m', A: 0.1, f: 1, v: 2, xP: 1, xQ: 2},
  {id: 'b', vi: 'Tăng tần số: f = 2 Hz', note: 'v giữ nguyên 2 m/s → λ = 1 m', A: 0.1, f: 2, v: 2, xP: 1, xQ: 1.5},
  {id: 'c', vi: 'Dây căng hơn: v = 3 m/s', note: 'f = 1 Hz → λ = 3 m', A: 0.1, f: 1, v: 3, xP: 1, xQ: 2.5},
];
export const createModel = () => ({A: 0.1, f: 1, v: 2, xP: 1, xQ: 2, t: 0, speed: 1, frozen: false});
export const lambda = (s) => s.v / s.f;
export const u = (s, x, t = s.t) => (t >= x / s.v ? s.A * Math.sin(2 * Math.PI * s.f * t - (2 * Math.PI * x) / lambda(s)) : 0);
export function restart(s) { s.t = 0; }
export function advance(s, dt) { if (!s.frozen) s.t += Math.min(dt, 0.1) * s.speed; }
export function readout(s) {
  const lam = lambda(s), T = 1 / s.f, w = 2 * Math.PI * s.f, k = (2 * Math.PI) / lam, dx = Math.abs(s.xQ - s.xP), front = s.v * s.t;
  const crests = []; for (let n = -6; n <= 6; n++) { const x = lam * (s.f * s.t - 0.25 - n); if (x >= 0 && x <= Math.min(L, front)) crests.push(x); } crests.sort((a, b) => a - b);
  return {A: s.A, f: s.f, v: s.v, lam, T, w, k, vmax: w * s.A, dx, dphi: k * dx, dphiMod: (k * dx) % (2 * Math.PI), nWaves: dx / lam, t: s.t, front, uP: u(s, s.xP), uQ: u(s, s.xQ), crests, xP: s.xP, xQ: s.xQ, frozen: s.frozen,
    inPhase: Math.abs(Math.round(dx / lam) - dx / lam) < 0.03, opposite: Math.abs(((dx / lam) % 1) - 0.5) < 0.03};
}
export const ideal = {lam: (v, f) => v / f, T: (f) => 1 / f, vmax: (f, A) => 2 * Math.PI * f * A, dphi: (dx, lam) => (2 * Math.PI * dx) / lam};

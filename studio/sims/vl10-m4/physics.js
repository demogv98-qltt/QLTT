// VL10-M4: projectile motion (no air drag). A spring gun fires a ball from height h0 at angle α with speed v0.
//   x = v0·cosα·t ; y = h0 + v0·sinα·t − ½·g·t² ; the target (a bucket) sits at distance D.
// Exact (analytic) kinematics; everything on screen (ball, strobes, arrows, graphs, numbers) reads from this one state.
export const G = 9.8, D2R = Math.PI / 180;
export const SPRING = {m: 0.05, k: 200}; // kg, N/m: compression = v0·√(m/k)
export const RANGE = {alpha: [0, 80], v0: [2, 15], h0: [0, 2], D: [3, 25]};
export const PRESETS = [
  {id: 'a', vi: 'Ném ngang từ độ cao 2 m', note: 'v₀ = 6 m/s: tầm xa = v₀·√(2h/g)', alpha: 0, v0: 6, h0: 2, D: 5},
  {id: 'b', vi: 'Ném xiên 45°', note: 'v₀ = 10 m/s: tầm xa lớn nhất', alpha: 45, v0: 10, h0: 0, D: 10},
  {id: 'c', vi: 'Hai góc phụ nhau', note: '30° và 60° cho cùng tầm xa', alpha: 30, v0: 10, h0: 0, D: 8.8, comp: true},
];
export const createModel = () => ({alpha: 45, v0: 10, h0: 0, D: 8, fired: false, t: 0, speed: 0.5, comp: false, pred: false, hit: null, landed: false});
export const flight = (alpha, v0, h0) => { const vy0 = v0 * Math.sin(alpha * D2R); return (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * h0)) / G; };
export const pos = (alpha, v0, h0, t) => ({x: v0 * Math.cos(alpha * D2R) * t, y: h0 + v0 * Math.sin(alpha * D2R) * t - 0.5 * G * t * t, vx: v0 * Math.cos(alpha * D2R), vy: v0 * Math.sin(alpha * D2R) - G * t});
export function reset(s) { s.fired = false; s.t = 0; s.hit = null; s.landed = false; }
export function advance(s, dt) {
  if (!s.fired || s.landed) return; const tl = flight(s.alpha, s.v0, s.h0);
  s.t = Math.min(tl, s.t + Math.min(dt * s.speed, 0.25)); if (s.t >= tl - 1e-12) { s.landed = true; const L = pos(s.alpha, s.v0, s.h0, tl).x; s.hit = Math.abs(L - s.D) <= 0.3; }
}
export function readout(s) {
  const tl = flight(s.alpha, s.v0, s.h0), p = pos(s.alpha, s.v0, s.h0, s.t), a = s.alpha * D2R, vy0 = s.v0 * Math.sin(a), tTop = Math.max(0, vy0 / G);
  const L = pos(s.alpha, s.v0, s.h0, tl).x, H = s.h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * G) : 0), comp = flight(90 - s.alpha, s.v0, s.h0);
  return {t: s.t, ...p, speed: Math.hypot(p.vx, p.vy), tFlight: tl, L, H, tTop, fired: s.fired, landed: s.landed, hit: s.hit, D: s.D, compress: s.v0 * Math.sqrt(SPRING.m / SPRING.k), E: 0.5 * SPRING.m * s.v0 * s.v0,
    Lcomp: pos(90 - s.alpha, s.v0, s.h0, comp).x, alpha: s.alpha, v0: s.v0, h0: s.h0, vx0: s.v0 * Math.cos(a), vy0};
}
export const ideal = {
  t: (h) => Math.sqrt((2 * h) / G), L: (v0, h) => v0 * Math.sqrt((2 * h) / G), Lxien: (v0, al) => (v0 * v0 * Math.sin(2 * al * D2R)) / G, Hmax: (v0, al) => (v0 * v0 * Math.sin(al * D2R) ** 2) / (2 * G),
};

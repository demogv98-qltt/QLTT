// VL10-M12: uniform circular motion on a turntable. A ball of mass m is tied by a string to a force sensor at the centre.
//   v = ω·r ; a_ht = ω²·r = v²/r (toward the centre) ; F_ht = m·ω²·r (the string tension) ; T = 2π/ω ; f = 1/T
// If the tension passes the string's limit it breaks, or you cut it: the ball then flies off along the tangent (law 1).
export const FMAX = 40; // N, breaking tension of the string
export const R_DISC = 2.2;
export const RANGE = {m: [0.1, 1], r: [0.3, 1.5], w: [0.5, 10]};
export const PRESETS = [
  {id: 'a', vi: 'Quay đều ω = 4 rad/s', note: 'r = 1 m, m = 0,5 kg → v = 4 m/s, F = 8 N', m: 0.5, r: 1, w: 4},
  {id: 'b', vi: 'Gấp đôi tốc độ góc', note: 'ω = 8 rad/s → F tăng gấp 4 lần = 32 N', m: 0.5, r: 1, w: 8},
  {id: 'c', vi: 'Quay nhanh làm đứt dây', note: 'r = 1,5 m, ω = 8 rad/s → F = 48 N > 40 N', m: 0.5, r: 1.5, w: 8},
];
export const createModel = () => ({m: 0.5, r: 1, w: 4, th: 0, t: 0, cut: false, broken: false, fly: null, running: true, speed: 1, tCut: null});
export const force = (s) => s.m * s.w * s.w * s.r;
export function reset(s) { s.th = 0; s.t = 0; s.cut = false; s.broken = false; s.fly = null; s.tCut = null; }
export function doCut(s, broken = false) { if (s.cut) return; s.cut = true; s.broken = broken; s.tCut = s.t; s.fly = {x: s.r * Math.cos(s.th), y: s.r * Math.sin(s.th), vx: -s.w * s.r * Math.sin(s.th), vy: s.w * s.r * Math.cos(s.th)}; }
export function advance(s, dt) {
  if (!s.running) return; const h = Math.min(dt * s.speed, 0.1); s.t += h; s.th += s.w * h;
  if (!s.cut && force(s) > FMAX) doCut(s, true);
  if (s.cut) { s.fly.x += s.fly.vx * h; s.fly.y += s.fly.vy * h; }
}
export function readout(s) {
  const w = s.w, v = w * s.r, a = w * w * s.r, F = s.m * a, T = (2 * Math.PI) / w, th = s.th, p = s.cut ? s.fly : {x: s.r * Math.cos(th), y: s.r * Math.sin(th), vx: -v * Math.sin(th), vy: v * Math.cos(th)};
  return {m: s.m, r: s.r, w, v, a, F, T, f: 1 / T, th, x: p.x, y: p.y, vx: p.vx, vy: p.vy, speed: Math.hypot(p.vx, p.vy), cut: s.cut, broken: s.broken, load: F / FMAX, wCrit: Math.sqrt(FMAX / (s.m * s.r)), turns: th / (2 * Math.PI), t: s.t, off: Math.hypot(p.x, p.y) > R_DISC};
}
export const ideal = {v: (w, r) => w * r, a: (w, r) => w * w * r, F: (m, w, r) => m * w * w * r, T: (w) => (2 * Math.PI) / w};

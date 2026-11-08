// VL10-M2: a test car on a straight road. One analytic model of uniformly accelerated motion; everything on screen
// (the car, the strobe copies, the arrows, both graphs, the wheel and the encoder) reads from it.
export const T_MAX = 10; // s
export const WHEEL_R = 0.3; // m
export const SLOTS = 24; // slots on the encoder disc
export const RANGE = {v0: [-10, 20], a: [-5, 5]};
export const PRESETS = [
  {id: 'p1', vi: 'Ví dụ 1: tăng tốc từ nghỉ', note: 'v₀ = 0, a = 2 → sau 5 s: v = 10 m/s, s = 25 m', v0: 0, a: 2},
  {id: 'p2', vi: 'Ví dụ 2: phanh dừng', note: 'v₀ = 10, a = −2 → dừng sau 5 s', v0: 10, a: -2},
  {id: 'p3', vi: 'Ví dụ 3: quay đầu', note: 'v₀ = 10, a = −3 → đi tới rồi quay lại', v0: 10, a: -3},
];
export const createModel = () => ({v0: 0, a: 2, t: 0, playing: false, speed: 1});
export const vAt = (s, t) => s.v0 + s.a * t;
export const dAt = (s, t) => s.v0 * t + 0.5 * s.a * t * t;
export function sAt(s, t) { // path length = ∫|v| dt
  const tz = s.a !== 0 ? -s.v0 / s.a : Infinity;
  return tz > 0 && tz < t ? Math.abs(dAt(s, tz)) + Math.abs(dAt(s, t) - dAt(s, tz)) : Math.abs(dAt(s, t));
}
export function advance(s, dt) { if (s.playing) { s.t = Math.min(T_MAX, s.t + dt * s.speed); if (s.t >= T_MAX) s.playing = false; } }
export function kind(s, t = s.t) {
  const v = vAt(s, t);
  if (s.a === 0) return s.v0 === 0 ? 'đứng yên' : 'thẳng đều';
  if (Math.abs(v) < 1e-9) return t === 0 ? 'đứng yên lúc đầu' : 'dừng tức thời';
  return v * s.a > 0 ? 'nhanh dần đều' : 'chậm dần đều';
}
/** x-range the car covers over the whole run: for the wide camera */
export function span(s) { let lo = 0, hi = 0; for (let i = 0; i <= 50; i++) { const d = dAt(s, (T_MAX * i) / 50); lo = Math.min(lo, d); hi = Math.max(hi, d); } return [lo, hi]; }
export function readout(s, t = s.t) {
  const v = vAt(s, t), d = dAt(s, t), sp = sAt(s, t);
  return {t, v, a: s.a, d, s: sp, kind: kind(s, t), v0: s.v0, wheelAng: d / WHEEL_R, pulses: Math.floor((Math.abs(d) / WHEEL_R) * SLOTS / (2 * Math.PI)),
    lhs: v * v - s.v0 * s.v0, rhs: 2 * s.a * d};
}

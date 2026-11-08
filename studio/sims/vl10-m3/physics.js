// VL10-M3: free fall in a Newton's tube. A steel ball and a feather are released together by an electromagnet.
// The drag on each is linear in speed and proportional to the air pressure p inside the tube (the pump changes p):
//   dv/dt = g − β·p·v,  with β = 0.02 s⁻¹ for the ball and 6 s⁻¹ for the feather.
// y(t) and v(t) are exact (analytic) for a constant p; p follows the pump with a lag. One state drives everything.
export const G = 9.8;
export const T_PUMP = 0.8; // s, time constant of the pump
export const OBJ = [{id: 'ball', vi: 'Bi thép', beta: 0.02}, {id: 'feather', vi: 'Lông chim', beta: 6}];
export const RANGE = {H: [0.5, 2.0]};
export const PRESETS = [
  {id: 'a', vi: 'Trong không khí', note: 'bi và lông chim: ai chạm đáy trước?', H: 2, air: true},
  {id: 'b', vi: 'Trong chân không', note: 'cả hai rơi cùng lúc, cùng gia tốc g', H: 2, air: false},
  {id: 'c', vi: 'Đo g từ độ cao 1,5 m', note: 'g = 2h/t² trong chân không', H: 1.5, air: false},
];
export const createModel = () => ({H: 2, air: true, p: 1, released: false, t: 0, speed: 1, lands: [null, null], strobePrev: 0, pMin: 1});
export const beta = (i, p) => OBJ[i].beta * p;
/** exact motion for constant β: fallen distance and speed after time t */
export function fall(b, t) { if (b < 1e-6) return {y: 0.5 * G * t * t, v: G * t}; const e = 1 - Math.exp(-b * t); return {y: (G / b) * (t - e / b), v: (G / b) * e}; }
export function landTime(b, H) { let lo = 0, hi = 10; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (fall(b, mid).y < H) lo = mid; else hi = mid; } return (lo + hi) / 2; }
export function reset(s) { s.released = false; s.t = 0; s.lands = [null, null]; s.pAtRelease = null; }
export function step(s, dt) {
  const target = s.air ? 1 : 0; s.p += (target - s.p) * (1 - Math.exp(-dt / (target === 0 ? T_PUMP : 0.25))); if (Math.abs(s.p - target) < 1e-4) s.p = target;
  if (!s.released) return;
  if (s.pAtRelease == null) s.pAtRelease = s.p;
  s.t += dt;
  for (let i = 0; i < 2; i++) if (s.lands[i] === null && fall(beta(i, s.pAtRelease), s.t).y >= s.H) s.lands[i] = landTime(beta(i, s.pAtRelease), s.H);
}
export function advance(s, dt) { let left = Math.min(dt * s.speed, 0.25); while (left > 1e-9) { const h = Math.min(left, 1 / 240); step(s, h); left -= h; } if (s.released && s.lands[0] !== null && s.lands[1] !== null && s.t > Math.max(s.lands[0], s.lands[1]) + 1.5) { /* run is over: keep the final frame */ } }
/** per-object readout: constant p from release (the pump is not touched during a drop) */
export function readout(s) {
  const pr = s.pAtRelease ?? s.p, objs = OBJ.map((o, i) => {
    const b = beta(i, pr), tl = landTime(b, s.H), tt = Math.min(s.t, tl), f = fall(b, tt);
    return {...o, b, y: Math.min(s.H, f.y), v: f.v, tLand: s.lands[i], tFall: tl, landed: s.lands[i] !== null};
  });
  const t0 = Math.sqrt((2 * s.H) / G), gExp = objs[0].landed ? (2 * s.H) / (objs[0].tLand ** 2) : null;
  return {t: s.t, released: s.released, H: s.H, p: s.p, pKPa: s.p * 101.3, air: s.air, objs, t0, v0: Math.sqrt(2 * G * s.H), gExp, vacuum: s.p < 0.02, tMeasured: objs[0].landed ? objs[0].tLand : null};
}
export const ideal = {t: (H) => Math.sqrt((2 * H) / G), v: (H) => Math.sqrt(2 * G * H), y: (t) => 0.5 * G * t * t};

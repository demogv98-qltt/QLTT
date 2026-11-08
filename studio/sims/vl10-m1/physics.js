// VL10-M1: displacement, distance travelled, average and instantaneous velocity of a test car whose speed you choose.
// The car follows a script (a list of [start time, velocity]) or your own velocity slider. Idealised: the speed changes
// at once. One state: t, x, s and the recorded path; everything on screen (car, strobes, graphs) reads from it.
export const T_MAX = 20; // s (the shared 3D rig reads this name)
export const WHEEL_R = 0.3, SLOTS = 24;
export const DT_REC = 0.02;
export const RANGE = {v: [-10, 10], t1: [0, 20], t2: [0, 20]};
export const SCRIPTS = [
  {id: 's1', vi: 'Ví dụ 1: đi đều 4 m/s', note: 'x = v·t: sau 5 s đi được 20 m', segs: [[0, 4]], T: 10},
  {id: 's2', vi: 'Ví dụ 2: đi – dừng – về', note: '4 m/s trong 5 s, đứng 3 s, lùi 2 m/s trong 5 s', segs: [[0, 4], [5, 0], [8, -2]], T: 13},
  {id: 's3', vi: 'Ví dụ 3: đi tới rồi quay lại', note: '5 m/s trong 6 s rồi −5 m/s trong 6 s: d = 0, s = 60 m', segs: [[0, 5], [6, -5]], T: 12},
];
export const createModel = () => ({mode: 'script', script: 0, vman: 3, t: 0, x: 0, s: 0, running: false, speed: 1, path: [0], t1: 2, t2: 6});
export const vScript = (sc, t) => { let v = 0; for (const [t0, vv] of sc.segs) if (t >= t0 - 1e-12) v = vv; return v; };
export const vNow = (s) => (s.mode === 'script' ? vScript(SCRIPTS[s.script], s.t) : s.vman);
export const endTime = (s) => (s.mode === 'script' ? SCRIPTS[s.script].T : T_MAX);
export function reset(s) { s.t = 0; s.x = 0; s.s = 0; s.running = false; s.path = [0]; }
export function step(s, dt) {
  if (!s.running) return;
  const tEnd = endTime(s), h = Math.min(dt, tEnd - s.t); if (h <= 0) { s.running = false; return; }
  // split the step at a script breakpoint so the speed change is exact
  let left = h;
  while (left > 1e-12) {
    let hh = left; if (s.mode === 'script') for (const [t0] of SCRIPTS[s.script].segs) if (t0 > s.t + 1e-12 && t0 < s.t + hh) hh = t0 - s.t;
    const v = vNow(s) , before = s.t; s.x += v * hh; s.s += Math.abs(v) * hh; s.t += hh; left -= hh;
    const i0 = Math.floor(before / DT_REC + 1e-9), i1 = Math.floor(s.t / DT_REC + 1e-9);
    for (let i = i0 + 1; i <= i1; i++) { const tr = i * DT_REC, back = s.t - tr; s.path[i] = s.x - v * back; }
  }
  if (s.t >= tEnd - 1e-9) { s.t = tEnd; s.running = false; }
}
export function advance(s, dt) { let left = Math.min(dt * s.speed, 0.25); while (left > 1e-9) { const h = Math.min(left, 1 / 240); step(s, h); left -= h; } }
/** position at an earlier time, from the recorded path (the shared rig draws the strobe copies with this) */
export function dAt(s, t) { if (t <= 0) return 0; const f = t / DT_REC, i = Math.floor(f), p = s.path; if (i >= p.length - 1) return p[p.length - 1] ?? 0; return p[i] + (p[i + 1] - p[i]) * (f - i); }
export const vAt = (s, t) => (s.mode === 'script' ? vScript(SCRIPTS[s.script], Math.min(t, endTime(s) - 1e-9)) : s.vman);
export function readout(s) {
  const v = vNow(s), t1 = Math.min(s.t1, s.t2), t2 = Math.max(s.t1, s.t2), ok = t2 <= s.t + 1e-9 && t2 - t1 > 0.05;
  const d1 = dAt(s, t1), d2 = dAt(s, t2);
  return {t: s.t, d: s.x, s: s.s, v: s.running || s.t > 0 ? v : v, a: 0, vAvg: s.t > 0 ? s.x / s.t : 0, speedAvg: s.t > 0 ? s.s / s.t : 0, wheelAng: s.x / WHEEL_R, pulses: Math.floor((Math.abs(s.x) / WHEEL_R) * SLOTS / (2 * Math.PI)),
    t1, t2, win: ok, dWin: d2 - d1, vWin: ok ? (d2 - d1) / (t2 - t1) : null, d1, d2, kind: v > 0 ? 'đi theo chiều dương' : v < 0 ? 'đi theo chiều âm' : 'đứng yên', done: !s.running && s.t >= endTime(s) - 1e-9 && s.t > 0};
}
/** exact answers of the scripted examples for the lesson */
export function scriptAt(idx, t) { const sc = SCRIPTS[idx]; let x = 0, sp = 0, last = 0; const segs = sc.segs; for (let i = 0; i < segs.length; i++) { const t0 = segs[i][0], t1 = i + 1 < segs.length ? segs[i + 1][0] : sc.T, v = segs[i][1]; const a = Math.min(t, t1) - t0; if (a > 0) { x += v * a; sp += Math.abs(v) * a; } last = t1; } return {x, s: sp}; }

// VL10-M7: a block on an adjustable inclined plank, with a spring scale pulling along the slope. One state: s (position
// along the plank), v. Static friction balances the driving force up to μs·N; once sliding, kinetic friction μk·N opposes
// the motion. Everything on screen (block, arrows, panels, the measured μ) reads from it.
export const G = 9.8;
export const D2R = Math.PI / 180;
export const L = 3.0; // m, plank length from the hinge
export const S_MIN = 0.35, S_MAX = 2.75; // block centre limits (stops at both ends)
export const MATERIALS = [
  {id: 'wood', vi: 'Gỗ trên gỗ', mus: 0.5, muk: 0.4},
  {id: 'rubber', vi: 'Cao su trên gỗ', mus: 0.9, muk: 0.8},
  {id: 'ice', vi: 'Thép trên nước đá', mus: 0.1, muk: 0.05},
];
export const RANGE = {alpha: [0, 60], m: [1, 10], F: [0, 100]};
export const PRESETS = [
  {id: 'p1', vi: 'Vật đứng yên trên dốc 20°', note: 'ma sát nghỉ cân bằng P_x', mat: 0, alpha: 20, m: 5, F: 0},
  {id: 'p2', vi: 'Vật trượt xuống ở 40°', note: 'a = g(sinα − μk·cosα)', mat: 0, alpha: 40, m: 5, F: 0},
  {id: 'p3', vi: 'Kéo vật trên mặt phẳng ngang', note: 'F lớn hơn μs·N thì vật mới nhúc nhích', mat: 0, alpha: 0, m: 5, F: 20},
];

export function createModel() { return {mat: 0, alpha: 20, m: 5, F: 0, s: 1.5, v: 0, slid: false, alphaSlide: null, muMeasured: null, pulled: null, lastF: 0, t: 0}; }
export const mu = (s) => MATERIALS[s.mat];

/** The forces for the block's present state. dir = direction of motion (+ up the slope), 0 when at rest. */
export function forces(s) {
  const a = s.alpha * D2R, mat = mu(s), P = s.m * G, N = P * Math.cos(a), Px = P * Math.sin(a); // Px: down-slope component
  const drive = s.F - Px; // net of everything but friction, + up the slope
  let dir = Math.abs(s.v) > 1e-9 ? Math.sign(s.v) : 0, fr, acc;
  if (dir === 0) {
    if (Math.abs(drive) <= mat.mus * N + 1e-9) { fr = -drive; acc = 0; } // static: friction balances exactly
    else { dir = Math.sign(drive); fr = -dir * mat.muk * N; acc = (drive + fr) / s.m; }
  } else { fr = -dir * mat.muk * N; acc = (drive + fr) / s.m; }
  return {P, N, Px, drive, fr, acc, dir, moving: dir !== 0, staticMax: mat.mus * N, kinetic: mat.muk * N, alpha: s.alpha};
}

export function step(s, dt) {
  const f = forces(s), wasRest = Math.abs(s.v) < 1e-9, a = f.acc;
  const vPrev = s.v; s.v += a * dt; s.s += vPrev * dt + 0.5 * a * dt * dt; s.t += dt;
  if (!wasRest && vPrev * s.v <= 0) { // velocity reversed through zero: stick if static friction can hold it
    const g = forces({...s, v: 0}); if (Math.abs(g.drive) <= mu(s).mus * g.N + 1e-9) s.v = 0;
  }
  if (s.s <= S_MIN) { s.s = S_MIN; if (s.v < 0) s.v = 0; }
  if (s.s >= S_MAX) { s.s = S_MAX; if (s.v > 0) s.v = 0; }
  if (wasRest && Math.abs(s.v) > 1e-9 && f.fr !== 0 && !s.slid && s.F === 0 && f.drive < 0) { s.slid = true; s.alphaSlide = s.alpha; s.muMeasured = Math.tan(s.alpha * D2R); }
  if (wasRest && Math.abs(s.v) > 1e-9 && s.alpha === 0 && f.drive > 0) s.pulled = s.F;
}
export function advance(s, dt) { let left = Math.min(dt, 0.1); while (left > 1e-9) { const h = Math.min(left, 1 / 240); step(s, h); left -= h; } }
export function resetBlock(s) { s.s = 1.5; s.v = 0; s.slid = false; s.alphaSlide = null; s.muMeasured = null; s.pulled = null; }

export function readout(s) {
  const f = forces(s), mat = mu(s);
  return {...f, m: s.m, mat, s: s.s, v: s.v, F: s.F, Fnet: f.drive + f.fr, tanA: Math.tan(s.alpha * D2R), critical: Math.atan(mat.mus) / D2R,
    state: f.moving ? (f.dir < 0 ? 'trượt xuống' : 'trượt lên') : 'đứng yên (ma sát nghỉ)', alphaSlide: s.alphaSlide, muMeasured: s.muMeasured, pulled: s.pulled};
}
/** settled answers for the lesson */
export const ideal = {
  N: (m, a) => m * G * Math.cos(a * D2R), Px: (m, a) => m * G * Math.sin(a * D2R),
  slideAcc: (a, muk) => G * (Math.sin(a * D2R) - muk * Math.cos(a * D2R)), staticMax: (m, a, mus) => mus * m * G * Math.cos(a * D2R),
};

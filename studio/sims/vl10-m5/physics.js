// VL10-M5: three spring balances pull one knot on a board (the textbook practical on combining forces).
// One state: three force vectors in the board plane. Everything on screen reads from it.
//   Tổng hợp: balances 1 and 2 pull with F₁, F₂ at angle α; balance 3 pulls the opposite way and reads |F₁ + F₂|.
//   Phân tích: balance 1 pulls F at β; balances 2 and 3 pull along the axes and read exactly Fx and Fy.
// In both modes the knot stays at O: F⃗₁ + F⃗₂ + F⃗₃ = 0.
export const D2R = Math.PI / 180;
export const FMAX = [20, 20, 50]; // N, full scale of each balance
export const REACH = 0.1; // m of spring extension at full scale
export const K = FMAX.map((f) => f / REACH); // N/m, spring constants

export const PRESETS = [
  {id: 'vd', vi: 'Ví dụ 3 N – 4 N', note: 'α = 90° → F = 5 N', mode: 'T', F1: 3, t1: 20, F2: 4, al: 90},
  {id: 'a0', vi: 'Hai lực cùng hướng', note: 'α = 0° → F = F₁ + F₂', mode: 'T', F1: 3, t1: 20, F2: 4, al: 0},
  {id: 'a180', vi: 'Hai lực ngược hướng', note: 'α = 180° → F = |F₁ − F₂|', mode: 'T', F1: 7, t1: 20, F2: 3, al: 180},
  {id: 'pt', vi: 'Phân tích F = 10 N', note: 'β = 37° → Fx = 8, Fy = 6', mode: 'P', F: 10, beta: 37},
];

const v2 = (F, th) => [F * Math.cos(th * D2R), F * Math.sin(th * D2R)];

export function createModel() {
  const s = {mode: 'T', cmd: {F1: 3, t1: 20, F2: 4, al: 90, F: 10, beta: 37}, v: [[0, 0], [0, 0], [0, 0]], last: [20, 110, 200]};
  s.v = targets(s).map((a) => [...a]);
  return s;
}

/** The three force vectors the setting asks for. */
export function targets(s) {
  const c = s.cmd;
  if (s.mode === 'T') {
    const a = v2(c.F1, c.t1), b = v2(c.F2, c.t1 + c.al);
    return [a, b, [-(a[0] + b[0]), -(a[1] + b[1])]];
  }
  const f = v2(c.F, c.beta);
  return [f, [-f[0], 0], [0, -f[1]]];
}

/** The balances follow the setting with a short lag (hand and spring), all with the same gain, so ΣF⃗ stays 0. */
export function advance(s, dt) {
  const k = 1 - Math.exp(-dt / 0.14), t = targets(s);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s.v[i][j] += (t[i][j] - s.v[i][j]) * k;
  for (let i = 0; i < 3; i++) if (Math.hypot(...s.v[i]) > 1e-3) s.last[i] = (Math.atan2(s.v[i][1], s.v[i][0]) / D2R + 360) % 360;
}

const norm = (a) => ((a % 360) + 360) % 360;
/** Readout of the settled state (every balance already at its set value): answers for the lesson never depend on frame rate. */
export function settled(s) { return readout({...s, v: targets(s).map((a) => [...a]), last: s.last}); }
export function readout(s) {
  const m = s.v.map((v, i) => {
    const F = Math.hypot(v[0], v[1]);
    return {F, th: F > 1e-3 ? norm((Math.atan2(v[1], v[0]) / D2R)) : s.last[i], ext: F / K[i], full: FMAX[i], v};
  });
  const sum = [m[0].v[0] + m[1].v[0] + m[2].v[0], m[0].v[1] + m[1].v[1] + m[2].v[1]];
  const r = {mode: s.mode, m, residual: Math.hypot(...sum)};
  if (s.mode === 'T') {
    let al = Math.abs(norm(m[1].th - m[0].th)); if (al > 180) al = 360 - al;
    const R = [m[0].v[0] + m[1].v[0], m[0].v[1] + m[1].v[1]];
    Object.assign(r, {al, R, Rmag: Math.hypot(...R), Rang: norm(Math.atan2(R[1], R[0]) / D2R),
      Fformula: Math.sqrt(m[0].F ** 2 + m[1].F ** 2 + 2 * m[0].F * m[1].F * Math.cos(al * D2R))});
  } else {
    const F = m[0].F, b = m[0].th;
    Object.assign(r, {F, beta: b, Fx: m[0].v[0], Fy: m[0].v[1], Fback: Math.hypot(m[0].v[0], m[0].v[1])});
  }
  return r;
}

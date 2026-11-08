// VL10-M14: density and liquid pressure. A tank with a pressure probe at depth h, and a cube that floats or sinks.
//   rho = m/V ; p = rho_l·g·h (+ p_atm for the absolute pressure) ; buoyancy F_A = rho_l·g·V_sub ; floats if rho_v < rho_l (submerged depth = a·rho_v/rho_l)
export const G = 9.8, P_ATM = 101300, H_TANK = 1.2, A_MIN = 0.1, A_MAX = 0.3;
export const LIQUIDS = [
  {id: 'nuoc', vi: 'Nước', rho: 1000, col: 0x3b9fd9},
  {id: 'dau', vi: 'Dầu ăn', rho: 800, col: 0xe3b83c},
  {id: 'muoi', vi: 'Nước muối', rho: 1200, col: 0x66c4b4},
  {id: 'glyx', vi: 'Glixerin', rho: 1260, col: 0xcfe0a0},
];
export const SOLIDS = [
  {id: 'go', vi: 'Gỗ', rho: 600, col: 0xb07a3f},
  {id: 'da', vi: 'Nước đá', rho: 920, col: 0xcfeaf5},
  {id: 'nhom', vi: 'Nhôm', rho: 2700, col: 0xbfc6cc},
  {id: 'thep', vi: 'Thép', rho: 7800, col: 0x6d7782},
];
export const PRESETS = [
  {id: 'a', vi: 'Áp suất trong nước ở độ sâu 0,5 m', note: 'p = ρgh = 4 900 Pa', liq: 0, h: 0.5, sol: 0, a: 0.2},
  {id: 'b', vi: 'Gỗ nổi trên nước', note: 'ρ gỗ 600 < 1000: chìm 12 cm', liq: 0, h: 0.5, sol: 0, a: 0.2},
  {id: 'c', vi: 'Nhôm chìm trong nước', note: 'ρ nhôm 2700 > 1000', liq: 0, h: 0.5, sol: 2, a: 0.2},
];
export const createModel = () => ({liq: 0, sol: 0, a: 0.2, h: 0.5, z: -0.05, v: 0, released: false, t: 0, speed: 1, running: true});
export const volume = (s) => s.a ** 3;
export const massOf = (s) => SOLIDS[s.sol].rho * volume(s);
export const weightOf = (s) => massOf(s) * G;
export const rhoL = (s) => LIQUIDS[s.liq].rho;
export const vsub = (s, z = s.z) => s.a * s.a * Math.min(s.a, Math.max(0, z));
export const buoy = (s, z = s.z) => rhoL(s) * G * vsub(s, z);
export const pLiquid = (s) => rhoL(s) * G * s.h;
export const eqDepth = (s) => { const r = SOLIDS[s.sol].rho / rhoL(s); return r < 1 ? s.a * r : H_TANK; };
export function drop(s) { s.z = -0.05; s.v = 0; s.released = true; s.t = 0; }
export function holdUp(s) { s.z = -0.05; s.v = 0; s.released = false; s.t = 0; }
export function advance(s, dt) {
  s.t += dt; if (!s.running || !s.released) return; const m = massOf(s), kb = rhoL(s) * G * s.a * s.a, c = 2 * 0.5 * Math.sqrt(kb * m);
  let h = Math.min(dt * s.speed, 0.1);
  while (h > 0) { const e = Math.min(h, 0.002), sub = s.z > 0 ? 1 : 0; const F = m * G - buoy(s) - sub * c * s.v; s.v += (F / m) * e; s.z += s.v * e; if (s.z > H_TANK - s.a) { s.z = H_TANK - s.a + 0; if (s.v > 0) s.v = 0; } h -= e; }
}
export function readout(s) {
  const rl = rhoL(s), rv = SOLIDS[s.sol].rho, m = massOf(s), V = volume(s), P = weightOf(s), Fb = buoy(s), eq = eqDepth(s), floats = rv < rl;
  const zEq = floats ? eq : H_TANK - s.a, settled = s.released && Math.abs(s.z - zEq) < 0.003 && Math.abs(s.v) < 0.01;
  const pl = pLiquid(s);
  return {rl, rv, m, V, P, Fb, floats, eq, z: s.z, v: s.v, released: s.released, settled, pl, pAbs: pl + P_ATM, h: s.h, a: s.a, apparent: P - rl * G * V, sub: Math.min(s.a, Math.max(0, s.z)), onBottom: s.z >= H_TANK - s.a - 1e-3};
}
export const ideal = {p: (rho, h) => rho * G * h, depth: (a, rv, rl) => (a * rv) / rl};

// VL12-B1: từ trường của nam châm thanh + từ trường Trái Đất; kim la bàn, mạt sắt, đường sức.
// Mô hình nam châm: thanh trụ bán kính a, dài L, từ hoá đều (độ từ dư Br) ≡ cuộn dây bề mặt có K = Br/μ0 (A/m). Ta cộng từ trường của M vòng dây tròn
// (công thức đúng theo tích phân K, E elliptic). Mọi đường sức tính từ mô hình này khép kín (div B = 0), không vẽ tay.
// Hệ toạ độ mặt bàn nhìn từ trên: x = Đông (sang phải), z hướng về phía người xem; BẮC = −z. Hướng kim: vectơ (cosψ, sinψ) trong mặt phẳng (x, z); Bắc ứng với ψ = −90°.
export const MU0 = 4e-7 * Math.PI;
export const MAG = {a: 0.015, L: 0.12, M: 24};
export const BE = 4e-5; // T, thành phần nằm ngang của từ trường Trái Đất (khoảng 0,4 Gauss; chỉ Bắc)
export const H_SHEET = 0.034; // m: độ cao của kim la bàn / kim thử so với trục nam châm (đo từ hình học của thiết bị)
export const H_FIL = 0.022; // m: độ cao mạt sắt (mặt trên tấm bìa)
export const RANGE = {Br: [0.05, 0.5], phi: [0, 360], r: [0.08, 0.6], alpha: [0, 360]};
export const D2R = Math.PI / 180;

function ellipKE(m) {
  m = Math.min(m, 1 - 1e-13); let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = 0.5 * m, pw = 0.5;
  for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) { const an = (a + b) / 2, bn = Math.sqrt(a * b), cn = (a - b) / 2; a = an; b = bn; c = cn; pw *= 2; sum += pw * c * c; }
  const K = Math.PI / (2 * a); return [K, K * (1 - sum)];
}
/** từ trường (T) của một vòng dây tròn bán kính a, dòng I đặt tại gốc, trục u. Điểm (u, ρ). Trả [B_u, B_ρ]. */
export function loopField(a, I, u, rho) {
  const k = MU0 * I / (2 * Math.PI);
  if (rho < 1e-9) return [MU0 * I * a * a / (2 * Math.pow(a * a + u * u, 1.5)), 0];
  const s1 = (a + rho) ** 2 + u * u, s2 = Math.max((a - rho) ** 2 + u * u, 1e-18), [K, E] = ellipKE(4 * a * rho / s1), sq = Math.sqrt(s1);
  return [k / sq * (K + (a * a - rho * rho - u * u) / s2 * E), k * u / (rho * sq) * (-K + (a * a + rho * rho + u * u) / s2 * E)];
}
/** kiểm chứng độc lập: tích phân số Biot–Savart quanh vòng dây (N đoạn) */
export function loopFieldNumeric(a, I, u, rho, N = 4000) {
  let bu = 0, br = 0; for (let i = 0; i < N; i++) { const t = (i + 0.5) / N * 2 * Math.PI, dt = 2 * Math.PI / N; // nguồn: (0, a cos t, a sin t); dl = a(−sin t, cos t) dt trên (y,z); điểm P = (u, rho, 0)
    const rx = u, ry = rho - a * Math.cos(t), rz = -a * Math.sin(t), r3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5), dly = -a * Math.sin(t) * dt, dlz = a * Math.cos(t) * dt; // dl × R với R = P − nguồn
    // dl = (0, dly, dlz); R = (rx, ry, rz); dl × R = (dly·rz − dlz·ry, dlz·rx − 0, 0 − dly·rx)
    bu += (dly * rz - dlz * ry) / r3; br += (dlz * rx) / r3; }
  const f = MU0 * I / (4 * Math.PI); return [f * bu, f * br];
}
/** từ trường nam châm (T) tại (u, ρ) trong hệ trục nam châm (N ở +u): M vòng dây, tổng dòng = Br·L/μ0 */
export function magnetField(Br, u, rho) {
  const {a, L, M} = MAG; let bu = 0, br = 0, dI = Br * L / MU0 / M;
  for (let i = 0; i < M; i++) { const [x, y] = loopField(a, dI, u - (-L / 2 + (i + 0.5) * L / M), rho); bu += x; br += y; }
  return [bu, br];
}
export const createModel = () => ({magnet: true, earth: true, Br: 0.25, phi: 0, mode: 'compass', r: 0.3, alpha: 90, rows: [], t: 0, speed: 1, lines3d: false, dirty: true, comp: null});
/** từ trường nam châm tại điểm mặt bàn (x, z) tại độ cao h trên trục: thành phần nằm ngang [Bx, Bz] (T) */
export function magnetHoriz(s, x, z, h = H_SHEET) {
  if (!s.magnet) return [0, 0];
  const c = Math.cos(s.phi * D2R), sn = Math.sin(s.phi * D2R), u = x * c - z * sn, sl = x * sn + z * c; // trục nam châm e = (cosφ, −sinφ); lệch ngang n = (sinφ, cosφ)
  const rho = Math.hypot(sl, h), [bu, br] = magnetField(s.Br, u, rho), bs = br * sl / rho;
  return [bu * c + bs * sn, -bu * sn + bs * c];
}
export function totalHoriz(s, x, z, h = H_SHEET) { const m = magnetHoriz(s, x, z, h); return [m[0], m[1] - (s.earth ? BE : 0)]; }
export const probePos = (s) => { const a = (s.phi + s.alpha) * D2R; return [s.r * Math.cos(a), -s.r * Math.sin(a)]; };
/** Đường sức trong hệ nam châm (u, ρ) — mặt phẳng chứa trục; xuất phát ngoài đầu N, đi theo chiều B tới khi khép kín hoặc ra xa */
export function traceLine(Br, rho0, ds = 0.003, R = 0.62) {
  const {L} = MAG, f = (u, r) => { const [bu, br] = magnetField(Br, u, r), n = Math.hypot(bu, br) || 1; return [bu / n, br / n]; };
  let u = L / 2 + 0.002, r = rho0; const pts = [[u, r]], start = [u, r]; let len = 0;
  for (let i = 0; i < 6000; i++) {
    const k1 = f(u, r), k2 = f(u + k1[0] * ds / 2, r + k1[1] * ds / 2), k3 = f(u + k2[0] * ds / 2, r + k2[1] * ds / 2), k4 = f(u + k3[0] * ds, r + k3[1] * ds);
    u += ds * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6; r += ds * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6; len += ds; pts.push([u, r]);
    if (Math.hypot(u, r) > R) return {pts, closed: false};
    if (r < -0.0002) { r = Math.abs(r); } // ρ ≥ 0: một đường qua trục sang bên kia (không xảy ra với ρ0 > 0)
    if (len > 0.06 && Math.hypot(u - start[0], r - start[1]) < ds * 1.3) return {pts, closed: true};
  }
  return {pts, closed: false};
}
// ------- kim la bàn: τ = −μB sin(ψ − ψ_B), cản nhẹ -------
export const W0 = 2 * Math.PI * 1.2; // rad/s: tần số dao động nhỏ của kim khi B = B_Trái Đất
export function newCompass(x, z) { return {x, z, psi: -Math.PI / 2, w: 0, B: [0, -BE], mag: BE}; }
export function stepCompass(c, dt) {
  const bm = Math.hypot(c.B[0], c.B[1]); c.mag = bm; if (bm < 1e-9) { c.w *= Math.exp(-dt * 3); c.psi += c.w * dt; return; }
  const psiB = Math.atan2(c.B[1], c.B[0]), w2 = Math.min(W0 * W0 * bm / BE, 900), z = 0.3; let d = c.psi - psiB; d = Math.atan2(Math.sin(d), Math.cos(d));
  if (Math.abs(Math.sin(d)) < 1e-3 && Math.abs(c.w) < 1e-2 && Math.cos(d) < 0) c.w += 0.4 * dt * 60 * (c.psi > 0 ? 1 : -1); // kim thật luôn có nhiễu nhỏ
  c.w += (-w2 * Math.sin(d) - 2 * z * Math.sqrt(w2) * c.w) * dt; c.psi += c.w * dt;
}
export function refresh(s, grid) { for (const c of grid) c.B = totalHoriz(s, c.x, c.z); s.dirty = false; }
export function advance(s, dt, comps) { if (s.dirty) refresh(s, comps); let left = Math.min(dt * s.speed, 0.1); while (left > 1e-9) { const h = Math.min(left, 0.004); left -= h; for (const c of comps) stepCompass(c, h); } s.t += dt * s.speed; }
export function readout(s, probe) {
  const [px, pz] = probePos(s), m = magnetHoriz(s, px, pz), e = [0, s.earth ? -BE : 0], t = [m[0] + e[0], m[1] + e[1]];
  const bm = Math.hypot(...m), bt = Math.hypot(...t), fixDeg = (d) => ((d + 180) % 360 + 360) % 360 - 180;
  const east = (vx, vz) => Math.atan2(vx, -vz) / D2R; // góc lệch khỏi hướng Bắc, dương = về phía Đông
  const defl = east(t[0], t[1]), needle = probe ? east(Math.cos(probe.psi), Math.sin(probe.psi)) : NaN, psiEq = Math.atan2(t[1], t[0]);
  return {px, pz, bm, be: s.earth ? BE : 0, bt, defl, needle, r: s.r, settled: !probe || (Math.abs(probe.w) < 0.05 && Math.abs(fixDeg((probe.psi - psiEq) / D2R)) < 1.5), rows: s.rows, mode: s.mode, magnet: s.magnet, earth: s.earth, phi: s.phi, Br: s.Br, alpha: s.alpha, bmDir: m};
}
/** bán kính trên đường trung trực mà B_nam châm = B_Trái Đất (nam châm đặt φ), dò nhị phân trong [0.1, 0.8] */
export function r45(Br, alpha = 90) {
  const s = {...createModel(), Br, phi: 0}, f = (r) => { const a = alpha * D2R; return Math.hypot(...magnetHoriz(s, r * Math.cos(a), -r * Math.sin(a))) - BE; };
  let lo = 0.1, hi = 0.8; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2;
}
export function record(s) { const [px, pz] = probePos(s), m = Math.hypot(...magnetHoriz(s, px, pz)); s.rows.push({r: s.r, alpha: s.alpha, B: m}); return true; }
export const PRESETS = [
  {id: 'e', vi: 'Chỉ có từ trường Trái Đất', note: 'lấy nam châm ra: mọi kim chỉ Bắc', magnet: false, earth: true, phi: 0, Br: 0.25},
  {id: 'm', vi: 'Nam châm đặt dọc Đông–Tây', note: 'cực N hướng Đông, Br = 0,25 T', magnet: true, earth: true, phi: 0, Br: 0.25},
  {id: 'n', vi: 'Chỉ nam châm (tắt Trái Đất)', note: 'thấy đúng hình dạng từ trường nam châm', magnet: true, earth: false, phi: 0, Br: 0.25},
];

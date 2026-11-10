// VL12-B4: THỰC HÀNH đo cảm ứng từ B bằng "cân dòng điện". Nam châm hình chữ U đặt trên cân điện tử; khung dây N vòng được giữ cố định, đoạn dây ngang dài l nằm trong khe từ trường.
// Lực từ lên dây F = N·B·I·l (hướng lên khi I > 0, B từ N sang S); phản lực lên nam châm hướng xuống nên số chỉ cân tăng Δm = F/g.
// Cân có độ phân giải 0,01 g và nhiễu ngẫu nhiên σ ≈ 0,005 g (mẫu giả ngẫu nhiên lấy cố định); học sinh phải đo nhiều điểm, vẽ đồ thị F–I, tìm hệ số góc và sai số.
export const G = 9.8;
export const MAGNETS = [{id: 'A', B: 0.082}, {id: 'B', B: 0.121}, {id: 'C', B: 0.163}]; // T (giá trị “thật”, học sinh không biết trước)
export const P = {l: 0.04, leff: 0.04 * 0.988, dl: 0.0005, M0: 215.30, sigma: 0.005, res: 0.01, lag: 0.15, resample: 0.35};
export const RANGE = {I: [-3, 3], N: [1, 5]};
export const PRESETS = [
  {id: 'a', vi: 'Nam châm A, N = 3 vòng', note: 'I từ 0,5 đến 2,5 A; ghi 5 điểm', mag: 0, N: 3},
  {id: 'b', vi: 'Nam châm B, N = 3 vòng', note: 'chưa biết B: hãy đo', mag: 1, N: 3},
  {id: 'c', vi: 'Nam châm C, N = 5 vòng', note: 'hệ số góc lớn hơn, dễ đo hơn', mag: 2, N: 5},
];
export function createModel() { return {mag: 0, N: 3, I: 0, cmd: {I: 0}, tare: 0, tared: false, hold: 0, noise: 0, nt: 0, seed: 12345, rows: [], reveal: false, t: 0, speed: 1, note: null}; }
const rnd = (s) => { s.seed = (s.seed * 16807) % 2147483647; return s.seed / 2147483647; };
const gauss = (s) => { const u = Math.max(1e-9, rnd(s)), v = rnd(s); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
export const Btrue = (s) => MAGNETS[s.mag].B;
export const forceUp = (s, I = s.I) => s.N * Btrue(s) * I * P.leff; // N — chiều dài hiệu dụng l_eff = 0,988·l (từ trường rìa), học sinh không biết trước: gây sai số hệ thống ≈ −1,2 % trong B đo
export const rawMass = (s) => P.M0 + (forceUp(s) / G) * 1000 + s.noise; // g
export const display = (s) => Math.round((rawMass(s) - s.tare) / P.res) * P.res; // g, đã trừ bì
export function advance(s, dt) {
  let left = Math.min(dt * s.speed, 0.1);
  while (left > 1e-9) { const h = Math.min(left, 0.01); left -= h; s.I += (s.cmd.I - s.I) * (1 - Math.exp(-h / P.lag)); s.t += h; s.nt += h; if (s.nt >= P.resample) { s.nt = 0; s.noise = P.sigma * gauss(s); }
    s.hold = Math.abs(s.I - s.cmd.I) < 0.005 ? s.hold + h : 0; }
}
export const tareNow = (s) => { s.tare = P.M0 + (forceUp(s) / G) * 1000; s.tared = true; };
/** hồi quy tuyến tính y = a + b·x (có tung độ gốc) cho F(mN) theo I */
export function regress(rows, N) {
  rows = rows.filter((q) => q.N === N);
  const pts = rows.map((q) => [q.I, q.m / 1000 * G * 1000]); // (A, mN)
  if (pts.length < 3) return null; const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxx = 0, sxy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); } if (sxx < 1e-9) return null;
  const b = sxy / sxx, a = my - b * mx; let ss = 0; for (const [x, y] of pts) ss += (y - (a + b * x)) ** 2; const se = n > 2 ? Math.sqrt(ss / (n - 2) / sxx) : NaN;
  const Bexp = b / 1000 / (N * P.l), rel = Math.hypot(se / Math.abs(b), P.dl / P.l); return {slope: b, a, se, Bexp, dB: Bexp * rel, n};
}
export function readout(s) {
  const disp = display(s), F = forceUp(s), settled = s.hold > 0.6 && Math.abs(s.I - s.cmd.I) < 0.005, reg = regress(s.rows.filter((q) => q.mag === s.mag), s.N);
  return {I: s.I, Icmd: s.cmd.I, disp, F, Fm: disp / 1000 * G * 1000, mag: MAGNETS[s.mag].id, B: Btrue(s), N: s.N, l: P.l, settled, tared: s.tared, reg, rows: s.rows, reveal: s.reveal, dir: F > 1e-6 ? 1 : F < -1e-6 ? -1 : 0, raw: rawMass(s), note: s.note};
}
export function record(s) { const r = readout(s); if (!r.settled) return false; s.rows.push({I: s.cmd.I, m: r.disp, N: s.N, mag: s.mag}); return true; }

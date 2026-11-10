// VL12-B5: hạt điện tích chuyển động trong từ trường đều (lực Lorentz F = q·v⃗×B⃗) — thí nghiệm kiểu “ống tia electron đo e/m”.
// Từ trường đều B hướng dọc trục z (về phía người xem khi dirB = +1). Hạt được tăng tốc bởi hiệu điện thế V (qV = ½mv², không tương đối tính; v ≪ c) rồi bay vào từ trường với góc α giữa v⃗ và B⃗.
//   r = m·v·sinα/(|q|·B), T = 2πm/(|q|·B) (không phụ thuộc v), bước xoắn ốc p = v·cosα·T, q/m = 2V·sin²α/(B²r²).
// Quỹ đạo vẽ bằng nghiệm giải tích của phương trình chuyển động; bộ kiểm định tích phân RK4 độc lập phương trình Lorentz để so với nghiệm này.
export const Q = 1.602176634e-19;
export const PARTICLES = [
  {id: 'e', vi: 'Electron', q: -Q, m: 9.1093837015e-31, color: 0x2b59c3, sym: 'e⁻'},
  {id: 'p', vi: 'Proton', q: Q, m: 1.67262192369e-27, color: 0xc0392b, sym: 'p⁺'},
  {id: 'a', vi: 'Hạt α', q: 2 * Q, m: 6.6446573357e-27, color: 0x8a6a1c, sym: 'α²⁺'},
];
export const RANGE = {V: [50, 1000], B: [1, 60], alpha: [75, 90], rt: [0.01, 0.1]};
export const CH = {R: 0.10, half: 0.05, x0: -0.03, z0: -0.035}; // bình: bán kính 10 cm, dài 10 cm; điểm bắn
export const PRESETS = [
  {id: 'a', vi: 'Electron, V = 300 V, B = 1,5 mT', note: 'α = 90°: quỹ đạo tròn, r ≈ 3,9 cm', pt: 0, V: 300, B: 1.5, alpha: 90, dirB: 1},
  {id: 'b', vi: 'Proton, V = 300 V, B = 60 mT', note: 'r ≈ 4,0 cm, lệch ngược electron (xuống)', pt: 1, V: 300, B: 60, alpha: 90, dirB: 1},
  {id: 'c', vi: 'Electron nghiêng α = 75°', note: 'quỹ đạo xoắn ốc dọc theo B', pt: 0, V: 300, B: 1.5, alpha: 78, dirB: 1},
];
export const createModel = () => ({pt: 0, V: 300, B: 1.5, alpha: 90, dirB: 1, rt: 0.04, showRing: false, u: 0, speed: 1, rows: [], t: 0});
export const part = (s) => PARTICLES[s.pt];
export const speedOf = (s) => Math.sqrt(2 * Math.abs(part(s).q) * s.V / part(s).m);
export const qm = (s) => Math.abs(part(s).q) / part(s).m;
const Bt = (s) => s.B * 1e-3;
export const radius = (s) => speedOf(s) * Math.sin(s.alpha * Math.PI / 180) / (qm(s) * Bt(s));
export const period = (s) => 2 * Math.PI / (qm(s) * Bt(s));
export const pitch = (s) => speedOf(s) * Math.cos(s.alpha * Math.PI / 180) * period(s);
/** chiều quay của vận tốc trong mặt phẳng xy khi nhìn từ +z: σ = +1 ngược chiều kim đồng hồ. Lực: q·v×B; với q·B > 0 vận tốc quay THUẬN chiều kim đồng hồ (σ = −1). */
export const sigma = (s) => -Math.sign(part(s).q) * s.dirB;
/** vị trí tại thời gian t (nghiệm giải tích); trục z cùng chiều +z (dirB = +1 hướng ra người xem) */
export function posAt(s, t) {
  const w = qm(s) * Bt(s), v = speedOf(s), a = s.alpha * Math.PI / 180, vp = v * Math.sin(a), vz = v * Math.cos(a), sg = sigma(s), th = sg * w * t, r = vp / w;
  return [CH.x0 + sg * r * Math.sin(th), sg * r * (1 - Math.cos(th)), CH.z0 + vz * t];
}
/** vận tốc (nghiệm giải tích) */
export function velAt(s, t) { const w = qm(s) * Bt(s), v = speedOf(s), a = s.alpha * Math.PI / 180, th = sigma(s) * w * t; return [v * Math.sin(a) * Math.cos(th), v * Math.sin(a) * Math.sin(th), v * Math.cos(a)]; }
/** tích phân RK4 độc lập phương trình dv/dt = (q/m) v × B (B = dirB·B·ẑ) */
export function integrate(s, T, n = 20000) {
  const k = part(s).q / part(s).m, B = s.dirB * Bt(s), v0 = speedOf(s), a = s.alpha * Math.PI / 180; let r = [CH.x0, 0, CH.z0], v = [v0 * Math.sin(a), 0, v0 * Math.cos(a)];
  const acc = (vv) => [k * vv[1] * B, -k * vv[0] * B, 0], h = T / n;
  for (let i = 0; i < n; i++) { const a1 = acc(v), v2 = v.map((x, j) => x + a1[j] * h / 2), a2 = acc(v2), v3 = v.map((x, j) => x + a2[j] * h / 2), a3 = acc(v3), v4 = v.map((x, j) => x + a3[j] * h), a4 = acc(v4); const vn = v.map((x, j) => x + (a1[j] + 2 * a2[j] + 2 * a3[j] + a4[j]) * h / 6); r = r.map((x, j) => x + (v[j] + vn[j]) * h / 2); v = vn; }
  return {r, v};
}
/** quỹ đạo vẽ: từ lúc bắn tới khi chạm thành bình (|xy − tâm bình| > R hoặc |z| > half) hoặc hết 1 chu kỳ khi α = 90° (vòng kín) */
export function path(s, N = 240) {
  const T = period(s), out = [], tMax = T * 6; let hit = false;
  for (let i = 0; i <= N * 6; i++) { const t = (i / N) * T; if (t > tMax) break; const p = posAt(s, t); if (Math.hypot(p[0], p[1]) > CH.R - 0.004 || Math.abs(p[2]) > CH.half - 0.004) { hit = true; break; } out.push(p); if (s.alpha > 89.99 && t >= T) break; }
  return {pts: out, hit, duration: out.length ? (out.length - 1) / N * T : 0};
}
/** tâm vòng (xy) của quỹ đạo tròn */
export const center = (s) => [CH.x0, sigma(s) * radius(s)];
export function advance(s, dt) { s.t += dt; s.u += (dt * s.speed) / 5; if (s.u > 1e9) s.u = 0; }
export function readout(s) {
  const v = speedOf(s), r = radius(s), T = period(s), pc = pitch(s), p = path(s, 120), fits = Math.hypot(CH.x0, 0) + 0 < CH.R, circleFits = 2 * r + 0 < 2 * CH.R;
  const regress = (() => { const pts = s.rows.filter((q) => q.pt === s.pt).map((q) => [q.V, q.r * q.r * (q.B * 1e-3) ** 2]); if (pts.length < 3) return null; const n = pts.length, mx = pts.reduce((a, b) => a + b[0], 0) / n, my = pts.reduce((a, b) => a + b[1], 0) / n; let sxx = 0, sxy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); } if (sxx < 1e-9) return null; const b = sxy / sxx; return {slope: b, qm: 2 / b}; })();
  const emRows = s.rows.map((q) => q.em), mean = emRows.length ? emRows.reduce((a, b) => a + b, 0) / emRows.length : NaN, sd = emRows.length > 1 ? Math.sqrt(emRows.reduce((a, b) => a + (b - mean) ** 2, 0) / (emRows.length - 1)) : NaN;
  void fits;
  return {pt: s.pt, sym: part(s).sym, q: part(s).q, m: part(s).m, V: s.V, B: s.B, alpha: s.alpha, dirB: s.dirB, v, vperp: v * Math.sin(s.alpha * Math.PI / 180), r, T, f: 1 / T, pitch: pc, qm: qm(s), sigma: sigma(s), path: p, circleFits, ring: s.showRing, rt: s.rt, emTest: 2 * s.V * Math.sin(s.alpha * Math.PI / 180) ** 2 / ((s.B * 1e-3) ** 2 * s.rt ** 2), rows: s.rows, mean, sd, regress, center: center(s), hitsWall: p.hit};
}
export function record(s) { const em = 2 * s.V * Math.sin(s.alpha * Math.PI / 180) ** 2 / ((s.B * 1e-3) ** 2 * s.rt ** 2); s.rows.push({pt: s.pt, V: s.V, B: s.B, r: s.rt, em, alpha: s.alpha}); return true; }

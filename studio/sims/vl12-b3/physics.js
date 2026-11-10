// VL12-B3: lực từ tác dụng lên đoạn dây dẫn mang dòng điện đặt trong từ trường đều.
//   F⃗ = I·l⃗ × B⃗   →  F = B·I·l·sinθ  (θ = góc giữa dây và đường sức từ), chiều theo quy tắc bàn tay trái.
// Thiết bị: thanh đồng nằm ngang dọc trục z, treo vào 2 lò xo giống nhau (độ cứng k mỗi cái). Dòng I chạy theo +z khi I > 0.
// Từ trường đều B⃗ nằm ngang, giữa hai cực nam châm hình đĩa (đường kính = l, bỏ qua từ trường rìa). B⃗ = B(sinθ, 0, cosθ): θ là góc giữa B⃗ và thanh.
// Hệ trục: x sang phải, y hướng lên, z hướng về phía người xem. e = độ dịch xuống của thanh so với vị trí cân bằng khi I = 0.
export const G = 9.8;
export const P = {m: 0.05, k: 4, damp: 0.3, lag: 0.12}; // kg; N/m mỗi lò xo; hệ số cản N·s/m; độ trễ nguồn điện (s)
export const RANGE = {I: [-5, 5], B: [0.05, 0.3], l: [0.1, 0.2], th: [35, 90]};
export const D2R = Math.PI / 180;
export const PRESETS = [
  {id: 'a', vi: 'Dây ⊥ đường sức, I = 3 A', note: 'B = 0,20 T, l = 0,20 m, θ = 90° → F = 0,12 N', B: 0.2, l: 0.2, th: 90, I: 3},
  {id: 'b', vi: 'Đổi chiều dòng điện', note: 'I = −3 A: lực đổi chiều (hướng xuống)', B: 0.2, l: 0.2, th: 90, I: -3},
  {id: 'c', vi: 'Nghiêng góc θ = 45°', note: 'cùng B, I, l: F giảm còn F·sin45°', B: 0.2, l: 0.2, th: 45, I: 3},
];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const bHat = (th) => [Math.sin(th * D2R), 0, Math.cos(th * D2R)];
/** vector lực từ lên đoạn dây: F⃗ = I·l⃗ × B⃗ (dây dọc +z) */
export const forceVec = (s) => { const b = bHat(s.th), c = cross([0, 0, 1], b), k = s.I * s.l * s.B; return [c[0] * k, c[1] * k, c[2] * k]; };
export const forceUp = (s) => forceVec(s)[1];
export const createModel = () => ({B: 0.2, l: 0.2, th: 90, I: 0, cmd: {I: 0}, e: 0, v: 0, t: 0, speed: 1, rows: [], base: null});
export const sag0 = () => (P.m * G) / (2 * P.k);
export const eqExt = (s) => (P.m * G - forceUp(s)) / (2 * P.k);
export function reset(s) { s.e = eqExt(s); s.v = 0; }
export function snap(s) { s.I = s.cmd.I; s.e = eqExt(s); s.v = 0; }
export function advance(s, dt) {
  let left = Math.min(dt * s.speed, 0.1);
  while (left > 1e-9) {
    const h = Math.min(left, 0.002); left -= h;
    s.I += (s.cmd.I - s.I) * (1 - Math.exp(-h / P.lag));
    const near = Math.abs(s.e - eqExt(s)) < 6e-5 && Math.abs(s.v) < 0.002 && Math.abs(s.I - s.cmd.I) < 0.02; s.hold = near ? (s.hold || 0) + h : 0;
    const a = (P.m * G - forceUp(s) - 2 * P.k * s.e - P.damp * s.v) / P.m; // e: xuống dương, lực từ hướng lên khi F_y > 0
    s.v += a * h; s.e += s.v * h; s.t += h;
  }
}
/** độ dịch lên của thanh so với khi I = 0 và lực "lực kế" suy ra: F_đo = 2k·(Δ dịch xuống khi I=0 trừ dịch hiện tại) */
export function readout(s) {
  const e0 = sag0(), up = e0 - s.e, Fm = 2 * P.k * up, Ft = forceUp(s), fv = forceVec(s), b = bHat(s.th);
  return {B: s.B, l: s.l, th: s.th, I: s.I, Icmd: s.cmd.I, F: Math.abs(Ft), Fy: Ft, Fmeas: Fm, up, dir: Ft > 1e-6 ? 1 : Ft < -1e-6 ? -1 : 0, fv, b,
    settled: (s.hold || 0) > 0.3 && Math.abs(s.I - s.cmd.I) < 0.02, sinth: Math.sin(s.th * D2R), rows: s.rows, kk: 2 * P.k, e: s.e};
}
export function record(s) { const r = readout(s); if (!r.settled) return false; s.rows.push({I: s.cmd.I, B: s.B, l: s.l, th: s.th, F: r.Fmeas, up: r.up}); return true; }

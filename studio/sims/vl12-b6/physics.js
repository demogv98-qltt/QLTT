// VL12-B6: cảm ứng điện từ. Nam châm thanh (N hướng xuống) chuyển động dọc trục cuộn dây thẳng đứng. Φ là từ thông qua cuộn (pháp tuyến hướng LÊN), e = −N dΦ₁/dt,
// i = e/R_tổng, lực hãm lên nam châm F = −(N·dΦ₁/ds)²·v/R (bảo toàn năng lượng: công suất toả nhiệt e²/R = F·v).
// Mô hình nam châm như B1: trụ từ hoá đều ≡ các vòng dây K = Br/μ0; từ thông qua một vòng bán kính b tính bằng độ tự cảm tương hỗ Maxwell của hai vòng đồng trục.
import {loopField, MU0} from '../vl12-b1/physics.js';
export {MU0};
export const G = 9.8, D2R = Math.PI / 180;
export const MAG = {a: 0.0125, L: 0.06, M: 20, m: 0.08}; // bán kính 1,25 cm, dài 6 cm, khối lượng 80 g
export const COIL = {b: 0.02, tube: 0.35}; // bán kính vòng dây 2 cm; ống dài 0,70 m (s từ −0,35 đến +0,35 so với tâm cuộn)
export const RANGE = {Br: [0.2, 0.6], N: [50, 500], R: [1, 100], v: [-1.2, 1.2]};
export const S_TOP = 0.3, S_BOT = -0.3; // vị trí thả (tâm nam châm cao hơn tâm cuộn 30 cm) và tấm đệm (−30 cm)
function ellipKE(m) { m = Math.min(m, 1 - 1e-13); let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = 0.5 * m, pw = 0.5; for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) { const an = (a + b) / 2, bn = Math.sqrt(a * b), cn = (a - b) / 2; a = an; b = bn; c = cn; pw *= 2; sum += pw * c * c; } const K = Math.PI / (2 * a); return [K, K * (1 - sum)]; }
/** hệ số tương hỗ (H) của hai vòng đồng trục bán kính a, b cách nhau d (công thức Maxwell) */
export function mutual(a, b, d) { const k2 = 4 * a * b / ((a + b) ** 2 + d * d), k = Math.sqrt(k2), [K, E] = ellipKE(k2); return MU0 * Math.sqrt(a * b) * ((2 / k - k) * K - (2 / k) * E); }
/** từ thông (Wb) theo chiều trục nam châm S→N (N hướng xuống) qua MỘT vòng dây bán kính b, tâm cách tâm nam châm s (dọc trục) */
export function flux1(Br, s, b = COIL.b) { const {a, L, M} = MAG, dI = Br * L / MU0 / M; let f = 0; for (let i = 0; i < M; i++) f += dI * mutual(a, b, s - (-L / 2 + (i + 0.5) * L / M)); return f; }
export const dFlux1 = (Br, s, b = COIL.b) => { const h = 2e-5; return (flux1(Br, s + h, b) - flux1(Br, s - h, b)) / (2 * h); };
/** kiểm chứng độc lập: tích phân số B_u trên mặt đĩa bán kính b */
export function flux1Numeric(Br, s, b = COIL.b, n = 400) { const {L, M} = MAG, dI = Br * L / MU0 / M; let f = 0; for (let j = 0; j < n; j++) { const rho = (j + 0.5) / n * b; let bu = 0; for (let i = 0; i < M; i++) bu += loopField(MAG.a, dI, -(s - (-L / 2 + (i + 0.5) * L / M)) * -1, rho)[0]; f += bu * 2 * Math.PI * rho * (b / n); } return f; }
export const PRESETS = [
  {id: 'a', vi: 'Kéo nam châm xuống đều 0,6 m/s', note: 'N = 300, R = 10 Ω: kim lệch rồi đổi chiều', mode: 'motor', v: 0.6, N: 300, R: 10, flip: false},
  {id: 'b', vi: 'Thả rơi, mạch HỞ', note: 'không có dòng điện: rơi tự do, t = √(2h/g)', mode: 'fall', v: 0, N: 300, R: 2, open: true},
  {id: 'c', vi: 'Thả rơi, mạch KÍN', note: 'dòng cảm ứng hãm nam châm (Lenz)', mode: 'fall', v: 0, N: 300, R: 2, open: false},
];
export const createModel = () => ({hand: true, mode: 'motor', Br: 0.4, N: 300, R: 10, vHit: 0, open: false, flip: false, s: S_TOP, v: 0, vcmd: 0, t: 0, released: false, fell: false, tFall: 0, running: true, speed: 1, rows: [], hist: [], emax: 0, heat: 0, e: 0, i: 0, phi: 0, F: 0, tAt: 0, hit: false});
/** từ thông qua cuộn (pháp tuyến hướng LÊN) – nam châm N hướng xuống (flip = N hướng lên). Φ_up = −Φ_u cho N xuống. */
export const phiUp = (s, sPos = s.s) => -(s.flip ? -1 : 1) * s.N * flux1(s.Br, sPos);
export const emfAt = (s) => { const d = dFlux1(s.Br, s.s) * (s.flip ? -1 : 1); return s.N * d * s.v; }; // e = −dΦ_up/dt = +N·dΦ_u/ds·v (v = ds/dt, s tăng khi nam châm đi LÊN)
export function reset(s) { Object.assign(s, {s: S_TOP, v: 0, vHit: 0, vcmd: 0, t: 0, released: false, fell: false, tFall: 0, emax: 0, heat: 0, hist: [], hit: false}); s.phi = phiUp(s); s.e = 0; s.i = 0; s.F = 0; }
/** một bước dt (RK đơn giản, h nhỏ): mode 'motor' đặt vận tốc; mode 'fall' chịu trọng lực + lực hãm */
export function advance(s, dt) {
  if (!s.running) return; let left = Math.min(dt * s.speed, 0.1);
  while (left > 1e-9) {
    const h = Math.min(left, 0.0005); left -= h;
    const d = dFlux1(s.Br, s.s) * (s.flip ? -1 : 1), k = s.N * d; // k = N·dΦ_u/ds (Wb/m)
    if (s.mode === 'motor') { s.v += (-s.vcmd - s.v) * (1 - Math.exp(-h / 0.04)); s.s = Math.min(COIL.tube, Math.max(-COIL.tube, s.s + s.v * h)); if (Math.abs(s.s) >= COIL.tube) s.v = 0; }
    else if (s.released && !s.hit) { const Rb = s.open ? Infinity : s.R, Fb = s.open ? 0 : -(k * k) * s.v / Rb; s.v += (-G + Fb / MAG.m) * h; s.s += s.v * h; s.tFall += h; if (s.s <= S_BOT) { s.s = S_BOT; s.hit = true; s.vHit = s.v; s.v = 0; } }
    else s.v = 0;
    const e = k * s.v; s.e = e; s.i = s.open ? 0 : e / s.R; s.F = s.open ? 0 : -(k * k) * s.v / s.R; if (!s.open) s.heat += e * e / s.R * h; s.emax = Math.max(s.emax, Math.abs(e)); s.t += h;
  }
  s.phi = phiUp(s);
  const last = s.hist[s.hist.length - 1]; if (!last || s.t - last.t >= 0.01) { s.hist.push({t: s.t, phi: s.phi, e: s.e, i: s.i}); if (s.hist.length > 700) s.hist.shift(); }
}
export const release = (s) => { if (s.mode === 'fall' && !s.released) { s.released = true; s.v = 0; s.tFall = 0; s.heat = 0; s.emax = 0; } };
export function readout(s) {
  const Ek = 0.5 * MAG.m * s.v * s.v, Ep = MAG.m * G * (s.s - S_BOT);
  return {KEhit: 0.5 * MAG.m * s.vHit * s.vHit, s: s.s, v: s.v, phi: s.phi, e: s.e, i: s.i, F: s.F, emax: s.emax, heat: s.heat, tFall: s.tFall, hit: s.hit, released: s.released, mode: s.mode, open: s.open, N: s.N, R: s.R, Br: s.Br, flip: s.flip, Ek, Ep, E0: MAG.m * G * (S_TOP - S_BOT), rows: s.rows, hist: s.hist, inside: Math.abs(s.s) < 0.12, direction: s.e > 1e-5 ? 1 : s.e < -1e-5 ? -1 : 0, settled: Math.abs(s.v) < 0.02 && Math.abs(s.e) < 5e-3};
}
export function record(s) { s.rows.push({v: Math.abs(s.vcmd) || Math.abs(s.v), N: s.N, R: s.R, emax: s.emax}); return s.emax > 0; }

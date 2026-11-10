// VL12-B7: (1) máy phát điện xoay chiều: khung dây quay đều trong từ trường đều: Φ = N·B·S·cosθ, e = −dΦ/dt = N·B·S·ω·sinθ, θ = ω·t;
//          (2) máy biến áp: phasor của mạch tương đương (điện trở cuộn dây R1, R2; điện cảm từ hoá Lm; tổn hao sắt Rc) → U2/U1 ≈ N2/N1, I1/I2 ≈ N2/N1, hiệu suất.
export const D2R = Math.PI / 180;
export const GEN = {S: 0.008, rPerTurn: 0.01}; // S = 0,08 m × 0,10 m; điện trở khung r = 0,01 Ω mỗi vòng
export const TR = {f: 50, R1pt: 0.006, R2pt: 0.006, AL: 2e-5, Rc500: 20000}; // R1 = 0,006·N1 (Ω); Lm = A_L·N1² (≈ 5 H với 500 vòng); Rc = 20000·(N1/500)² (Ω)
export const RANGE = {n: [0.2, 5], N: [50, 500], B: [0.05, 0.3], RL: [2, 100], N1: [100, 1000], N2: [50, 2000], U1: [2, 24], RLt: [2, 1000]};
export const createModel = () => ({mode: 'gen', n: 2, N: 200, B: 0.2, RL: 20, th: 0, N1: 500, N2: 100, U1: 20, RLt: 100, loaded: true, idealT: false, hist: [], t: 0, speed: 1, run: true, rows: [], ph: 0});
// ---------------- máy phát ----------------
export const omega = (s) => 2 * Math.PI * s.n;
export const E0 = (s) => s.N * s.B * GEN.S * omega(s);
export const phiAt = (s, th = s.th) => s.N * s.B * GEN.S * Math.cos(th); // từ thông toàn phần qua cuộn (Wb)
export const emfAt = (s, th = s.th) => E0(s) * Math.sin(th);
export const rCoil = (s) => GEN.rPerTurn * s.N;
export const I0 = (s) => E0(s) / (rCoil(s) + s.RL);
export const iAt = (s, th = s.th) => emfAt(s, th) / (rCoil(s) + s.RL);
export const Prms = (s) => 0.5 * I0(s) ** 2 * s.RL;
// ---------------- máy biến áp (phasor) ----------------
const c = (re, im = 0) => ({re, im});
const add = (a, b) => c(a.re + b.re, a.im + b.im), mul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), inv = (a) => { const d = a.re * a.re + a.im * a.im; return c(a.re / d, -a.im / d); }, scl = (a, k) => c(a.re * k, a.im * k), abs = (a) => Math.hypot(a.re, a.im);
export function transformer(s, ideal = false) {
  const N1 = s.N1, N2 = s.N2, a = N1 / N2, w = 2 * Math.PI * TR.f, RL = s.loaded ? s.RLt : 1e12, R1 = ideal ? 0 : TR.R1pt * N1, R2 = ideal ? 0 : TR.R2pt * N2, Xm = ideal ? 1e12 : w * TR.AL * N1 * N1, Rc = ideal ? 1e12 : TR.Rc500 * (N1 / 500) ** 2;
  const U1 = c(s.U1), ZL = c(a * a * (R2 + RL)), Ym = add(c(1 / Rc), c(0, -1 / Xm)), Yp = add(Ym, inv(ZL)), Zp = inv(Yp), Zin = add(c(R1), Zp);
  const I1 = mul(U1, inv(Zin)), Vm = add(U1, scl(mul(I1, c(R1)), -1)), I2p = mul(Vm, inv(ZL)), I2 = scl(I2p, a), U2 = scl(mul(Vm, c(RL / (R2 + RL))), 1 / a), Im = mul(Vm, Ym);
  const P1 = U1.re * I1.re + U1.im * I1.im, P2 = RL < 1e11 ? abs(I2) ** 2 * RL : 0, Pcu1 = abs(I1) ** 2 * R1, Pcu2 = abs(I2) ** 2 * R2, Pcore = abs(Vm) ** 2 / Rc;
  return {U1: s.U1, U2: abs(U2), I1: abs(I1), I2: abs(I2), P1, P2, Pcu1, Pcu2, Pcore, eff: P1 > 1e-12 ? P2 / P1 : 0, ratio: abs(U2) / s.U1, ideal: N2 / N1, Iratio: abs(I2) > 1e-12 ? abs(I1) / abs(I2) : NaN, phase: Math.atan2(U2.im, U2.re) - Math.atan2(U1.im, U1.re), Im: abs(Im), Vm: abs(Vm), R1, R2};
}
export function advance(s, dt) {
  if (!s.run) return; const h = dt * s.speed;
  if (s.mode === 'gen') { s.th += omega(s) * h; if (s.th > 1e6) s.th %= 2 * Math.PI; s.t += h; const last = s.hist[s.hist.length - 1]; if (!last || s.t - last.t >= 0.01 / Math.max(1, s.n / 2)) { s.hist.push({t: s.t, phi: phiAt(s), e: emfAt(s), i: iAt(s)}); if (s.hist.length > 400) s.hist.shift(); } }
  else { s.ph += 2 * Math.PI * 1.0 * h; s.t += h; }
}
export function readout(s) {
  const g = {th: s.th % (2 * Math.PI), phi: phiAt(s), e: emfAt(s), i: iAt(s), E0: E0(s), Erms: E0(s) / Math.SQRT2, I0: I0(s), Irms: I0(s) / Math.SQRT2, f: s.n, T: 1 / s.n, P: Prms(s), r: rCoil(s), omega: omega(s)}, t = transformer(s, s.idealT);
  return {mode: s.mode, g, t, N: s.N, B: s.B, n: s.n, RL: s.RL, N1: s.N1, N2: s.N2, U1: s.U1, RLt: s.RLt, loaded: s.loaded, hist: s.hist, rows: s.rows, ph: s.ph};
}
export const PRESETS = [
  {id: 'g', vi: 'Máy phát: N = 200, B = 0,2 T, n = 2 vòng/s', note: 'E₀ = NBSω ≈ 4,0 V; f = 2 Hz', mode: 'gen', n: 2, N: 200, B: 0.2, RL: 20},
  {id: 'h', vi: 'Biến áp hạ áp 500 : 100', note: 'U₁ = 20 V → U₂ ≈ 4 V', mode: 'tr', N1: 500, N2: 100, U1: 20, RLt: 100, loaded: true},
  {id: 'k', vi: 'Biến áp tăng áp 200 : 1000', note: 'U₂ ≈ 10·U₁ khi hở (≈ 8,8·U₁ khi có tải); I₂ ≈ I₁/10', mode: 'tr', N1: 200, N2: 1000, U1: 12, RLt: 500, loaded: true},
];
export const record = (s) => { const r = readout(s); s.rows.push(s.mode === 'gen' ? {mode: 'gen', n: s.n, N: s.N, B: s.B, E0: r.g.E0, f: r.g.f} : {mode: 'tr', N1: s.N1, N2: s.N2, U1: s.U1, U2: r.t.U2, I1: r.t.I1, I2: r.t.I2}); return true; };

// W3: an electromagnetic wave. E = E0·sin(2π(x/λ − ft)), B = E/c (in phase), E ⟂ B ⟂ direction. λ = c/f.
export const C = 3e8, E_RANGE = [4, 22], E0_RANGE = [1, 10];
export const REGIONS = [
  {id: 'radio', vi: 'Sóng vô tuyến', lamMin: 1, lamMax: Infinity, col: '#8e44ad', use: 'phát thanh, truyền hình, điện thoại di động, radar', ex: 'sóng FM 100 MHz'},
  {id: 'micro', vi: 'Vi sóng', lamMin: 1e-3, lamMax: 1, col: '#2b59c3', use: 'lò vi sóng, Wi-Fi, truyền thông vệ tinh', ex: 'lò vi sóng 2,45 GHz'},
  {id: 'ir', vi: 'Hồng ngoại', lamMin: 760e-9, lamMax: 1e-3, col: '#c0392b', use: 'điều khiển từ xa, camera nhiệt, sưởi ấm', ex: 'bức xạ của cơ thể người'},
  {id: 'vis', vi: 'Ánh sáng nhìn thấy', lamMin: 380e-9, lamMax: 760e-9, col: '#2c9a4b', use: 'thị giác, chiếu sáng, quang hợp', ex: 'ánh sáng vàng 600 nm'},
  {id: 'uv', vi: 'Tử ngoại', lamMin: 10e-9, lamMax: 380e-9, col: '#6c5ce7', use: 'diệt khuẩn, tạo vitamin D, đèn huỳnh quang', ex: 'tia UV từ Mặt Trời'},
  {id: 'xray', vi: 'Tia X', lamMin: 1e-11, lamMax: 10e-9, col: '#2d3436', use: 'chụp X-quang y tế, kiểm tra hành lí', ex: 'máy X-quang'},
  {id: 'gamma', vi: 'Tia gamma', lamMin: 0, lamMax: 1e-11, col: '#e17055', use: 'xạ trị, khử trùng, nghiên cứu hạt nhân', ex: 'phân rã hạt nhân'},
];
export const PRESETS = [
  {id: 'a', vi: 'Sóng FM 100 MHz', note: 'vô tuyến: λ = 3 m', e: 8, E0: 3},
  {id: 'b', vi: 'Lò vi sóng 2,45 GHz', note: 'vi sóng: λ ≈ 12 cm', e: Math.log10(2.45e9), E0: 3},
  {id: 'c', vi: 'Ánh sáng vàng 600 nm', note: 'nhìn thấy: f = 5·10¹⁴ Hz', e: Math.log10(5e14), E0: 3},
  {id: 'd', vi: 'Tia X trong y tế', note: 'f ≈ 3·10¹⁸ Hz, λ ≈ 0,1 nm', e: Math.log10(3e18), E0: 3},
];
export const createModel = () => ({e: 8, E0: 3, theta: 0, t: 0, speed: 1, frozen: false});
export const freq = (s) => Math.pow(10, s.e);
export const lam = (s) => C / freq(s);
export const regionOf = (l) => REGIONS.find((r) => l >= r.lamMin && l < r.lamMax) || REGIONS[REGIONS.length - 1];
/** the picture is not to scale: visual wavelength 0.3…1.4 m, increasing with the real one (log scale) */
export const lamVis = (s) => 0.3 + (1.1 * (Math.log10(lam(s)) + 13)) / 16;
export const FV = 0.35; // visual frequency (Hz) so that the wave always moves at a watchable speed
export const advance = (s, dt) => { if (!s.frozen) s.t += Math.min(dt, 0.1) * s.speed; };
export const restart = (s) => { s.t = 0; };
export const Eat = (s, x, t = s.t) => s.E0 * Math.sin(2 * Math.PI * (x / lamVis(s) - FV * t));
export function fmtHz(f) { const u = [[1e18, 'EHz'], [1e15, 'PHz'], [1e12, 'THz'], [1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz']]; for (const [k, n] of u) if (f >= k * 0.9999) return [f / k, n]; return [f, 'Hz']; }
export function fmtLen(l) { const u = [[1e3, 'km'], [1, 'm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm']]; for (const [k, n] of u) if (l >= k * 0.9999) return [l / k, n]; return [l * 1e15, 'fm']; }
export function readout(s) {
  const f = freq(s), l = lam(s), reg = regionOf(l), B0 = s.E0 / C, lamV = lamVis(s), th = (s.theta * Math.PI) / 180, lamp = Math.cos(th) ** 2, Ex = Eat(s, 1.0);
  return {f, lam: l, reg, E0: s.E0, B0, nT: B0 * 1e9, theta: s.theta, lamp, lamV, c: f * l, t: s.t, Ex, e: s.e};
}
export const ideal = {lam: (f) => C / f, B0: (E0) => E0 / C, f: (l) => C / l};

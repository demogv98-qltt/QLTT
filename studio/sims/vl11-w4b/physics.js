// W4B: Young's double slit. I(x) = cos²(π·a·x/(λD)) (ideal narrow slits); bright at x = k·i, dark at x = (k + ½)·i, i = λD/a.
export const WL = [400, 700], A_RANGE = [0.2, 1.0], D_RANGE = [0.5, 3.0], HALF = 0.03; // nm, mm, m, half window on the screen (m)
export const PRESETS = [
  {id: 'a', vi: 'Laser đỏ 650 nm', note: 'a = 0,5 mm, D = 2 m → i = 2,6 mm', wl: 650, a: 0.5, D: 2, white: false, x: 2.6},
  {id: 'b', vi: 'Laser lam 450 nm', note: 'cùng a, D → vân sát nhau hơn: i = 1,8 mm', wl: 450, a: 0.5, D: 2, white: false, x: 1.8},
  {id: 'c', vi: 'Ánh sáng trắng', note: 'vân trung tâm trắng, hai bên có màu', wl: 550, a: 0.5, D: 2, white: true, x: 0},
];
export const createModel = () => ({wl: 600, a: 0.5, D: 2, white: false, x: 0, speed: 1, t: 0});
export const lamM = (s) => s.wl * 1e-9, aM = (s) => s.a * 1e-3;
export const fringe = (s) => (lamM(s) * s.D) / aM(s); // i, metres
export const intensity = (s, x, wl = s.wl) => Math.cos((Math.PI * aM(s) * x) / ((wl * 1e-9) * s.D)) ** 2;
/** approximate colour of a wavelength (nm) → [r, g, b] in 0..1 */
export function wlRGB(w) {
  let r = 0, g = 0, b = 0;
  if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else if (w <= 780) { r = 1; }
  let f = 1; if (w < 420) f = 0.3 + (0.7 * (w - 380)) / 40; else if (w > 700) f = 0.3 + (0.7 * (780 - w)) / 80;
  return [Math.pow(r * f, 0.8), Math.pow(g * f, 0.8), Math.pow(b * f, 0.8)];
}
/** colour of the screen at x (metres): monochromatic = laser colour × I; white = sum over wavelengths, normalised so that the centre is white */
export function pixel(s, x) {
  if (!s.white) { const c = wlRGB(s.wl), m = Math.max(c[0], c[1], c[2], 1e-6), I = intensity(s, x); return c.map((v) => Math.min(1, (v / m) * I)); }
  let R = 0, G = 0, B = 0, nR = 0, nG = 0, nB = 0;
  for (let w = 380; w <= 750; w += 10) { const c = wlRGB(w), I = intensity(s, x, w); R += c[0] * I; G += c[1] * I; B += c[2] * I; nR += c[0]; nG += c[1]; nB += c[2]; }
  return [Math.min(1, R / nR), Math.min(1, G / nG), Math.min(1, B / nB)].map((v) => Math.pow(v, 0.85));
}
export function advance(s, dt) { s.t += Math.min(dt, 0.1) * s.speed; }
export function readout(s) {
  const i = fringe(s), q = s.x * 1e-3 / i, k = Math.round(q), frac = Math.abs(q - k), kind = frac < 0.08 ? 'max' : Math.abs(frac - 0.5) < 0.08 ? 'min' : 'mid';
  let nB = 0; for (let n = -60; n <= 60; n++) if (Math.abs(n * i) <= HALF + 1e-12) nB++;
  const dd = (aM(s) * s.x * 1e-3) / s.D, iR = (700e-9 * s.D) / aM(s), iV = (400e-9 * s.D) / aM(s);
  return {wl: s.wl, a: s.a, D: s.D, white: s.white, i, iMm: i * 1e3, xP: s.x, q, order: kind === 'max' ? k : Math.floor(q), kind, I: s.white ? null : Math.cos(Math.PI * q) ** 2, dd, ddLam: s.white ? null : dd / lamM(s), nBright: nB, iR: iR * 1e3, iV: iV * 1e3, rgb: s.white ? [1, 1, 1] : wlRGB(s.wl), t: s.t};
}
export const ideal = {i: (wl, a, D) => (wl * 1e-9 * D) / (a * 1e-3), lam: (a, i, D) => (a * 1e-3 * i * 1e-3 / D) * 1e9};

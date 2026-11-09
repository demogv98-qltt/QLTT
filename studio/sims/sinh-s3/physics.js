// S3: the cardiac cycle. One state (phase of the cycle, heart rate) drives every volume, pressure, valve and the ECG.
// Teaching timing (KHTN 8): T = 60/HR; atrial systole 1/8 T (0,1 s at 75/min), ventricular systole 3/8 T (0,3 s), common diastole 1/2 T (0,4 s).
export const HR_RANGE = [40, 180], EDV = 120, ESV = 50, SV = EDV - ESV, MMHG = {sys: 120, dia: 80};
export const F_ATR = 0.125, F_VEN = 0.375;
export const PRESETS = [
  {id: 'a', short: 'Nghỉ ngơi', vi: 'Lúc nghỉ ngơi', note: '75 nhịp/phút · chu kì 0,8 s', hr: 75},
  {id: 'b', short: 'Chạy bộ', vi: 'Chạy bộ', note: '120 nhịp/phút · chu kì 0,5 s', hr: 120},
  {id: 'c', short: 'Vận động viên', vi: 'Nghỉ sâu (vận động viên)', note: '50 nhịp/phút · chu kì 1,2 s', hr: 50},
];
export const createModel = () => ({hr: 75, phi: 0, t: 0, speed: 1, paused: false, sound: true, flow: 'on', beats: 0, labMode: 0});
const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
/** phase name and local progress for a cycle fraction f in [0,1) */
export function phaseOf(f) {
  if (f < F_ATR) return {id: 'atrial', vi: 'Tâm nhĩ co', k: f / F_ATR};
  if (f < F_ATR + F_VEN) return {id: 'ventricular', vi: 'Tâm thất co', k: (f - F_ATR) / F_VEN};
  return {id: 'diastole', vi: 'Dãn chung', k: (f - F_ATR - F_VEN) / (1 - F_ATR - F_VEN)};
}
export function advance(s, dt) {
  if (s.paused) return; const T = 60 / s.hr, h = Math.min(dt, 0.1) * s.speed, old = s.phi; s.t += h; s.phi += h / T;
  if (s.phi >= 1) { s.phi -= Math.floor(s.phi); s.beats++; }
  s.prev = old;
}
/** jump to a representative moment of a phase (middle of atrial systole, ejection, and filling) and hold it */
export function setPhase(s, id) { s.phi = id === 'atrial' ? F_ATR * 0.5 : id === 'ventricular' ? F_ATR + F_VEN * 0.4 : F_ATR + F_VEN + 0.12; s.paused = true; }
export function readout(s) {
  const f = s.phi, T = 60 / s.hr, ph = phaseOf(f), k = ph.k;
  // atrial fill 0..1 (1 = full) and ventricular volume
  let atr, vol, iso = false;
  if (ph.id === 'atrial') { atr = 1 - 0.55 * sm(k); vol = 105 + (EDV - 105) * sm(k); }
  else if (ph.id === 'ventricular') { atr = 0.45 + 0.55 * sm(k); iso = k < 0.1; vol = iso ? EDV : EDV - SV * sm((k - 0.1) / 0.9); }
  else { atr = 1 - 0 * k; vol = ESV + (105 - ESV) * (1 - Math.exp(-4 * k)) / (1 - Math.exp(-4)); atr = 0.9 + 0.1 * k; }
  const ven = (EDV - vol) / SV; // 0 relaxed, 1 fully contracted (for ventricle size)
  const avOpen = ph.id !== 'ventricular', slOpen = ph.id === 'ventricular' && !iso;
  // pressures (mmHg): left ventricle and aorta. Aortic pressure rises to 120 during ejection and decays toward 80 in diastole.
  const aoSys = (q) => 80 + (q < 0.45 ? 40 * Math.sin((Math.PI / 2) * Math.max(0, (q - 0.1) / 0.35)) : 40 - 15 * (q - 0.45) / 0.55);
  let plv, pao;
  if (ph.id === 'ventricular') { pao = k < 0.1 ? 80 : aoSys(k); plv = k < 0.1 ? 10 + 70 * sm(k / 0.1) : pao + 3 * Math.sin(Math.PI * Math.min(1, (k - 0.1) / 0.9)); }
  else if (ph.id === 'diastole') { pao = 80 + 25 * Math.exp(-2.5 * k); plv = 10 + 95 * Math.exp(-25 * k) - 6 * (1 - Math.exp(-25 * k)) * 0; }
  else { pao = 82 - 2 * k; plv = 4 + 6 * k; }
  pao = Math.max(80, Math.min(121, pao)); plv = Math.min(122, plv);
  // sound events: S1 when the ventricles begin to contract, S2 at the end of ventricular systole
  const sound = ph.id === 'ventricular' && k < 0.05 ? 'S1' : ph.id === 'diastole' && k < 0.05 ? 'S2' : null;
  return {hr: s.hr, T, f, ph, atr, vol, ven, iso, avOpen, slOpen, plv, pao, sound, sv: SV, co: (s.hr * SV) / 1000, beats: s.beats, tAtr: F_ATR * T, tVen: F_VEN * T, tDia: (1 - F_ATR - F_VEN) * T,
    ecg: ecg(f), paused: s.paused};
}
/** schematic ECG (mV) for cycle fraction f: P wave before atrial systole, QRS at ventricular onset, T wave late in systole */
export function ecg(f) {
  const g = (c, w, a) => a * Math.exp(-(((f + 1) % 1 - c) ** 2) / (2 * w * w)), wrap = (c, w, a) => g(c, w, a) + g(c + 1, w, a) + g(c - 1, w, a);
  return wrap(0.04, 0.018, 0.14) + wrap(0.115, 0.007, -0.12) + wrap(0.135, 0.009, 1.0) + wrap(0.155, 0.008, -0.25) + wrap(0.40, 0.04, 0.3);
}
export const ideal = {T: (hr) => 60 / hr, co: (hr) => (hr * SV) / 1000, beatsPerHour: (hr) => hr * 60, dia: (hr) => (60 / hr) * (1 - F_ATR - F_VEN)};

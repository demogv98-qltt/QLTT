// KHTN8-LV01: the lever's whole truth. Rigid-body rotation about the fulcrum O, no three.js in here.
// Everything on screen (pose, arrows, gauges, charts) reads from this one state.
//   θ > 0 : beam turns counter-clockwise seen from the front, the left end O1 goes down.
//   Both forces are vertical (a cable from a tension actuator, a hanging weight), so a force at beam distance d has
//   lever arm d·cosθ. Balance (F1·d1 = F2·d2) therefore holds at every angle.
export const G = 9.81;
export const LIM = (25 * Math.PI) / 180; // mechanical stops, ±25°
export const RANGE = {F1: [0, 100], d1: [0.1, 1], F2: [10, 100], d2: [0.1, 1]};

export const P = {
  beamMass: 3.0, // kg, 2.0 m aluminium I-beam
  beamLen: 2.0,
  carriageMass: 0.5, // kg each (clamp, rack-and-pinion, sensor, hook)
  hangerMass: 0.25, // kg, hook + hanger bar on O2 (already inside the F2 reading)
  damping: 1.4, // N·m·s/rad, bearing + air
  restore: 2.0, // N·m/rad, pivot a hair above the beam's centre of mass
  bounce: 0.22, // restitution at the stops
  carriageSpeed: 0.8, // m/s, the positioning motors
  forceLag: 0.12, // s, actuator and weight-stack response
};

export const PRESETS = [
  {id: 'balance', vi: 'Cân bằng chuẩn', en: 'Standard balance', note: 'τ₁ = τ₂', F1: 40, d1: 0.6, F2: 60, d2: 0.4},
  {id: 'advantage', vi: 'Đòn bẩy lợi về lực', en: 'Force advantage', note: 'd₁ > d₂, lực nhỏ nâng vật nặng', F1: 20, d1: 0.9, F2: 60, d2: 0.3},
  {id: 'unbalance', vi: 'Mất cân bằng động', en: 'Dynamic imbalance', note: 'τ₁ ≠ τ₂, quay có gia tốc', F1: 70, d1: 0.8, F2: 40, d2: 0.5},
];

export function createModel(preset = PRESETS[0]) {
  const s = {
    cmd: {F1: preset.F1, d1: preset.d1, F2: preset.F2, d2: preset.d2},
    F1: preset.F1, d1: preset.d1, F2: preset.F2, d2: preset.d2,
    theta: 0, omega: 0, alpha: 0, tauNet: 0, atStop: 0, time: 0,
  };
  return s;
}

export function inertia(s) {
  const {beamMass: M, beamLen: L, carriageMass: c, hangerMass: h} = P;
  const load = s.F2 / G; // kg hanging on O2
  return (M * L * L) / 12 + c * (s.d1 * s.d1 + s.d2 * s.d2) + (load + h) * s.d2 * s.d2;
}

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const approach = (v, to, step) => v + clamp(to - v, -step, step);

/** One fixed step. Semi-implicit Euler at 1/240 s is plenty for ω0 ≈ 1 rad/s and stiff stops. */
export function step(s, dt) {
  const k = 1 - Math.exp(-dt / P.forceLag);
  s.F1 += (s.cmd.F1 - s.F1) * k;
  s.F2 += (s.cmd.F2 - s.F2) * k;
  s.d1 = approach(s.d1, s.cmd.d1, P.carriageSpeed * dt);
  s.d2 = approach(s.d2, s.cmd.d2, P.carriageSpeed * dt);

  const c = Math.cos(s.theta);
  const tau1 = s.F1 * s.d1 * c;
  const tau2 = s.F2 * s.d2 * c;
  s.tauNet = tau1 - tau2 - P.restore * Math.sin(s.theta) - P.damping * s.omega;
  s.alpha = s.tauNet / inertia(s);
  s.omega += s.alpha * dt;
  s.theta += s.omega * dt;
  s.atStop = 0;
  if (s.theta >= LIM) {
    s.theta = LIM;
    s.atStop = 1;
    if (s.omega > 0) s.omega = Math.abs(s.omega) < 0.15 ? 0 : -P.bounce * s.omega;
  } else if (s.theta <= -LIM) {
    s.theta = -LIM;
    s.atStop = -1;
    if (s.omega < 0) s.omega = Math.abs(s.omega) < 0.15 ? 0 : -P.bounce * s.omega;
  }
  s.time += dt;
}

export function advance(s, dt) {
  let left = Math.min(dt, 0.1);
  while (left > 1e-9) {
    const h = Math.min(left, 1 / 240);
    step(s, h);
    left -= h;
  }
}

/** Every number the panels show, derived from the state and nothing else. */
export function readout(s) {
  const tau1 = s.F1 * s.d1;
  const tau2 = s.F2 * s.d2;
  const net = tau1 - tau2; // static, nominal arms
  return {
    F1: s.F1, d1: s.d1, tau1, F2: s.F2, d2: s.d2, tau2, net,
    kForce: s.F1 > 0.05 ? s.F2 / s.F1 : Infinity, // lợi về lực k = F2/F1
    kArm: s.d1 / s.d2, // = d1/d2 at balance
    theta: s.theta, omega: s.omega, alpha: s.alpha, tauDyn: s.tauNet, atStop: s.atStop,
    balanced: Math.abs(net) < 0.02 * Math.max(tau1, tau2, 1),
    // load-cell stress 0..1: the pivot carries F1+F2, the torsion cell sees the unbalanced moment
    stress: clamp(0.25 * ((s.F1 + s.F2) / 200) + 0.75 * Math.min(1, Math.abs(s.tauNet) / 40), 0, 1),
    reaction: s.F1 + s.F2 + (P.beamMass + 2 * P.carriageMass + P.hangerMass) * G,
  };
}

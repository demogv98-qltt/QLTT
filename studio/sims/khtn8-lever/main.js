// KHTN8-LV01 live page: a lever on a fulcrum you can take apart. One physics state drives the pose, the vectors and
// every gauge. Left alone it tours itself (camera, teardown, presets); any click, drag, wheel or key hands control
// to the visitor and 25 s of quiet hands it back (while AUTO-TOUR is on).
import {keyed} from 'teardown-kit/util.js';
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {advance, createModel, LIM, PRESETS, RANGE, readout} from './physics.js';
import {createRig} from './rig.js';
import {createStage} from './stage.js';
import {createUI, CSS} from './ui.js';

const W = 1600;
const H = 900;
const IDLE = 25;
const D2R = Math.PI / 180;
const OR = '#e8590c';
const TL = '#0b8f8c';
const INK = '#14303c';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => {
  const k = clamp(x, 0, 1);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};

const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'
  .split(',').map((c) => 'U+' + c).join(',');
const GR = 'U+0370-03FF';
const face = (family, weight, data, range) => `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${range}}`;
const style = document.createElement('style');
style.textContent = [
  face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI),
  face('JetBrains Mono', 400, grFont400, GR), face('JetBrains Mono', 700, grFont700, GR),
  face('Inter', '100 900', viInter, VI), CSS,
].join('\n');
document.head.appendChild(style);
document.title = 'KHTN8-LV01 · Đòn bẩy và Mômen lực (Teardown)';

const VIEWS = {
  hero: [20, 12, 5.6, 0, 0.9, 0],
  fulcrum: [24, 9, 3.0, 0, 1.2, 0.1],
  vectors: [0, 6, 5.0, 0, 1.0, 0],
  rack: [16, 8, 1.8, -0.6, 1.2, 0.08],
};
// the auto tour: camera keys, and operator events at fixed times
const DURATION = 46;
const CAM_KEYS = [
  [0, VIEWS.hero], [6, [40, 14, 6.0, 0, 0.95, 0]], [9.5, VIEWS.fulcrum], [17, [-20, 8, 1.9, 0, 1.2, 0.15]],
  [20, VIEWS.rack], [24, [8, 6, 3.4, -0.3, 1.1, 0.1]], [27, VIEWS.vectors], [36, VIEWS.vectors], [40, [28, 12, 5.6, 0, 0.95, 0]], [DURATION, VIEWS.hero],
];
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [10, 'td', true], [29, 'preset', 2], [36, 'preset', 0], [39, 'td', false]];

const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.id = 'gl';
app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
rig.root.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = o.castShadow !== false;
  }
});
const model = createModel(PRESETS[0]);

// ------------------------------------------------------------ state
let T = 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const DUR_TD = 1.8;
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0;
let target = [...VIEWS.hero];
let viewName = 'hero';
const cam = {az: VIEWS.hero[0], el: VIEWS.hero[1], d: VIEWS.hero[2], tx: 0, ty: 0.95, tz: 0};
let preset = 0;
const hist = {tau1: [], tau2: [], theta: [], omega: [], acc: 0};

const ui = createUI(app, {
  cmd(key, v) {
    userInput();
    model.cmd[key] = clamp(v, RANGE[key][0], RANGE[key][1]);
    preset = -1;
    ui.setPreset(-1);
  },
  preset(i) {
    userInput();
    applyPreset(i);
  },
  teardown() {
    userInput();
    setTd(!tdS.on);
  },
  tour() {
    if (tour.run) {
      tour.enabled = false;
      tour.run = false;
    } else {
      tour.enabled = true;
      startTour();
    }
    lastInput = T;
  },
  view(v) {
    userInput();
    setView(v);
  },
});

function applyPreset(i) {
  const p = PRESETS[i];
  Object.assign(model.cmd, {F1: p.F1, d1: p.d1, F2: p.F2, d2: p.d2});
  Object.assign(model, {F1: p.F1, d1: p.d1, F2: p.F2, d2: p.d2}); // a preset is a clean start: no actuator transient
  model.theta = 0;
  model.omega = 0;
  preset = i;
  ui.setPreset(i);
}
function setTd(on) {
  tdS.from = tdS.v;
  tdS.on = on;
  tdS.t0 = T;
}
function setView(v) {
  viewName = v;
  target = [...VIEWS[v]];
  ui.setView(v);
}
function startTour() {
  tour.run = true;
  tour.t0 = T;
  tour.ev = 0;
}
function userInput() {
  lastInput = T;
  if (tour.run) {
    tour.run = false;
    target = [cam.az, cam.el, cam.d, cam.tx, cam.ty, cam.tz];
  }
}
addEventListener('pointerdown', (e) => {
  if (e.target.closest?.('#b-tour')) return;
  userInput();
});
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click();
  else if (k === 'a') ui.root.querySelector('#b-tour').click();
  else if (k === 'r') {
    userInput();
    model.theta = 0;
    model.omega = 0;
  } else if ('1234'.includes(k) && k) {
    userInput();
    setView(['hero', 'fulcrum', 'vectors', 'rack'][Number(k) - 1]);
  } else return;
  e.preventDefault();
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = {x: e.clientX, y: e.clientY};
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('drag');
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  target[0] -= ((e.clientX - drag.x) / scale) * 0.3;
  target[1] = clamp(target[1] + ((e.clientY - drag.y) / scale) * 0.2, -10, 85);
  drag = {x: e.clientX, y: e.clientY};
  lastInput = T;
});
const endDrag = () => {
  drag = null;
  canvas.classList.remove('drag');
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  userInput();
  target[2] = clamp(target[2] * Math.exp(e.deltaY * 0.0012), 0.9, 9);
}, {passive: false});

// ------------------------------------------------------------ quality tiers and fit
const TIERS = [{pr: 2, shadow: 2048}, {pr: 1.5, shadow: 1024}, {pr: 1, shadow: 1024}];
let tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
let scale = 1;
const fit = () => {
  scale = Math.min(innerWidth / W, innerHeight / H);
  app.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`;
  st.setQuality({pr: clamp((devicePixelRatio || 1) * scale, 0.75, TIERS[tier].pr), shadow: TIERS[tier].shadow});
};
fit();
addEventListener('resize', fit);

// ------------------------------------------------------------ labels
const proj = (name) => st.project(rig.worldPt(name));
function labelItems(r, td) {
  const vec = clamp((td - 0.15) / 0.5, 0, 1);
  const part = clamp((td - 0.8) / 0.2, 0, 1);
  const items = [];
  const at = (id, name, o) => {
    const p = proj(name);
    items.push({id, x: p.x, y: p.y, visible: p.visible, ...o});
  };
  at('F1', 'F1', {text: `F₁ = ${r.F1.toFixed(0)} N`, sub: 'Lực tác dụng', color: OR, dy: 38, a: vec});
  at('F2', 'F2', {text: `F₂ = ${r.F2.toFixed(0)} N`, sub: 'Trọng lượng tải', color: TL, dy: 38, a: vec});
  at('d1', 'd1', {text: `d₁ = ${r.d1.toFixed(2)} m`, sub: 'Cánh tay đòn', color: OR, dy: -30, a: vec});
  at('d2', 'd2', {text: `d₂ = ${r.d2.toFixed(2)} m`, sub: 'Cánh tay đòn', color: TL, dy: -30, a: vec});
  at('t1', 'tau1', {text: `τ₁ = ${r.tau1.toFixed(1)} N·m`, sub: 'Ngược chiều kim đồng hồ', color: OR, dx: -150, dy: -80, a: vec});
  at('t2', 'tau2', {text: `τ₂ = ${r.tau2.toFixed(1)} N·m`, sub: 'Cùng chiều kim đồng hồ', color: TL, dx: 150, dy: -80, a: vec});
  at('p-bearing', 'bearing', {text: 'VÒNG BI TRỤC O', sub: 'Ball bearing · 10 bi', color: INK, part: true, dx: -190, dy: 110, a: part});
  at('p-cell', 'cell', {text: 'CẢM BIẾN MÔMEN XOẮN', sub: `Torsion load cell · ứng suất ${(r.stress * 100).toFixed(0)}%`, color: INK, part: true, dx: 150, dy: 120, a: part});
  at('p-pin1', 'pin1', {text: 'CHỐT LỰC O₁', sub: 'Load-pin sensor', color: INK, part: true, dx: -30, dy: 105, a: part});
  at('p-pin2', 'pin2', {text: 'CHỐT LỰC O₂', sub: 'Load-pin sensor', color: INK, part: true, dx: 30, dy: 105, a: part});
  at('p-pin1b', 'pinion1', {text: 'BÁNH RĂNG O₁', sub: 'Rack & pinion · 16 răng', color: INK, part: true, dx: -40, dy: -95, a: part});
  at('p-pin2b', 'pinion2', {text: 'BÁNH RĂNG O₂', sub: 'Rack & pinion · 16 răng', color: INK, part: true, dx: 40, dy: -95, a: part});
  return items;
}

// ------------------------------------------------------------ frame
let last = performance.now();
const perf = {n: 0, sum: 0, slow: 0, age: 0};
let view = {};
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  T += dt;
  if (tier < TIERS.length - 1) {
    perf.age += dt;
    if (perf.age > 0.6) {
      perf.sum += dt;
      perf.n++;
      if (perf.sum >= 0.5 && perf.n >= 6) {
        perf.slow = perf.sum / perf.n > 0.022 ? perf.slow + 1 : 0;
        perf.sum = 0;
        perf.n = 0;
        if (perf.slow >= (perf.age < 6 ? 1 : 2)) {
          tier++;
          fit();
          Object.assign(perf, {age: 0, slow: 0});
        }
      }
    }
  }

  // tour
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION;
    if (c < tour.last) tour.ev = 0;
    tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) {
      const [, kind, v] = EVENTS[tour.ev++];
      if (kind === 'td') setTd(v);
      else applyPreset(v);
    }
    target = keyed(CAM_KEYS, c);
    viewName = '';
    ui.setView('');
  }

  // physics: one source of truth
  advance(model, dt);
  const r = readout(model);
  hist.acc += dt;
  while (hist.acc >= 1 / 30) {
    hist.acc -= 1 / 30;
    for (const [k, v] of [['tau1', r.tau1], ['tau2', r.tau2], ['theta', (r.theta * 180) / Math.PI], ['omega', r.omega]]) {
      hist[k].push(v);
      if (hist[k].length > 300) hist[k].shift();
    }
  }

  // teardown ease
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / DUR_TD);
  tdS.v = td;
  view = {vectors: td};
  rig.update(model, r, td, view);

  // camera
  const k = 1 - Math.exp(-dt / (tour.run ? 0.12 : 0.3));
  cam.az += (target[0] - cam.az) * k;
  cam.el += (target[1] - cam.el) * k;
  cam.d += (target[2] - cam.d) * k;
  cam.tx += (target[3] - cam.tx) * k;
  cam.ty += (target[4] - cam.ty) * k;
  cam.tz += (target[5] - cam.tz) * k;
  st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});

  // overlay
  ui.update(r, hist);
  ui.sliders(model.cmd);
  ui.setTeardown(tdS.on, td);
  ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off');
  ui.labels(labelItems(r, td));
  if (!window.LEVER.shown) {
    window.LEVER.shown = true;
    dispatchEvent(new Event('simframe'));
  }
  requestAnimationFrame(frame);
}

window.LEVER = {st, rig, model, readout: () => readout(model), cam, tdS, tour, VIEWS, errors: [], shown: false, ready: false,
  get tier() { return tier; }, get T() { return T; }, applyPreset, setTd, setView, userInput,
  /** test hook: pin teardown and camera instantly */
  pose(o) {
    if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; }
    if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); Object.assign(cam, {az: target[0], el: target[1], d: target[2], tx: target[3], ty: target[4], tz: target[5]}); }
    if (o.preset !== undefined) applyPreset(o.preset);
  }};
addEventListener('error', (e) => window.LEVER.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.LEVER.errors.push('promise: ' + e.reason));

applyPreset(0);
ui.setView('hero');
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => {
  window.LEVER.ready = true;
  requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); });
});
void LIM;

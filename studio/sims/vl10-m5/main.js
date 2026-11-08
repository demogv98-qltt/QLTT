// VL10-M5 live page: three spring balances on a board. One physics state drives the pose, the vectors and every gauge.
// Left alone it tours itself (camera, teardown, presets); any click, drag, wheel or key hands control to the visitor,
// and 25 s of quiet hands it back while AUTO-TOUR is on.
import {keyed} from 'teardown-kit/util.js';
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {createStage} from '../khtn8-lever/stage.js';
import {advance, createModel, PRESETS, readout, settled} from './physics.js';
import {createRig, TOP} from './rig.js';
import {createUI, CSS} from './ui.js';
import {createLesson, LESSON_CSS} from '../kit-su-pham/lesson.js';
import {makeLesson} from './bai_hoc.js';

const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const OR = '#e8590c', TL = '#0b8f8c', PU = '#5b3cc4', SL = '#4d6573', INK = '#14303c';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { const k = clamp(x, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'.split(',').map((c) => 'U+' + c).join(',');
const face = (fam, w, d, r) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${d}) format('woff2');unicode-range:${r}}`;
const style = document.createElement('style');
style.textContent = [face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI), face('JetBrains Mono', 400, grFont400, 'U+0370-03FF'), face('JetBrains Mono', 700, grFont700, 'U+0370-03FF'), face('Inter', '100 900', viInter, VI), CSS, LESSON_CSS].join('\n');
document.head.appendChild(style);
document.title = 'VL10-M5 · Tổng hợp và phân tích lực (Teardown)';

// camera views [az°, el°, distance, target x, y, z]
const VIEWS = {hero: [18, 42, 3.1, 0, TOP, 0.05], top: [0, 86, 2.7, 0, TOP, 0], meter: [30, 30, 1.05, 0.42, TOP + 0.03, -0.12], knot: [10, 52, 1.0, 0, TOP, 0]};
const DURATION = 48;
const CAM_KEYS = [[0, VIEWS.hero], [6, [50, 36, 2.9, 0, TOP, 0]], [9, VIEWS.meter], [17, [-35, 34, 1.0, 0.4, TOP + 0.03, -0.12]], [21, VIEWS.top], [30, VIEWS.top], [34, [20, 50, 2.6, 0, TOP, 0]], [40, VIEWS.hero], [DURATION, VIEWS.hero]];
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [10, 'td', true], [21, 'preset', 1], [26, 'preset', 2], [31, 'preset', 3], [38, 'td', false], [40, 'preset', 0]];

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, target = [...VIEWS.hero], preset = 0;
const cam = {az: VIEWS.hero[0], el: VIEWS.hero[1], d: VIEWS.hero[2], tx: 0, ty: TOP, tz: 0.05};

const ui = createUI(app, {
  cmd(k, v) { userInput(); model.cmd[k] = v; preset = -1; ui.setPreset(-1); },
  preset(i) { userInput(); applyPreset(i); },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); target = [...VIEWS[v]]; ui.setView(v); },
  mode(m) { userInput(); model.mode = m; ui.setMode(m); preset = -1; ui.setPreset(-1); },
});
function applyPreset(i) { const p = PRESETS[i]; model.mode = p.mode; if (p.mode === 'T') Object.assign(model.cmd, {F1: p.F1, t1: p.t1, F2: p.F2, al: p.al}); else Object.assign(model.cmd, {F: p.F, beta: p.beta}); ui.setMode(p.mode); preset = i; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; }
function userInput() { lastInput = T; if (tour.run) { tour.run = false; target = [cam.az, cam.el, cam.d, cam.tx, cam.ty, cam.tz]; } }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click();
  else if ('1234'.includes(k) && k) { userInput(); const v = ['hero', 'top', 'meter', 'knot'][Number(k) - 1]; target = [...VIEWS[v]]; ui.setView(v); } else return;
  e.preventDefault();
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = {x: e.clientX, y: e.clientY}; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; target[0] -= ((e.clientX - drag.x) / scale) * 0.3; target[1] = clamp(target[1] + ((e.clientY - drag.y) / scale) * 0.2, 8, 89); drag = {x: e.clientX, y: e.clientY}; lastInput = T; });
const endDrag = () => { drag = null; canvas.classList.remove('drag'); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); userInput(); target[2] = clamp(target[2] * Math.exp(e.deltaY * 0.0012), 0.5, 7); }, {passive: false});

const TIERS = [{pr: 2, shadow: 2048}, {pr: 1.5, shadow: 1024}, {pr: 1, shadow: 1024}];
const fit = () => { scale = Math.min(innerWidth / W, innerHeight / H); app.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`; st.setQuality({pr: clamp((devicePixelRatio || 1) * scale, 0.75, TIERS[tier].pr), shadow: TIERS[tier].shadow}); };
fit(); addEventListener('resize', fit);

const proj = (p) => st.project(rig.worldPt(p));
function labelItems(r, td) {
  const items = [], T_ = r.mode === 'T', part = clamp((td - 0.8) / 0.2, 0, 1);
  const at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  const m = r.m;
  if (T_) {
    at('F1', rig.tipPts[0], {text: `F₁ = ${m[0].F.toFixed(1)} N`, sub: 'Lực kế 1', color: OR, dy: -34, a: m[0].F > 0.05 ? 1 : 0});
    at('F2', rig.tipPts[1], {text: `F₂ = ${m[1].F.toFixed(1)} N`, sub: 'Lực kế 2', color: TL, dy: -34, a: m[1].F > 0.05 ? 1 : 0});
    at('R', rig.tipPts[2], {text: `F = ${r.Rmag.toFixed(1)} N`, sub: 'Hợp lực F₁ + F₂', color: PU, dy: 40, a: r.Rmag > 0.05 ? 1 : 0});
  } else {
    at('F1', rig.tipPts[0], {text: `F = ${r.F.toFixed(1)} N`, sub: `β = ${r.beta.toFixed(0)}°`, color: PU, dy: -34, a: r.F > 0.05 ? 1 : 0});
    at('F2', rig.tipPts[1], {text: `Fx = ${Math.abs(r.Fx).toFixed(1)} N`, sub: 'thành phần', color: OR, dy: 34, a: Math.abs(r.Fx) > 0.05 ? 1 : 0});
    at('F3', rig.tipPts[2], {text: `Fy = ${Math.abs(r.Fy).toFixed(1)} N`, sub: 'thành phần', color: TL, dx: 70, a: Math.abs(r.Fy) > 0.05 ? 1 : 0});
  }
  m.forEach((q, i) => at('r' + i, rig.pts['m' + i], {text: `Lực kế ${i + 1}`, sub: `đọc ${q.F.toFixed(1)} N · Δl ${(q.ext * 100).toFixed(1)} cm`, color: [OR, TL, SL][i], dy: -62, a: q.F > 0.05 ? 0.95 * (1 - part) + 0.0 : 0}));
  m.forEach((q, i) => at('p' + i, rig.pts['s' + i], {text: 'LÒ XO', sub: `F = k·Δl = ${Math.round(q.full / 0.1)} × ${(q.ext).toFixed(3)}`, color: INK, part: true, dy: 54, a: part * (q.F > 0.05 ? 1 : 0)}));
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else applyPreset(v); }
    target = keyed(CAM_KEYS, c); ui.setView('');
  }
  advance(model, dt);
  const r = readout(model);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, td);
  const k = 1 - Math.exp(-dt / (tour.run ? 0.12 : 0.3));
  cam.az += (target[0] - cam.az) * k; cam.el += (target[1] - cam.el) * k; cam.d += (target[2] - cam.d) * k; cam.tx += (target[3] - cam.tx) * k; cam.ty += (target[4] - cam.ty) * k; cam.tz += (target[5] - cam.tz) * k;
  st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r); ui.sliders(model.cmd); ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, td));
  if (!window.M5.shown) window.M5.shown = true;
  requestAnimationFrame(frame);
}
window.M5 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, VIEWS, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; target = [...VIEWS[o.view]]; Object.assign(cam, {az: target[0], el: target[1], d: target[2], tx: target[3], ty: target[4], tz: target[5]}); } if (o.preset !== undefined) applyPreset(o.preset); if (o.cmd) Object.assign(model.cmd, o.cmd); if (o.mode) { model.mode = o.mode; ui.setMode(o.mode); } }};
addEventListener('error', (e) => window.M5.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M5.errors.push('promise: ' + e.reason));
let lessonH = 0, shift = 0;
const lesson = createLesson(ui.root, makeLesson({
  setT(F1, F2, al) { model.mode = 'T'; Object.assign(model.cmd, {F1, t1: 20, F2, al}); ui.setMode('T'); preset = -1; ui.setPreset(-1); },
  setP(F, beta) { model.mode = 'P'; Object.assign(model.cmd, {F, beta}); ui.setMode('P'); preset = -1; ui.setPreset(-1); },
}), {ctx: () => ({r: readout(model), t: settled(model), c: model.cmd, mode: model.mode, td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M5.lesson = lesson;
applyPreset(0); ui.setView('hero');
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M5.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

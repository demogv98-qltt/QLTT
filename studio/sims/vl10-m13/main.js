// VL10-M13 live page: a spring, weights and a ruler. One state drives the spring, the arrows, the table, the graph and every number.
// Tours itself when left alone; any click, drag, wheel or key hands control to the visitor.
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {createStage} from '../khtn8-lever/stage.js';
import {createLesson, LESSON_CSS} from '../kit-su-pham/lesson.js';
import {advance, createModel, eqExt, FlimOf, N_MAX, PRESETS, readout, record, reset, snap, weight} from './physics.js';
import {createRig, Y0} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const TL = '#0b8f8c', OR = '#e8590c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { const k = clamp(x, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'.split(',').map((c) => 'U+' + c).join(',');
const face = (fam, w, d, r) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${d}) format('woff2');unicode-range:${r}}`;
const style = document.createElement('style');
style.textContent = [face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI), face('JetBrains Mono', 400, grFont400, 'U+0370-03FF'), face('JetBrains Mono', 700, grFont700, 'U+0370-03FF'), face('Inter', '100 900', viInter, VI), CSS, LESSON_CSS].join('\n');
document.head.appendChild(style);
document.title = 'VL10-M13 · Định luật Hooke (Teardown)';

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'hero', preset = -1, followBlend = 1, txSmooth = 0, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 14, el: 12, d: 24, tx: 0, ty: 1, tz: 0};
const VIEWFN = {
  hero: () => [14, 10, 4.0, -0.1, 0.9, 0, 0],
  ruler: (r) => [0, 4, 1.7, 0.12, Y0 - r.x - 0.07, 0, 1],
  spring: (r) => [30, 8, 2.1, 0, Y0 - r.x * 0.5 + 0.05, 0, 1],
  side: () => [55, 12, 4.3, -0.1, 0.85, 0, 0],
};
const DURATION = 54;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [5, 'view', 'ruler'], [10, 'record'], [11, 'w', 1], [13, 'record'], [14, 'w', 1], [16, 'record'], [17, 'view', 'hero'], [19, 'preset', 1], [19.1, 'view', 'ruler'], [25, 'td', true], [25.1, 'view', 'spring'], [32, 'td', false], [33, 'preset', 2], [33.1, 'view', 'hero'], [38, 'w', -8], [46, 'view', 'side'], [50, 'view', 'hero']];

const ui = createUI(app, {
  spring(i) { userInput(); model.sp = i; model.rows = []; reset(model); snap(model); preset = -1; ui.setPreset(-1); },
  weights(d) { userInput(); model.n = clamp(model.n + d, 0, N_MAX); preset = -1; ui.setPreset(-1); },
  record() { userInput(); record(model); },
  clear() { userInput(); model.rows = []; },
  fresh() { userInput(); reset(model); snap(model); },
  preset(i) { userInput(); applyPreset(i); },
  speed(v) { model.speed = v; },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { const p = PRESETS[i]; model.sp = p.sp; model.rows = []; reset(model); snap(model); model.n = p.n; preset = i; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === 'g') ui.root.querySelector('#b-rec').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'ruler', 'spring', 'side'][Number(k) - 1]); } else return;
  e.preventDefault();
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = {x: e.clientX, y: e.clientY}; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; off.az -= ((e.clientX - drag.x) / scale) * 0.3; off.el = clamp(off.el + ((e.clientY - drag.y) / scale) * 0.2, -10, 70); drag = {x: e.clientX, y: e.clientY}; lastInput = T; });
const endDrag = () => { drag = null; canvas.classList.remove('drag'); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); userInput(); off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.3, 3); }, {passive: false});
const TIERS = [{pr: 2, shadow: 2048}, {pr: 1.5, shadow: 1024}, {pr: 1, shadow: 1024}];
const fit = () => { scale = Math.min(innerWidth / W, innerHeight / H); app.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`; st.setQuality({pr: clamp((devicePixelRatio || 1) * scale, 0.75, TIERS[tier].pr), shadow: TIERS[tier].shadow}); };
fit(); addEventListener('resize', fit);

const f1 = (x, d = 1) => x.toFixed(d).replace('.', ',').replace('-', '−');
const proj = (p) => st.project(rig.worldPt(p));
function labelItems(r, s, td) {
  const items = [], part = clamp((td - 0.8) / 0.2, 0, 1), at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  at('spring', rig.pts.spring, {text: `LÒ XO · k = ${r.k} N/m`, sub: `dài ${f1(100 * (0.2 + r.x), 1)} cm`, color: TL, dy: -30, dx: -90, a: 1});
  if (r.n) at('wt', rig.pts.weights, {text: `${r.n} quả = ${f1(r.m * 1000, 0)} g`, sub: `P = F = ${f1(r.F, 2)} N`, color: '#8a6a1c', dy: 30, dx: 90, a: 1});
  at('needle', rig.pts.needle, {text: `Δl = ${f1(r.x * 100, 1)} cm`, sub: 'kim chỉ trên thước', color: OR, dy: -6, dx: 74, a: 1});
  at('clamp', rig.pts.clamp, {text: 'KẸP VÀ THANH NGANG', sub: 'giữ đầu trên lò xo', color: INK, part: true, dy: -30, dx: 40, a: part});
  at('rod', rig.pts.rod, {text: 'THANH TREO', sub: 'quả nặng xếp lên đĩa', color: INK, part: true, dy: 40, dx: -90, a: part});
  at('rul', rig.pts.ruler, {text: 'THƯỚC · vạch 0 ở vị trí kim lúc chưa treo', sub: 'đọc thẳng tầm mắt', color: INK, part: true, dy: 20, dx: 80, a: part});
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); else if (kind === 'record') record(model); else if (kind === 'w') model.n = clamp(model.n + v, 0, N_MAX); }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td);
  const v = VIEWFN[viewName](r, model), k = 1 - Math.exp(-dt / 0.3);
  followBlend += ((v[6] ? 1 : 0) - followBlend) * (1 - Math.exp(-dt / 0.25)); txSmooth += (v[3] - txSmooth) * k; if (followBlend > 0.99) txSmooth = v[3];
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx = txSmooth + (v[3] - txSmooth) * followBlend; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.M13.shown) window.M13.shown = true;
  requestAnimationFrame(frame);
}
window.M13 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); if (o.t !== undefined) { model.t = o.t; model.running = false; } }};
addEventListener('error', (e) => window.M13.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M13.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { model.sp = o.sp; model.n = o.n; model.rows = []; reset(model); snap(model); preset = -1; ui.setPreset(-1); },
  reset() { reset(model); snap(model); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M13.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M13.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

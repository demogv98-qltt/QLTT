// VL10-M10 live page: a pendulum and an electric winch. One physics state per set-up drives the pose and every number.
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
import {advance, createModel, D2R, PIV_H, PRESETS, RANGE, readout, reset} from './physics.js';
import {createRig} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

const W = 1600, H = 900, IDLE = 25;
const TL = '#0b8f8c', OR = '#e8590c', INK = '#14303c', RD = '#c0392b', PU = '#5b3cc4';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { const k = clamp(x, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'.split(',').map((c) => 'U+' + c).join(',');
const face = (fam, w, d, r) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${d}) format('woff2');unicode-range:${r}}`;
const style = document.createElement('style');
style.textContent = [face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI), face('JetBrains Mono', 400, grFont400, 'U+0370-03FF'), face('JetBrains Mono', 700, grFont700, 'U+0370-03FF'), face('Inter', '100 900', viInter, VI), CSS, LESSON_CSS].join('\n');
document.head.appendChild(style);
document.title = 'VL10-M10 · Công, cơ năng, công suất (Teardown)';

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'hero', preset = 0, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 20, el: 10, d: 7.5, tx: 0, ty: 1.9, tz: 0};
const hist = {t: [], Wt: [], Wd: [], W: [], acc: 0};
const clearHist = () => { for (const k of ['t', 'Wt', 'Wd', 'W']) hist[k].length = 0; };

const VIEWFN = {
  hero: () => [20, 10, 11.2, 0, 1.8, 0],
  side: () => [0, 4, 12, 0, 1.8, 0],
  detail: () => (model.mode === 'E' ? [32, 10, 2.6, 0, PIV_H - model.L, 0.1] : [24, 14, 3.4, -0.1, 3.0, 0.2]),
  ruler: () => (model.mode === 'E' ? [-22, 8, 7.2, 0.9, 1.7, 0.05] : [-12, 8, 6.8, 0.8, 1.7, 0.1]),
};
const DURATION = 66;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [1, 'go'], [10, 'view', 'detail'], [11, 'td', true], [18, 'td', false], [19, 'preset', 1], [19.1, 'go'], [19.2, 'view', 'side'], [34, 'preset', 2], [34.1, 'view', 'hero'], [34.2, 'go'],
  [40, 'view', 'detail'], [41, 'td', true], [49, 'td', false], [50, 'view', 'ruler'], [58, 'view', 'hero']];

const ui = createUI(app, {
  cmd(k, v) { userInput(); model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); if (model.mode === 'E' && !model.released) { model.th = model.th0 * D2R; } else if (model.mode === 'E' && k === 'th0') { reset(model); clearHist(); } preset = -1; ui.setPreset(-1); },
  preset(i) { userInput(); applyPreset(i); },
  go() { userInput(); go(); },
  reset() { userInput(); reset(model); clearHist(); },
  mode(m) { userInput(); setMode(m); },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function setMode(m) { model.mode = m; reset(model); clearHist(); ui.setMode(m); preset = -1; ui.setPreset(-1); }
function applyPreset(i) { const p = PRESETS[i]; model.mode = p.mode; if (p.mode === 'E') Object.assign(model, {m: p.m, L: p.L, th0: p.th0, b: p.b}); else Object.assign(model, {mw: p.mw, P: p.P, eta: p.eta}); reset(model); clearHist(); ui.setMode(p.mode); preset = i; ui.setPreset(i); }
function go() { if (model.mode === 'E') { if (model.released) { reset(model); clearHist(); } model.released = true; } else if (model.running) model.running = false; else { if (model.h >= 3) reset(model); model.running = true; } }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === ' ') ui.root.querySelector('#b-go').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'side', 'detail', 'ruler'][Number(k) - 1]); } else return;
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
  if (r.mode === 'E') {
    at('bob', rig.pts.bob, {text: `Wt = ${f1(r.Wt, 2)} J`, sub: `Wđ = ${f1(r.Wd, 2)} J · v = ${f1(Math.abs(r.v), 2)} m/s`, color: OR, dy: 40, a: 1});
    at('gate', rig.pts.gate, {text: 'CỔNG QUANG', sub: `v đo = ${r.vGate === null ? '—' : f1(r.vGate, 2) + ' m/s'}`, color: TL, dy: 80, dx: -60, a: 1 - part});
    at('ref', rig.pts.refl, {text: 'mốc Wt = 0', color: OR, dy: -14, a: 1});
    at('led', rig.pts.led, {text: 'ĐÈN LED', sub: 'phát tia sáng', color: INK, part: true, dy: -60, dx: -50, a: part});
    at('dio', rig.pts.diode, {text: 'PHOTODIODE', sub: 'đếm thời gian che sáng', color: INK, part: true, dy: 60, dx: 50, a: part});
    at('hh', rig.pts.ruler, {text: `h = ${f1(r.h, 2)} m`, sub: 'so với điểm thấp nhất', color: INK, dy: -30, a: 1});
  } else {
    at('load', rig.pts.load, {text: `tải ${f1(r.m, 0)} kg`, sub: `h = ${f1(r.h, 2)} m · Wt = ${f1(r.Ai, 0)} J`, color: TL, dy: -30, a: 1});
    at('mot', rig.pts.motor, {text: 'ĐỘNG CƠ', sub: `P = ${f1(r.P, 0)} W`, color: INK, part: true, dy: -50, dx: -30, a: part});
    at('gear', rig.pts.gear, {text: 'HỘP SỐ', sub: 'bánh răng nhỏ dẫn bánh răng lớn', color: INK, part: true, dy: -76, a: part});
    at('drum', rig.pts.drum, {text: 'TANG QUẤN CÁP', color: INK, part: true, dx: 70, dy: -20, a: part});
    at('heat', rig.pts.heat, {text: `HAO PHÍ ${f1((1 - r.eta) * r.P, 0)} W`, sub: 'tỏa nhiệt (1 − η)·P', color: RD, dy: 70, a: 1});
  }
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); else if (kind === 'go') go(); }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model);
  if (r.mode === 'E') { if (hist.t.length && r.t < hist.t[hist.t.length - 1]) clearHist(); if (model.released && r.t <= 10 && (!hist.t.length || r.t - hist.t[hist.t.length - 1] > 0.05)) { hist.t.push(r.t); hist.Wt.push(r.Wt); hist.Wd.push(r.Wd); hist.W.push(r.W); } if (!model.released && !hist.t.length) { hist.t.push(0); hist.Wt.push(r.Wt); hist.Wd.push(0); hist.W.push(r.W); } }
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td);
  const v = VIEWFN[viewName](), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model, hist); ui.sliders(model);
  ui.setGo(r.mode === 'E' ? (model.released ? '↺ Thả lại' : '▶ Thả') : (model.running ? '❚❚ Dừng' : model.h >= 3 ? '↺ Chạy lại' : '▶ Chạy'));
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.M10.shown) window.M10.shown = true;
  requestAnimationFrame(frame);
}
window.M10 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd, setMode,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); if (o.go) go(); }};
addEventListener('error', (e) => window.M10.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M10.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  setE(o) { model.mode = 'E'; Object.assign(model, o); reset(model); clearHist(); ui.setMode('E'); preset = -1; ui.setPreset(-1); },
  setW(o) { model.mode = 'W'; Object.assign(model, o); reset(model); clearHist(); ui.setMode('W'); preset = -1; ui.setPreset(-1); },
  reset() { reset(model); clearHist(); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M10.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M10.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

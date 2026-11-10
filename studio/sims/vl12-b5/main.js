// VL12-B5 live page: charged particle in a uniform magnetic field. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, createModel, PRESETS, RANGE, radius, readout, record} from './physics.js';
import {createRig, TABLE, YC} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B5 · Hạt điện tích trong từ trường đều (Teardown)';
const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const OR = '#e8590c', INK = '#14303c', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { const k = clamp(x, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'.split(',').map((c) => 'U+' + c).join(',');
const face = (fam, w, d, r) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${d}) format('woff2');unicode-range:${r}}`;
const style = document.createElement('style');
style.textContent = [face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI), face('JetBrains Mono', 400, grFont400, 'U+0370-03FF'), face('JetBrains Mono', 700, grFont700, 'U+0370-03FF'), face('Inter', '100 900', viInter, VI), CSS, LESSON_CSS].join('\n');
document.head.appendChild(style);
const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'hero', lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 20, el: 14, d: 1.2, tx: 0, ty: YC, tz: 0};
const VIEWFN = {hero: () => [26, 14, 1.15, 0, YC - 0.01, 0], face: () => [0, 3, 0.75, 0, YC, 0], top: () => [0, 80, 1.1, 0, YC, 0], side: () => [90, 6, 1.1, 0, YC, 0]};
const DURATION = 58;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [4, 'view', 'face'], [8, 'cmd', 'B', 3], [14, 'cmd', 'B', 1.5], [16, 'ring', true], [22, 'ring', false], [22.1, 'preset', 1], [30, 'preset', 2], [30.1, 'view', 'hero'], [38, 'preset', 0], [38.1, 'td', true], [38.2, 'view', 'side'], [46, 'td', false], [46.1, 'view', 'face'], [50, 'cmd', 'V', 600]];
function cmd(k, v) { model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); if (k === 'alpha') model.alpha = Math.round(model.alpha); }
function applyPreset(i) { const p = PRESETS[i]; Object.assign(model, {pt: p.pt, V: p.V, B: p.B, alpha: p.alpha, dirB: p.dirB, rows: [], showRing: false}); model.rt = radius(model); ui.setPreset(i); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); }, particle(i) { userInput(); model.pt = i; model.rows = []; ui.setPreset(-1); }, dir() { userInput(); model.dirB = -model.dirB; }, ring() { userInput(); model.showRing = !model.showRing; },
  record() { userInput(); if (model.showRing) record(model); }, clear() { userInput(); model.rows = []; }, preset(i) { userInput(); applyPreset(i); }, speed(v) { model.speed = v; },
  teardown() { userInput(); setTd(!tdS.on); }, tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; }, view(v) { userInput(); setView(v); },
});
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === 'g') ui.root.querySelector('#b-rec').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'face', 'top', 'side'][Number(k) - 1]); } else return;
  e.preventDefault();
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = {x: e.clientX, y: e.clientY}; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; off.az -= ((e.clientX - drag.x) / scale) * 0.3; off.el = clamp(off.el + ((e.clientY - drag.y) / scale) * 0.2, -10, 60); drag = {x: e.clientX, y: e.clientY}; lastInput = T; });
const endDrag = () => { drag = null; canvas.classList.remove('drag'); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); userInput(); off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.3, 3); }, {passive: false});
const TIERS = [{pr: 2, shadow: 2048}, {pr: 1.5, shadow: 1024}, {pr: 1, shadow: 1024}];
const fit = () => { scale = Math.min(innerWidth / W, innerHeight / H); app.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`; st.setQuality({pr: clamp((devicePixelRatio || 1) * scale, 0.75, TIERS[tier].pr), shadow: TIERS[tier].shadow}); };
fit(); addEventListener('resize', fit);
const f2 = (x, d = 2) => x.toFixed(d).replace('.', ',').replace('-', '−');
const proj = (p) => st.project(rig.worldPt(p));
function labelItems(r, s, td) {
  const items = [], part = clamp((td - 0.8) / 0.2, 0, 1), at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  at('gun', rig.pts.gun, {text: 'SÚNG ELECTRON / ION', sub: `tăng tốc V = ${f2(s.V, 0)} V`, color: INK, dy: -40, dx: -60, a: 1});
  at('particle', rig.pts.particle, {text: `${r.sym} · v = ${f2(r.v / 1e6, 2)}·10⁶ m/s`, sub: `r = ${f2(r.r * 100, 2)} cm · T = ${r.T >= 1e-6 ? f2(r.T * 1e6, 2) + ' µs' : f2(r.T * 1e9, 1) + ' ns'}`, color: BL, dy: -50, dx: 70, a: 1});
  at('field', rig.pts.field, {text: s.dirB > 0 ? 'B RA PHÍA NGƯỜI XEM ⊙' : 'B VÀO PHÍA SAU ⊗', sub: `B = ${f2(s.B, 1)} mT (đều)`, color: RD, dy: -20, dx: 60, a: 1});
  at('chamber', rig.pts.chamber, {text: 'BÌNH THUỶ TINH', sub: 'bán kính 10 cm · coi là chân không', color: INK, part: true, dy: -30, dx: 60, a: part});
  at('coil', rig.pts.coil, {text: 'CUỘN HELMHOLTZ', sub: 'hai cuộn cùng trục, cách nhau R (kiểu Helmholtz)', color: '#a86f00', part: true, dy: 30, dx: 80, a: part});
  at('post', rig.pts.post, {text: 'TRỤ ĐỠ CUỘN', sub: 'đứng trên đế', color: INK, part: true, dy: 40, dx: -60, a: part});
  at('cradle', rig.pts.cradle, {text: 'GIÁ ĐỠ BÌNH', sub: 'chữ V dưới đáy bình', color: INK, part: true, dy: 30, dx: 70, a: part});
  return items;
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'cmd') cmd(a, b); else if (kind === 'ring') { model.showRing = a; model.rt = radius(model); } }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td);
  const v = VIEWFN[viewName](r, model), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: clamp(cam.el, -5, 89.5) * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model); ui.syncSliders(model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.B5.shown) window.B5.shown = true;
  requestAnimationFrame(frame);
}
window.B5 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) for (const [k2, v2] of Object.entries(o.set)) { if (k2 === 'pt' || k2 === 'dirB' || k2 === 'showRing') model[k2] = v2; else cmd(k2, v2); } }};
addEventListener('error', (e) => window.B5.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B5.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.clear) model.rows = []; if (o.pt !== undefined) model.pt = o.pt; for (const k2 of ['V', 'B', 'alpha']) if (o[k2] !== undefined) cmd(k2, o[k2]); if (o.dirB !== undefined) model.dirB = o.dirB; if (o.ring !== undefined) { model.showRing = o.ring; } model.rt = radius(model) * (o.ring ? 0.7 : 1); ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B5.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1); void OR; void INK; void GR; void TABLE;
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B5.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

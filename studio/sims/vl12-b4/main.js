// VL12-B4 live page: current balance lab. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, createModel, PRESETS, RANGE, readout, record, tareNow} from './physics.js';
import {createRig, TABLE, YW} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B4 · Thực hành đo cảm ứng từ B (Teardown)';
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
const cam = {az: 24, el: 18, d: 1.4, tx: 0.05, ty: TABLE + 0.14, tz: 0};
const VIEWFN = {hero: () => [24, 20, 1.5, 0.12, TABLE + 0.14, 0], gap: () => [18, 14, 0.5, 0, YW, 0], bal: () => [-8, 14, 0.7, 0.0, TABLE + 0.05, 0.05], side: () => [90, 8, 1.4, 0, TABLE + 0.14, 0]};
const DURATION = 56;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [0.05, 'tare'], [2, 'cmd', 'I', 1], [6, 'rec'], [7, 'cmd', 'I', 2], [11, 'rec'], [12, 'view', 'gap'], [14, 'cmd', 'I', -2], [18, 'view', 'bal'], [20, 'cmd', 'I', 2.5], [24, 'rec'], [26, 'view', 'hero'], [28, 'cmd', 'N', 5], [32, 'cmd', 'I', 0], [34, 'td', true], [34.1, 'view', 'side'], [42, 'td', false], [42.1, 'view', 'hero'], [46, 'preset', 0]];
function cmd(k, v) { if (k === 'I') model.cmd.I = clamp(v, RANGE.I[0], RANGE.I[1]); else if (k === 'N') { model.N = clamp(Math.round(v), RANGE.N[0], RANGE.N[1]); model.rows = []; } }
function applyPreset(i) { const p = PRESETS[i]; model.mag = p.mag; model.N = p.N; model.rows = []; model.cmd.I = 0; model.I = 0; model.reveal = false; model.tared = false; model.noise = 0; tareNow(model); model.tared = false; ui.setPreset(i); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); }, magnet(i) { userInput(); model.mag = i; model.rows = []; model.reveal = false; tareNow(model); model.tared = false; ui.setPreset(-1); },
  tare() { userInput(); tareNow(model); }, record() { userInput(); if (!record(model)) model.note = {at: performance.now() / 1000, text: 'Cân chưa ổn định: chờ I và số chỉ ổn định (≈ 1 s) rồi ghi.'}; },
  clear() { userInput(); model.rows = []; }, reveal() { userInput(); model.reveal = !model.reveal; }, preset(i) { userInput(); applyPreset(i); }, speed(v) { model.speed = v; },
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
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'gap', 'bal', 'side'][Number(k) - 1]); } else return;
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
  at('N', rig.pts.N, {text: 'CỰC N', sub: 'B hướng từ N sang S', color: RD, dy: -40, dx: -70, a: 1}); at('S', rig.pts.S, {text: 'CỰC S', sub: '', color: BL, dy: -40, dx: 70, a: 1});
  at('wire', rig.pts.wire, {text: `ĐOẠN DÂY l = 4,0 cm`, sub: `N = ${s.N} vòng · F = ${f2(r.F * 1000, 2)} mN ${r.dir > 0 ? 'lên' : r.dir < 0 ? 'xuống' : ''}`, color: OR, dy: 60, dx: 130, a: 1});
  at('bal', rig.pts.bal, {text: 'CÂN ĐIỆN TỬ', sub: `Δm = ${f2(r.disp, 2)} g · độ phân giải 0,01 g`, color: GR, dy: 40, dx: 60, a: 1});
  at('frame', rig.pts.frame, {text: 'KHUNG DÂY (cố định)', sub: 'treo vào giá, không chạm nam châm', color: INK, part: true, dy: -34, dx: 90, a: part});
  at('stand', rig.pts.stand, {text: 'GIÁ ĐỠ', sub: 'giữ khung dây đứng yên', color: INK, part: true, dy: -30, dx: -60, a: part});
  at('supply', rig.pts.supply, {text: 'NGUỒN ĐIỆN', sub: `I = ${f2(r.I, 2)} A (cực + đỏ)`, color: INK, part: true, dy: -30, dx: 30, a: part});
  at('pan', rig.pts.pan, {text: 'ĐĨA CÂN', sub: 'chịu cả nam châm và phản lực', color: INK, part: true, dy: 40, dx: -60, a: part});
  return items;
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'cmd') cmd(a, b); else if (kind === 'tare') tareNow(model); else if (kind === 'rec') record(model); }
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
  if (!window.B4.shown) window.B4.shown = true;
  requestAnimationFrame(frame);
}
window.B4 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) for (const [k2, v2] of Object.entries(o.set)) cmd(k2, v2); }};
addEventListener('error', (e) => window.B4.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B4.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.clear) { model.rows = []; model.reveal = false; } if (o.mag !== undefined) model.mag = o.mag; if (o.N !== undefined) model.N = o.N; if (o.I !== undefined) { model.cmd.I = o.I; model.I = o.I; } tareNow(model); model.tared = false; ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B4.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1); void OR; void INK; void BL; void GR; void RD;
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B4.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

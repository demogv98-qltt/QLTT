// VL12-B3 live page: a magnet, a current-carrying rod hung on springs. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, createModel, PRESETS, RANGE, readout, record, snap} from './physics.js';
import {createRig, YC} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B3 · Lực từ lên dây dẫn (Teardown)';
const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const TL = '#0b8f8c', OR = '#e8590c', INK = '#14303c', BL = '#2b59c3', GR = '#2c9a4b';
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
let lastInput = 0, viewName = 'hero', followBlend = 1, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 28, el: 14, d: 4.7, tx: 0, ty: 0.88, tz: 0.05};
const VIEWFN = {
  hero: () => [28, 14, 4.7, 0, 0.88, 0.05],
  top: () => [0, 72, 4.4, 0, 0.7, 0],
  ruler: () => [0, 6, 1.5, 0.12, YC, 0.45],
  side: () => [90, 8, 5.4, 0, 0.9, 0],
};
const DURATION = 60;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [1, 'cmd', 'I', 0], [3, 'cmd', 'I', 3], [8, 'view', 'ruler'], [12, 'view', 'hero'], [14, 'cmd', 'I', -3], [20, 'view', 'top'], [22, 'cmd', 'I', 3], [24, 'cmd', 'th', 45], [29, 'cmd', 'th', 90], [30, 'view', 'hero'], [33, 'cmd', 'B', 0.3], [38, 'td', true], [38.1, 'view', 'side'], [46, 'td', false], [46.1, 'cmd', 'B', 0.2], [47, 'view', 'hero'], [52, 'cmd', 'I', 0]];

function cmd(k, v) { if (k === 'I') model.cmd.I = clamp(v, RANGE.I[0], RANGE.I[1]); else model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); },
  record() { userInput(); if (!record(model)) model.note = {at: performance.now() / 1000, text: 'Thanh đang dao động: chờ nó đứng yên (≈ 1 s) rồi ghi.'}; },
  clear() { userInput(); model.rows = []; },
  preset(i) { userInput(); applyPreset(i); },
  speed(v) { model.speed = v; },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { const p = PRESETS[i]; model.rows = []; Object.assign(model, {B: p.B, l: p.l, th: p.th}); model.cmd.I = p.I; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === 'g') ui.root.querySelector('#b-rec').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'top', 'ruler', 'side'][Number(k) - 1]); } else return;
  e.preventDefault();
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = {x: e.clientX, y: e.clientY}; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; off.az -= ((e.clientX - drag.x) / scale) * 0.3; off.el = clamp(off.el + ((e.clientY - drag.y) / scale) * 0.2, -10, 80); drag = {x: e.clientX, y: e.clientY}; lastInput = T; });
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
  at('rod', rig.pts.rod, {text: `THANH ĐỒNG · đoạn trong từ trường l = ${f1(r.l, 2)} m`, sub: `I = ${f1(r.I, 1)} A`, color: GR, dy: -120, dx: 120, a: 1});
  at('N', rig.pts.N, {text: 'CỰC N', sub: 'đường sức đi ra', color: '#c0392b', dy: -60, dx: -90, a: 1});
  at('S', rig.pts.S, {text: 'CỰC S', sub: 'đường sức đi vào', color: BL, dy: -60, dx: 90, a: 1});
  if (r.dir) at('F', rig.pts.arrowF, {text: `F = ${f1(r.F, 3)} N · ${r.dir > 0 ? 'lên' : 'xuống'}`, sub: 'lực từ F = BIl·sinθ', color: OR, dy: 70, dx: 170, a: 1});
  at('ruler', rig.pts.ruler, {text: `Δy = ${f1(r.up * 100, 1)} cm`, sub: 'mũi chỉ cam trên thước', color: OR, dy: -20, dx: 120, a: 1});
  at('top', rig.pts.top, {text: 'THANH NGANG CÁCH ĐIỆN', sub: 'gỗ, chỉ để treo hai lò xo (k = 4 N/m)', color: INK, part: true, dy: -34, dx: 80, a: part});
  at('spring', rig.pts.spring, {text: 'HAI LÒ XO GIỐNG NHAU', sub: 'đo lực: F = 2k·Δy', color: INK, part: true, dy: 20, dx: -90, a: part});
  at('field', rig.pts.field, {text: `ĐƯỜNG SỨC ĐỀU · B = ${f1(r.B, 2)} T`, sub: 'chỉ giữa hai cực (bỏ qua từ trường rìa)', color: BL, part: true, dy: 70, dx: -30, a: part});
  at('supply', rig.pts.supply, {text: 'NGUỒN ĐIỆN', sub: 'cực + (đỏ) nối trụ phía xa người xem', color: INK, part: true, dy: -40, dx: 0, a: part});
  at('table', rig.pts.table, {text: 'BÀN XOAY · thước đo θ', sub: 'góc giữa đường sức và dây', color: INK, part: true, dy: 50, dx: 60, a: part});
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'cmd') cmd(a, b); }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td);
  const v = VIEWFN[viewName](r, model), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model); ui.syncSliders(model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.B3.shown) window.B3.shown = true;
  requestAnimationFrame(frame);
}
window.B3 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) { for (const [k2, v2] of Object.entries(o.set)) cmd(k2, v2); } if (o.snap) snap(model); }};
addEventListener('error', (e) => window.B3.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B3.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.clear) model.rows = []; for (const k2 of ['I', 'B', 'l', 'th']) if (o[k2] !== undefined) cmd(k2, o[k2]); ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B3.lesson = lesson;
applyPreset(0); model.cmd.I = 0; snap(model); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B3.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

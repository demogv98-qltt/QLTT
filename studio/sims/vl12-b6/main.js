// VL12-B6 live page: magnet moving through a coil, galvanometer. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, createModel, PRESETS, RANGE, readout, record, release, reset} from './physics.js';
import {createRig, GRID as _G, TABLE, YC} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B6 · Cảm ứng điện từ (Teardown)';
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
let lastInput = 0, viewName = 'hero', lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1}, fs = 0.5;
const cam = {az: 20, el: 10, d: 3.1, tx: 0.12, ty: YC - 0.05, tz: 0};
const VIEWFN = {hero: () => [22, 10, 3.2, 0.1, YC - 0.02, 0], coil: () => [32, 8, 1.5, 0, YC, 0], gal: () => [-4, 8, 1.1, 0.4, TABLE + 0.1, 0.05], side: () => [90, 6, 3.4, 0, YC, 0]};
const DURATION = 56;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [0.05, 'reset'], [1, 'cmd', 'v', 0.6], [4.6, 'view', 'coil'], [9, 'cmd', 'v', 0], [9.1, 'view', 'gal'], [10, 'reset'], [11, 'cmd', 'v', -0.6], [14, 'view', 'hero'], [16, 'preset', 1], [16.1, 'speed', 0.25], [17, 'drop'], [26, 'preset', 2], [26.1, 'speed', 0.25], [27, 'drop'], [37, 'speed', 1], [37.1, 'view', 'coil'], [40, 'td', true], [40.1, 'view', 'side'], [48, 'td', false], [48.1, 'view', 'hero'], [50, 'preset', 0]];
function cmd(k, v) { if (k === 'v') { model.vcmd = clamp(v, RANGE.v[0], RANGE.v[1]); } else model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); if (k === 'N') model.N = Math.round(model.N / 10) * 10; model.hist = []; }
function setMode(m) { model.mode = m; reset(model); }
function toggle(k) { model[k] = !model[k]; if (k !== 'hand') reset(model); }
function applyPreset(i) { const p = PRESETS[i]; model.mode = p.mode; model.N = p.N; model.R = p.R; model.flip = !!p.flip; model.open = !!p.open; reset(model); model.vcmd = p.mode === 'motor' ? p.v : 0; model.rows = []; ui.setPreset(i); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); }, mode(m) { userInput(); setMode(m); ui.setPreset(-1); }, stop() { userInput(); model.vcmd = 0; }, reset() { userInput(); reset(model); }, drop() { userInput(); release(model); }, toggle(k) { userInput(); toggle(k); ui.setPreset(-1); },
  record() { userInput(); record(model); }, clear() { userInput(); model.rows = []; }, preset(i) { userInput(); applyPreset(i); }, speed(v) { model.speed = v; },
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
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'coil', 'gal', 'side'][Number(k) - 1]); } else return;
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
  at('magnet', rig.pts.magnet, {text: 'NAM CHÂM', sub: s.flip ? 'cực N hướng LÊN' : 'cực N hướng XUỐNG', color: RD, dy: -30, dx: 90, a: 1});
  at('coil', rig.pts.coil, {text: `CUỘN DÂY · N = ${s.N} vòng`, sub: `NΦ = ${f2(r.phiDown * 1e3, 1)} mWb · e = ${f2(r.e, 2)} V`, color: '#a86f00', dy: 40, dx: 110, a: 1});
  if (model.hand && Math.abs(r.i) > 5e-4 && !s.open) at('hand', rig.pts.hand, {text: 'BÀN TAY PHẢI', sub: 'bốn ngón: chiều dòng cảm ứng · ngón cái: chiều B cảm ứng', color: '#b06a2a', dy: -36, dx: 100, a: 1});
  at('gal', rig.pts.gal, {text: 'ĐIỆN KẾ', sub: `i = ${f2(r.i, 3)} A · thang ±${f2(fs, fs < 0.1 ? 2 : 1)} A`, color: GR, dy: -40, dx: 20, a: 1});
  at('tube', rig.pts.tube, {text: 'ỐNG THUỶ TINH', sub: 'quấn cuộn dây quanh ống', color: INK, part: true, dy: -30, dx: -100, a: part});
  at('cushion', rig.pts.cushion, {text: 'ĐỆM XỐP', sub: 'đón nam châm rơi', color: INK, part: true, dy: 30, dx: 90, a: part});
  at('arm', rig.pts.arm, {text: 'RÒNG RỌC · DÂY TREO', sub: 'giữ nam châm trước khi thả', color: INK, part: true, dy: -30, dx: 70, a: part});
  at('col', rig.pts.col, {text: 'CỘT ĐỠ', sub: 'giữ ống và ròng rọc', color: INK, part: true, dy: 40, dx: -60, a: part});
  return items;
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'reset') reset(model); else if (kind === 'cmd') cmd(a, b); else if (kind === 'drop') release(model); else if (kind === 'speed') model.speed = a; }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model);
  { const vref = model.mode === 'fall' ? 3.4 : Math.max(Math.abs(model.vcmd), 0.3), est = 1.15 * model.N * 0.00577 * (model.Br / 0.4) * vref / model.R, FS = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]; fs = FS.find((x) => x >= est) || 20; }
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, fs, clamp(r.i / fs, -1.1, 1.1) * 50 * D2R);
  const v = VIEWFN[viewName](r, model), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: clamp(cam.el, -5, 89.5) * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model, fs); ui.syncSliders(model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.B6.shown) window.B6.shown = true;
  requestAnimationFrame(frame);
}
window.B6 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, release: () => release(model),
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); }};
addEventListener('error', (e) => window.B6.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B6.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.mode && o.mode !== model.mode) model.mode = o.mode; for (const k2 of ['N', 'R']) if (o[k2] !== undefined) model[k2] = o[k2]; if (o.open !== undefined) model.open = o.open; if (o.flip !== undefined) model.flip = o.flip; if (o.reset) reset(model); if (o.s !== undefined) { model.s = o.s; model.v = 0; model.hist = []; } if (o.vcmd !== undefined) model.vcmd = o.vcmd; if (o.clear) model.rows = []; ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B6.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1); void BL; void OR; void RD; void GR; void INK;
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B6.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

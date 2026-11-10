// VL12-B7 live page: AC generator and transformer. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, createModel, PRESETS, RANGE, readout, record} from './physics.js';
import {createRig, TABLE} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B7 · Máy phát điện và máy biến áp (Teardown)';
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
const cam = {az: 20, el: 18, d: 1.6, tx: 0.1, ty: TABLE + 0.12, tz: 0};
const VIEWFN = {hero: () => [22, 20, 1.55, 0.12, TABLE + 0.12, 0], close: () => [28, 16, 0.9, 0.0, TABLE + 0.12, 0], top: () => [0, 78, 1.5, 0.05, TABLE, 0], side: () => [90, 8, 1.5, 0.0, TABLE + 0.12, 0]};
const DURATION = 56;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [6, 'view', 'close'], [10, 'cmd', 'n', 4], [16, 'cmd', 'n', 2], [18, 'td', true], [18.1, 'view', 'side'], [24, 'td', false], [24.1, 'preset', 1], [24.2, 'view', 'hero'], [30, 'cmd', 'N2', 300], [36, 'preset', 2], [44, 'toggle', 'idealT'], [48, 'toggle', 'idealT'], [50, 'preset', 0]];
function cmd(k, v) { let x = clamp(v, RANGE[k][0], RANGE[k][1]); if (k === 'N' || k === 'N1' || k === 'N2') x = Math.round(x / 10) * 10; model[k] = x; }
function applyPreset(i) { const p = PRESETS[i]; Object.assign(model, p, {rows: [], hist: [], t: 0, th: 0, idealT: false, run: true}); if (p.mode === 'tr') model.loaded = p.loaded; ui.setPreset(i); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); }, mode(m) { userInput(); model.mode = m; model.rows = []; model.hist = []; model.t = 0; ui.setPreset(-1); }, toggle(k) { userInput(); model[k] = !model[k]; ui.setPreset(-1); }, runToggle() { userInput(); model.run = !model.run; },
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
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'close', 'top', 'side'][Number(k) - 1]); } else return;
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
  if (s.mode === 'gen') {
    at('N', rig.pts.N, {text: 'CỰC N', sub: 'từ trường đều B', color: RD, dy: -30, dx: -50, a: 1}); at('S', rig.pts.S, {text: 'CỰC S', sub: '', color: BL, dy: -30, dx: 50, a: 1});
    at('coil', rig.pts.coil, {text: `KHUNG DÂY N = ${s.N} VÒNG`, sub: `θ = ${f2((r.g.th * 180) / Math.PI, 0)}° · e = ${f2(r.g.e, 2)} V`, color: '#a86f00', dy: -50, dx: 100, a: 1});
    at('lamp', rig.pts.lamp, {text: 'ĐÈN (TẢI)', sub: `R = ${s.RL} Ω · P = ${f2(r.g.P * 1000, 0)} mW`, color: GR, dy: -30, dx: 40, a: 1});
    at('crank', rig.pts.crank, {text: 'TAY QUAY', sub: `n = ${f2(s.n, 1)} vòng/s`, color: INK, part: true, dy: -30, dx: 60, a: part}); at('rings', rig.pts.rings, {text: 'VÀNH KHUYÊN + CHỔI THAN', sub: 'đưa dòng điện ra mạch ngoài', color: INK, part: true, dy: 30, dx: 90, a: part}); at('post', rig.pts.post, {text: 'CỘT ĐỠ TRỤC', sub: 'giữ ổ đỡ trên', color: INK, part: true, dy: 30, dx: -70, a: part}); at('shaft', rig.pts.shaft, {text: 'TRỤC QUAY', sub: 'đứng, đi qua tâm khung', color: INK, part: true, dy: 40, dx: -60, a: part});
  } else {
    at('prim', rig.pts.prim, {text: `SƠ CẤP N₁ = ${s.N1} VÒNG`, sub: `U₁ = ${f2(r.t.U1, 1)} V`, color: BL, dy: -40, dx: -30, a: 1}); at('sec', rig.pts.sec, {text: `THỨ CẤP N₂ = ${s.N2} VÒNG`, sub: `U₂ = ${f2(r.t.U2, 2)} V`, color: RD, dy: -40, dx: 30, a: 1});
    at('lamp', rig.pts.lamp, {text: 'ĐÈN (TẢI)', sub: s.loaded ? `R = ${s.RLt} Ω · P₂ = ${f2(r.t.P2, 2)} W` : 'mạch hở', color: GR, dy: -30, dx: 40, a: 1}); at('src', rig.pts.src, {text: 'NGUỒN XOAY CHIỀU', sub: '50 Hz', color: INK, dy: -30, dx: 40, a: 1});
    at('core', rig.pts.core, {text: 'LÕI THÉP', sub: 'thép lá mỏng ghép cách điện', color: INK, part: true, dy: -40, dx: 0, a: part}); at('flux', rig.pts.flux, {text: 'TỪ THÔNG (chấm xanh)', sub: 'xoay chiều, chạy quanh lõi', color: BL, part: true, dy: -70, dx: 100, a: part}); at('vm', rig.pts.vm, {text: 'VÔN KẾ U₂', sub: 'điện áp thứ cấp', color: INK, part: true, dy: 30, dx: 30, a: part});
  }
  return items;
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'cmd') cmd(a, b); else if (kind === 'toggle') model[a] = !model[a]; }
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
  if (!window.B7.shown) window.B7.shown = true;
  requestAnimationFrame(frame);
}
window.B7 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) for (const [k2, v2] of Object.entries(o.set)) { if (['mode', 'loaded', 'idealT', 'run', 'th'].includes(k2)) model[k2] = v2; else cmd(k2, v2); } }};
addEventListener('error', (e) => window.B7.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B7.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.mode) { if (o.mode !== model.mode) { model.rows = []; model.hist = []; } model.mode = o.mode; } for (const k2 of ['n', 'N', 'B', 'RL', 'N1', 'N2', 'U1', 'RLt']) if (o[k2] !== undefined) cmd(k2, o[k2]); if (o.loaded !== undefined) model.loaded = o.loaded; if (o.idealT !== undefined) model.idealT = o.idealT; if (o.reset) { model.t = 0; model.th = 0; model.hist = []; } ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B7.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1); void OR; void INK; void GR; void BL; void RD;
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B7.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

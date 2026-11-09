// W5 live page: a driven string with fixed ends. One standing-wave model drives the string, the nodes, the graphs and every number.
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
import {advance, createModel, fn, PRESETS, readout} from './physics.js';
import {createRig} from './rig.js';
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
document.title = 'W5 · Sóng dừng (Teardown)';

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
  hero: () => [3, 4, 10.0, 1.3, 1.05, 0, 0],
  motor: () => [22, 8, 3.7, -0.5, 1.1, 0, 0],
  bridge: (r, s) => [-24, 8, 3.4, s.L + 0.15, 0.95, 0, 1],
  side: () => [40, 12, 9.6, 1.3, 1.05, 0, 0],
};
const DURATION = 66;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [8, 'fn', 1], [14, 'comp', true], [22, 'comp', false], [23, 'fn', 2], [31, 'fn', 3], [39, 'view', 'motor'], [41, 'td', true], [49, 'td', false], [50, 'view', 'bridge'], [54, 'view', 'hero'], [58, 'fn', 5]];

const ui = createUI(app, {
  cmd(k, v) { userInput(); model[k] = k === 'mass' ? v / 1000 : v; preset = -1; ui.setPreset(-1); },
  fn(n) { userInput(); model.f = fn(model, n); preset = -1; ui.setPreset(-1); },
  freeze() { userInput(); model.frozen = !model.frozen; },
  comp() { userInput(); model.showComp = !model.showComp; },
  nodes() { userInput(); model.showNodes = !model.showNodes; },
  preset(i) { userInput(); applyPreset(i); },
  speed(v) { model.speed = v; },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { const p = PRESETS[i]; model.L = p.L; model.mass = p.mass; model.f = typeof p.f === 'string' ? fn(model, Number(p.f.slice(1))) : p.f; model.frozen = false; model.t = 0; preset = i; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === ' ') ui.root.querySelector('#b-freeze').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'motor', 'bridge', 'side'][Number(k) - 1]); } else return;
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
  const items = [], part = clamp((td - 0.7) / 0.3, 0, 1), at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, a: 1, ...o}); };
  at('motor', rig.pts.motor, {text: 'MÁY RUNG', sub: 'biên độ nhỏ ' + f1(s.a0 * 100, 1) + ' cm', color: INK, dy: -34});
  at('bridge', rig.pts.bridge, {text: 'CẦU ĐỠ', sub: 'đầu cố định: luôn là nút', color: INK, dy: -30, dx: -20});
  at('wt', rig.pts.weights, {text: `m = ${f1(s.mass * 1000, 0)} g`, sub: `lực căng T = mg = ${f1(r.T, 2)} N`, color: '#8a6a1c', dy: 10, dx: 100});
  if (!s.showComp && s.showNodes && r.nodes.length > 1) at('node', rig.pts.node, {text: 'NÚT', sub: 'không dao động', color: '#d62839', dy: 40, dx: 10});
  if (!s.showComp && s.showNodes && r.anti.length) at('anti', rig.pts.anti, {text: 'BỤNG', sub: 'dao động mạnh nhất', color: '#2c9a4b', dy: -40});
  if (!s.showComp && s.showNodes && r.nodes.length >= 2) at('lam2', rig.pts.bracket, {text: `λ/2 = ${f1(r.lam / 2, 2)} m`, sub: 'hai nút liên tiếp', color: TL, dy: 28});
  if (s.showComp) { at('inc', rig.pts.inc, {text: 'SÓNG TỚI →', color: '#2b59c3', dy: -8}); at('ref', rig.pts.refl, {text: 'SÓNG PHẢN XẠ ←', color: '#2c9a4b', dy: 8}); }
  at('crank', rig.pts.crank, {text: 'TAY QUAY', sub: 'bán kính = biên độ máy', color: INK, part: true, dy: 50, dx: -40, a: part});
  at('yoke', rig.pts.yoke, {text: 'THANH TRƯỢT', color: INK, part: true, dy: -30, dx: 70, a: part});
  at('pulley', rig.pts.pulley, {text: 'RÒNG RỌC', sub: 'đổi lực căng thành phương ngang', color: INK, part: true, dy: -40, dx: 40, a: part});
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); else if (kind === 'fn') model.f = fn(model, v); else if (kind === 'comp') model.showComp = v; }
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
  if (!window.W5.shown) window.W5.shown = true;
  requestAnimationFrame(frame);
}
window.W5 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); if (o.t !== undefined) { model.t = o.t; model.running = false; } }};
addEventListener('error', (e) => window.W5.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.W5.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { Object.assign(model, {frozen: false}, o); model.t = 0; preset = -1; ui.setPreset(-1); },
  keep(o) { Object.assign(model, o); preset = -1; ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.W5.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.W5.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

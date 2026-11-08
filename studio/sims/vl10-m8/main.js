// VL10-M8 live page: an Atwood machine and a cart pulled by a hanging mass. One state drives the masses, the string, the
// arrows, the graphs and every number. Tours itself when left alone; any input hands control over.
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {createStage} from '../khtn8-lever/stage.js';
import {createLesson, LESSON_CSS} from '../kit-su-pham/lesson.js';
import {advance, createModel, PRESETS, RANGE, readout, reset} from './physics.js';
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
document.title = 'VL10-M8 · Bài toán động lực học (Teardown)';

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'hero', preset = 0, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 20, el: 8, d: 10, tx: 0, ty: 1.5, tz: 0};
const bp = new st.THREE.Vector3(), pp = new st.THREE.Vector3(), rp = new st.THREE.Vector3();
const VIEWFN = {
  hero: () => (model.mode === 'A' ? [18, 8, 11.5, 0, 1.45, 0] : [14, 10, 12.5, 0.3, 1.2, 0]),
  pulley: () => [20, 10, 3.2, pp.x, pp.y - 0.1, pp.z],
  mass: () => [24, 12, 3.8, bp.x, bp.y, bp.z],
  ruler: () => (model.mode === 'A' ? [-22, 8, 6.2, -0.2, 1.5, 0] : [-10, 12, 7, 0.5, 1.4, 0]),
};
const DURATION = 64;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [1, 'go'], [8, 'view', 'pulley'], [9, 'td', true], [16, 'td', false], [17, 'preset', 1], [17.1, 'view', 'hero'], [18, 'go'], [24, 'preset', 2], [24.1, 'view', 'hero'], [25, 'go'], [34, 'view', 'mass'], [38, 'view', 'pulley'], [39, 'td', true], [47, 'td', false], [48, 'view', 'ruler'], [55, 'view', 'hero']];

const ui = createUI(app, {
  cmd(k, v) { userInput(); model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); reset(model); preset = -1; ui.setPreset(-1); },
  preset(i) { userInput(); applyPreset(i); },
  go() { userInput(); go(); },
  reset() { userInput(); reset(model); },
  speed(v) { model.speed = v; },
  mode(m) { userInput(); model.mode = m; reset(model); ui.setMode(m); preset = -1; ui.setPreset(-1); },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { const p = PRESETS[i]; model.mode = p.mode; if (p.mode === 'A') Object.assign(model, {m1: p.m1, m2: p.m2}); else Object.assign(model, {M: p.M, m: p.m}); reset(model); ui.setMode(p.mode); preset = i; ui.setPreset(i); }
function go() { if (model.stopped || model.t > 0) reset(model); model.running = true; }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === ' ') ui.root.querySelector('#b-go').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'pulley', 'mass', 'ruler'][Number(k) - 1]); } else return;
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
  if (r.mode === 'A') {
    at('m1', rig.pts.m1, {text: `m₁ = ${f1(s.m1, 2)} kg`, sub: `m₁g = ${f1(r.F1, 2)} N`, color: OR, dx: -120, a: 1});
    at('m2', rig.pts.m2, {text: `m₂ = ${f1(s.m2, 2)} kg`, sub: `m₂g = ${f1(r.F2, 2)} N`, color: RD, dx: 120, a: 1});
    at('s1', rig.pts.sens1, {text: `T = ${f1(r.T, 2)} N`, sub: 'lực căng dây', color: TL, dx: -100, dy: -30, a: 1}); at('s2', rig.pts.sens2, {text: `T = ${f1(r.T, 2)} N`, color: TL, dx: 100, dy: -30, a: 1});
    at('acc', rig.pts.pulley, {text: `a = ${f1(Math.abs(r.a), 2)} m/s²`, sub: r.balanced ? 'cân bằng' : `m${r.heavier} đi xuống`, color: PU, dy: -50, a: 1});
  } else {
    at('cart', rig.pts.cart, {text: `xe M = ${f1(s.M, 1)} kg`, sub: `a = ${f1(r.a, 2)} m/s²`, color: TL, dy: -34, a: 1});
    at('hang', rig.pts.hang, {text: `quả cân m = ${f1(s.m, 2)} kg`, sub: `mg = ${f1(r.F1, 2)} N`, color: OR, dx: 110, a: 1});
    at('tc', rig.pts.tC, {text: `T = ${f1(r.T, 2)} N`, sub: 'lực căng dây', color: TL, dy: 36, a: 1});
  }
  at('pul', rig.pts.pulley, {text: 'RÒNG RỌC', sub: 'nhẹ, ma sát không đáng kể', color: INK, part: true, dx: 110, dy: -20, a: part});
  at('bear', rig.pts.bearing, {text: 'Ổ BI', sub: 'giảm ma sát ở trục', color: INK, part: true, dx: -90, dy: 56, a: part});
  at('sens', r.mode === 'A' ? rig.pts.sens1 : rig.pts.sens1, {text: 'CẢM BIẾN LỰC CĂNG', sub: 'đo T trên dây', color: INK, part: true, dx: -110, dy: 50, a: part});
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
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, T);
  rig.worldPt(r.mode === 'A' ? rig.pts.m2 : rig.pts.hang, bp); rig.worldPt(rig.pts.pulley, pp);
  const v = VIEWFN[viewName](), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model); ui.sliders(model); ui.setGo(model.running ? 'Đang chạy…' : model.stopped ? '↺ Thả lại' : '▶ Thả');
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.M8.shown) window.M8.shown = true;
  requestAnimationFrame(frame);
}
window.M8 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); if (o.runTo !== undefined) { go(); for (let i = 0; i < o.runTo * 120; i++) advance(model, 1 / 120); } }};
addEventListener('error', (e) => window.M8.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M8.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  setA(m1, m2) { model.mode = 'A'; model.m1 = m1; model.m2 = m2; reset(model); ui.setMode('A'); preset = -1; ui.setPreset(-1); },
  setC(M, m) { model.mode = 'C'; model.M = M; model.m = m; reset(model); ui.setMode('C'); preset = -1; ui.setPreset(-1); },
  reset() { reset(model); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M8.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M8.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

// VL10-M7 live page: a block on a hinged plank. One physics state drives the block, the arrows, the panels and the
// measured μ. Tours itself when left alone; any input hands control to the visitor.
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {createStage} from '../khtn8-lever/stage.js';
import {createLesson, LESSON_CSS} from '../kit-su-pham/lesson.js';
import {advance, createModel, PRESETS, RANGE, readout, resetBlock} from './physics.js';
import {createRig} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const OR = '#e8590c', TL = '#0b8f8c', RD = '#c0392b', PU = '#5b3cc4', INK = '#14303c';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { const k = clamp(x, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'.split(',').map((c) => 'U+' + c).join(',');
const face = (fam, w, d, r) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${d}) format('woff2');unicode-range:${r}}`;
const style = document.createElement('style');
style.textContent = [face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI), face('JetBrains Mono', 400, grFont400, 'U+0370-03FF'), face('JetBrains Mono', 700, grFont700, 'U+0370-03FF'), face('Inter', '100 900', viInter, VI), CSS, LESSON_CSS].join('\n');
document.head.appendChild(style);
document.title = 'VL10-M7 · Ma sát và mặt phẳng nghiêng (Teardown)';

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel(), ramps = {};
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'hero', preset = 0, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 25, el: 18, d: 6.5, tx: 0, ty: 0.9, tz: 0};
const bp = new st.THREE.Vector3(), sp = new st.THREE.Vector3();

const VIEWFN = {
  hero: () => [24, 16, 7.2, 0, 0.9, 0],
  side: () => [0, 4, 7.6, 0, 0.9, 0],
  block: () => [6, 16, 3.6, bp.x, bp.y + 0.15, bp.z + 0.25],
  scale: () => [22, 18, 2.6, sp.x, sp.y, sp.z],
};
const DURATION = 62;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'side'], [3, 'ramp', ['alpha', 30, 1.0]], [14, 'view', 'block'], [20, 'td', true], [26, 'td', false], [27, 'preset', 1], [27.1, 'view', 'hero'],
  [35, 'mat', 1], [40, 'preset', 2], [41, 'ramp', ['F', 30, 3]], [46, 'view', 'scale'], [54, 'view', 'hero'], [58, 'ramp', ['F', 0, 40]]];

const ui = createUI(app, {
  cmd(k, v) { userInput(); model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); delete ramps[k]; preset = -1; ui.setPreset(-1); if (k === 'm') { /* keep the block */ } },
  mat(i) { userInput(); model.mat = i; preset = -1; ui.setPreset(-1); },
  preset(i) { userInput(); applyPreset(i); },
  reset() { userInput(); resetBlock(model); },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { const p = PRESETS[i]; Object.assign(model, {mat: p.mat, alpha: p.alpha, m: p.m, F: p.F}); resetBlock(model); for (const k of Object.keys(ramps)) delete ramps[k]; preset = i; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'side', 'block', 'scale'][Number(k) - 1]); } else return;
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
  at('P', rig.pts.P, {text: `P = mg = ${f1(r.P, 0)} N`, color: RD, dy: 22, a: 1});
  at('N', rig.pts.N, {text: `N = ${f1(r.N, 1)} N`, sub: 'phản lực của ván', color: TL, dy: -30, a: 1});
  at('Fms', rig.pts.Fms, {text: `Fms = ${f1(Math.abs(r.fr), 1)} N`, sub: r.moving ? 'ma sát trượt μk·N' : 'ma sát nghỉ', color: OR, dy: 30, a: Math.abs(r.fr) > 0.05 ? 1 : 0});
  at('T', rig.pts.T, {text: `T = F = ${f1(r.F, 1)} N`, sub: 'lực căng dây', color: PU, dy: -34, a: r.F > 0.05 ? 1 : 0});
  at('alpha', rig.pts.pro, {text: `α = ${f1(s.alpha, 1)}°`, color: INK, dx: -30, dy: 20, a: 1});
  at('mag', rig.pts.mag, {text: 'KÍNH LÚP', sub: 'bề mặt mấp mô cài vào nhau', color: INK, part: true, dy: -52, a: part});
  at('scale', rig.pts.scale, {text: 'LỰC KẾ', sub: 'lò xo giãn: F = k·Δl', color: INK, part: true, dy: -52, a: part});
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); else if (kind === 'mat') { model.mat = v; resetBlock(model); } else if (kind === 'ramp') ramps[v[0]] = {to: v[1], rate: v[2]}; }
    ui.setView('');
  }
  for (const [k, rm] of Object.entries(ramps)) { const d = rm.to - model[k]; if (Math.abs(d) < 1e-6) delete ramps[k]; else model[k] += Math.sign(d) * Math.min(Math.abs(d), rm.rate * dt); }
  advance(model, dt);
  const r = readout(model);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td);
  rig.worldPt(rig.pts.block, bp); rig.worldPt(rig.pts.scale, sp);
  const v = VIEWFN[viewName](), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model); ui.sliders(model); ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.M7.shown) window.M7.shown = true;
  requestAnimationFrame(frame);
}
window.M7 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); if (o.reset) resetBlock(model); }};
addEventListener('error', (e) => window.M7.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M7.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { Object.assign(model, o); for (const k of Object.keys(ramps)) delete ramps[k]; preset = -1; ui.setPreset(-1); },
  reset() { resetBlock(model); },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M7.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M7.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

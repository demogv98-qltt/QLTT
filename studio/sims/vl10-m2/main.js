// VL10-M2 live page: a test car on a road. One analytic model drives the car, the strobe copies, the arrows and both
// graphs. Left alone it tours itself (camera, runs, teardown); any click, drag, wheel or key hands control to the
// visitor and 25 s of quiet hands it back while AUTO-TOUR is on.
import {keyed} from 'teardown-kit/util.js';
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {createStage} from '../khtn8-lever/stage.js';
import {createLesson, LESSON_CSS} from '../kit-su-pham/lesson.js';
import {advance, createModel, PRESETS, RANGE, readout, span, T_MAX} from './physics.js';
import {createRig} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const TL = '#0b8f8c', OR = '#e8590c', INK = '#14303c';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => { const k = clamp(x, 0, 1); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const VI = '0102-0103,0110-0111,0128-0129,0168-0169,01A0-01A1,01AF-01B0,0300-0301,0303-0304,0308-0309,0323,0329,1EA0-1EF9,20AB'.split(',').map((c) => 'U+' + c).join(',');
const face = (fam, w, d, r) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${d}) format('woff2');unicode-range:${r}}`;
const style = document.createElement('style');
style.textContent = [face('JetBrains Mono', 400, viFont400, VI), face('JetBrains Mono', 600, viFont600, VI), face('JetBrains Mono', 700, viFont700, VI), face('JetBrains Mono', 400, grFont400, 'U+0370-03FF'), face('JetBrains Mono', 700, grFont700, 'U+0370-03FF'), face('Inter', '100 900', viInter, VI), CSS, LESSON_CSS].join('\n');
document.head.appendChild(style);
document.title = 'VL10-M2 · Chuyển động thẳng biến đổi đều (Teardown)';

// camera views: [az°, el°, distance, target x, y, z, follow?]
const VIEWFN = {
  follow: (r) => [38, 14, 13, r.d + 1.6, 0.8, 0, 1],
  wide: (r, sp) => [14, 30, Math.max(16, 2.7 * (sp[1] - sp[0]) + 10), (sp[0] + sp[1]) / 2, 0.5, 0, 0],
  top: (r) => [0, 78, 17, r.d, 0, 0, 1],
  wheel: (r) => [28, 46, 4.2, r.d - 0.6, 0.5, 0.2, 1],
};
const DURATION = 52;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'follow'], [10, 'view', 'wheel'], [10.5, 'td', true], [16, 'view', 'follow'], [19, 'preset', 1], [20, 'td', false],
  [30, 'view', 'wide'], [31, 'preset', 2], [43, 'view', 'top'], [48, 'view', 'follow']];

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'follow', manual = null, preset = 0, followBlend = 1, txSmooth = 0, lessonH = 0, shift = 0;
const cam = {az: 38, el: 16, d: 8, tx: 1.4, ty: 0.7, tz: 0};
let off = {az: 0, el: 0, k: 1};

const ui = createUI(app, {
  cmd(k, v) { userInput(); if (k === 't') { model.t = v; model.playing = false; } else { model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); preset = -1; ui.setPreset(-1); } },
  preset(i) { userInput(); applyPreset(i); },
  play() { userInput(); if (model.t >= T_MAX) model.t = 0; model.playing = !model.playing; },
  reset() { userInput(); model.t = 0; model.playing = false; },
  speed(v) { model.speed = v; },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { const p = PRESETS[i]; model.v0 = p.v0; model.a = p.a; model.t = 0; model.playing = true; preset = i; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click();
  else if (k === ' ') ui.root.querySelector('#b-play').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['follow', 'wide', 'top', 'wheel'][Number(k) - 1]); } else return;
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
function labelItems(r, td) {
  const items = [], part = clamp((td - 0.8) / 0.2, 0, 1);
  const at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  at('v', rig.pts.vTip, {text: `v = ${f1(r.v)} m/s`, color: TL, dy: -34, a: Math.abs(r.v) > 0.05 ? 1 : 0});
  at('a', rig.pts.aTip, {text: `a = ${f1(r.a)} m/s²`, color: OR, dy: -64, a: Math.abs(r.a) > 0.05 ? 1 : 0});
  at('car', rig.pts.car, {text: `d = ${f1(r.d)} m`, sub: `s = ${f1(r.s)} m`, color: INK, dy: 48, a: 1 - part});
  at('O', rig.pts.O, {text: 'O · x = 0', color: INK, part: true, dy: -10, a: 1});
  at('enc', rig.pts.enc, {text: 'ĐĨA MÃ HOÁ', sub: `24 khe · đếm ${r.pulses} xung`, color: INK, part: true, dy: -70, dx: -80, a: part});
  at('mot', rig.pts.motor, {text: 'ĐỘNG CƠ', sub: 'tạo gia tốc a', color: INK, part: true, dy: -90, dx: 60, a: part});
  at('bat', rig.pts.bat, {text: 'PIN', sub: 'nguồn điện', color: INK, part: true, dy: -50, dx: -20, a: part});
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model), sp = span(model);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, clamp(cam.d / 30, 1, 4));
  // camera: a follow view tracks the car exactly (no lag at 50 m/s); the others ease
  const v = VIEWFN[viewName](r, sp);
  const k = 1 - Math.exp(-dt / 0.3);
  followBlend += ((v[6] ? 1 : 0) - followBlend) * (1 - Math.exp(-dt / 0.25));
  txSmooth += (v[3] - txSmooth) * k; if (followBlend > 0.99) txSmooth = v[3];
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k;
  cam.tx = txSmooth + (v[3] - txSmooth) * followBlend; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx);
  st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model); ui.sliders(model); ui.setPlay(model.playing, model.t >= T_MAX); ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, td));
  if (!window.M2.shown) window.M2.shown = true;
  requestAnimationFrame(frame);
}
window.M2 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.v0 !== undefined) model.v0 = o.v0; if (o.a !== undefined) model.a = o.a; if (o.t !== undefined) { model.t = o.t; model.playing = false; } if (o.preset !== undefined) applyPreset(o.preset); }};
addEventListener('error', (e) => window.M2.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M2.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(v0, a) { model.v0 = v0; model.a = a; model.t = 0; model.playing = false; preset = -1; ui.setPreset(-1); },
  reset() { model.t = 0; model.playing = false; },
}), {ctx: () => ({s: model, r: readout(model), c: {v0: model.v0, a: model.a, t: model.t}, td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M2.lesson = lesson;
model.v0 = 0; model.a = 2; ui.setPreset(-1); ui.setView('follow');
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M2.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });
void keyed; void manual;

// S3 live page: a beating heart. One cardiac-cycle state drives the walls, valves, blood, sound, graphs and every number.
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
import {advance, createModel, PRESETS, readout, setPhase} from './physics.js';
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
document.title = 'S3 · Tim và vòng tuần hoàn (Teardown)';

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H); st.renderer.localClippingEnabled = true;
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastPh = '', lastInput = 0, viewName = 'hero', preset = -1, followBlend = 1, txSmooth = 0, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 14, el: 12, d: 24, tx: 0, ty: 1, tz: 0};
const VIEWFN = {
  hero: () => [8, 6, 6.6, 0, 1.3, 0, 0],
  cut: () => [0, 2, 4.0, 0, 1.2, 0, 0],
  vessels: () => [0, 4, 10.4, 0, 0.95, 0, 0],
  side: () => [72, 8, 5.4, 0, 1.25, 0, 0],
};
const DURATION = 64;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [9, 'view', 'cut'], [10, 'td', true], [22, 'phase', 'atrial'], [25, 'phase', 'ventricular'], [28, 'phase', 'diastole'], [31, 'run'], [33, 'td', false], [34, 'view', 'vessels'], [42, 'preset', 1], [42.1, 'view', 'hero'], [50, 'preset', 0], [50.1, 'view', 'side'], [58, 'view', 'hero']];

// heart sounds: a low "tùng" at the start of ventricular systole and a shorter "tắc" at its end (AudioContext starts on the first click)
let ac = null;
function thump(freq, dur, gain) {
  if (!model.sound || !ac || ac.state !== 'running') return; const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
addEventListener('pointerdown', () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { /* no audio */ } }, {once: false});
const ui = createUI(app, {
  hr(v) { userInput(); model.hr = v; preset = -1; ui.setPreset(-1); },
  pause() { userInput(); model.paused = !model.paused; },
  phase(id) { userInput(); setPhase(model, id); },
  sound() { userInput(); model.sound = !model.sound; },
  flow() { userInput(); model.flow = model.flow === 'on' ? 'off' : 'on'; },
  preset(i) { userInput(); applyPreset(i); },
  speed(v) { model.speed = v; },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function applyPreset(i) { model.hr = PRESETS[i].hr; model.paused = false; preset = i; ui.setPreset(i); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === ' ') ui.root.querySelector('#b-pause').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'cut', 'vessels', 'side'][Number(k) - 1]); } else return;
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
  const RB = '#2b59c3', RR = '#c0392b';
  at('LV', rig.pts.LV, {text: 'TÂM THẤT TRÁI', sub: `${f1(r.vol, 0)} mL · thành dày nhất`, color: RR, dy: 30, dx: 60});
  at('RV', rig.pts.RV, {text: 'TÂM THẤT PHẢI', sub: 'bơm máu lên phổi', color: RB, dy: 50, dx: -80});
  at('RA', rig.pts.RA, {text: 'TÂM NHĨ PHẢI', sub: 'nhận máu từ cơ thể', color: RB, dy: -10, dx: -100});
  at('LA', rig.pts.LA, {text: 'TÂM NHĨ TRÁI', sub: 'nhận máu từ phổi', color: RR, dy: -40, dx: 90});
  at('ao', rig.pts.aorta, {text: 'ĐỘNG MẠCH CHỦ', sub: `${f1(r.pao, 0)} mmHg`, color: RR, dy: -34, dx: 80});
  at('pul', rig.pts.pul, {text: 'ĐỘNG MẠCH PHỔI', sub: 'máu đỏ sẫm lên phổi', color: RB, dy: -30, dx: -70});
  at('svc', rig.pts.svc, {text: 'TĨNH MẠCH CHỦ TRÊN', sub: 'từ đầu, cổ, tay', color: RB, dy: -10, dx: -90});
  at('ivc', rig.pts.ivc, {text: 'TĨNH MẠCH CHỦ DƯỚI', sub: 'từ thân và chân', color: RB, dy: 10, dx: -90});
  at('pv', rig.pts.pv, {text: 'TĨNH MẠCH PHỔI', sub: 'máu đỏ tươi về tim', color: RR, dy: -20, dx: 70});
  at('mit', rig.pts.mit, {text: 'VAN HAI LÁ', sub: r.avOpen ? 'đang mở' : 'đang đóng', color: INK, part: true, dy: 36, dx: 70, a: part});
  at('tri', rig.pts.tri, {text: 'VAN BA LÁ', sub: r.avOpen ? 'đang mở' : 'đang đóng', color: INK, part: true, dy: 36, dx: -70, a: part});
  at('aov', rig.pts.aov, {text: 'VAN ĐỘNG MẠCH CHỦ', sub: r.slOpen ? 'đang mở' : 'đang đóng', color: INK, part: true, dy: -50, dx: 40, a: part});
  at('septum', rig.pts.septum, {text: 'VÁCH NGĂN TIM', sub: 'tách máu đỏ tươi và đỏ sẫm', color: INK, part: true, dy: 60, dx: 0, a: part});
  at('coronary', rig.pts.coronary, {text: 'ĐỘNG MẠCH VÀNH', sub: 'nuôi dưỡng cơ tim', color: INK, part: true, dy: 90, dx: 90, a: part * 0.9});
  at('body', rig.pts.body, {text: 'CÁC CƠ QUAN CỦA CƠ THỂ', sub: 'mao mạch: máu mất O₂', color: INK, part: false, dy: 0, dx: 0, a: viewName === 'vessels' ? 1 : 0});
  at('lung', rig.pts.lung, {text: 'PHỔI', sub: 'mao mạch: máu nhận O₂', color: INK, part: false, dy: 0, dx: 0, a: viewName === 'vessels' ? 1 : 0});
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); else if (kind === 'phase') setPhase(model, v); else if (kind === 'run') model.paused = false; }
    ui.setView('');
  }
  model.showCircuit = viewName === 'vessels';
  advance(model, dt);
  const r = readout(model);
  if (r.ph.id !== lastPh) { if (r.ph.id === 'ventricular') thump(62, 0.16, 0.9); else if (r.ph.id === 'diastole') thump(95, 0.1, 0.55); lastPh = r.ph.id; }
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, dt);
  const v = VIEWFN[viewName](r, model), k = 1 - Math.exp(-dt / 0.3);
  followBlend += ((v[6] ? 1 : 0) - followBlend) * (1 - Math.exp(-dt / 0.25)); txSmooth += (v[3] - txSmooth) * k; if (followBlend > 0.99) txSmooth = v[3];
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx = txSmooth + (v[3] - txSmooth) * followBlend; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.S3.shown) window.S3.shown = true;
  requestAnimationFrame(frame);
}
window.S3 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.set) Object.assign(model, o.set); if (o.t !== undefined) { model.t = o.t; model.running = false; } }};
addEventListener('error', (e) => window.S3.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.S3.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  hr(v) { model.hr = v; preset = -1; ui.setPreset(-1); },
  phase(id) { setPhase(model, id); },
  run() { model.paused = false; },
}), {ctx: () => ({s: model, r: readout(model), td: tdS.v, view: viewName}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.S3.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.S3.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

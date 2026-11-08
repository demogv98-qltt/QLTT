// VL10-M6 live page: Newton's laws on a fan cart and on a pair of spring-pushed carts. One physics state drives the
// pose, the arrows, the graphs and every number. Tours itself when left alone; any input hands control over.
import {warmUp} from 'teardown-kit/warm.js';
import viFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-400-normal.woff2';
import viFont600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-600-normal.woff2';
import viFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-vietnamese-700-normal.woff2';
import grFont400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-400-normal.woff2';
import grFont700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-greek-700-normal.woff2';
import viInter from '@fontsource-variable/inter/files/inter-vietnamese-wght-normal.woff2';
import {createStage} from '../khtn8-lever/stage.js';
import {createLesson, LESSON_CSS} from '../kit-su-pham/lesson.js';
import {advance, createModel, DT_C, fire, PRESETS, RANGE, readout, reset, T_MAX} from './physics.js';
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
document.title = 'VL10-M6 · Ba định luật Newton (Teardown)';

// centre x of what we look at, and the x-range of the whole run (for the wide view)
const cx = (r) => (r.mode === 'N2' ? r.x : (r.x1 + r.x2) / 2);
function runSpan(s) {
  if (s.mode === 'N2') { const xe = ((s.F / s.M) * T_MAX * T_MAX) / 2; return [Math.min(0, xe) - 1, Math.max(0, xe) + 1]; }
  const x1 = -(s.F0 / s.M1) * (DT_C * DT_C / 2 + DT_C * (T_MAX - DT_C)) - 1, x2 = (s.F0 / s.M2) * (DT_C * DT_C / 2 + DT_C * (T_MAX - DT_C)) + 1; return [x1 - 1, x2 + 1];
}
const VIEWFN = {
  follow: (r, sp) => (r.mode === 'N2' ? [38, 14, 9, r.x + 1.2, 0.7, 0, 1] : [30, 16, 6.5 + Math.abs(r.x2 - r.x1) * 1.15, cx(r), 0.6, 0, 1]),
  wide: (r, sp) => [14, 30, Math.max(14, (sp[1] - sp[0]) * 2.0 + 6), (sp[0] + sp[1]) / 2, 0.5, 0, 0],
  top: (r) => [0, 78, r.mode === 'N2' ? 13 : 8 + Math.abs(r.x2 - r.x1) * 0.9, cx(r), 0, 0, 1],
  close: (r) => (r.mode === 'N2' ? [-40, 38, 3.6, r.x - 0.2, 0.7, 0, 1] : [24, 34, 6.2, cx(r), 0.5, 0, 1]),
};
const DURATION = 58;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'follow'], [0.2, 'run'], [4, 'fanoff'], [9, 'view', 'close'], [9.5, 'td', true], [16, 'td', false], [16.5, 'preset', 2], [16.6, 'run'], [17, 'view', 'follow'],
  [24, 'view', 'wide'], [26, 'td', true], [32, 'td', false], [34, 'preset', 0], [34.2, 'run'], [34.3, 'view', 'top'], [42, 'view', 'follow'], [50, 'view', 'wide']];

const app = document.getElementById('app');
const canvas = document.createElement('canvas'); canvas.id = 'gl'; app.appendChild(canvas);
const st = createStage(canvas, W, H);
const rig = createRig(st.scene);
const model = createModel();
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'follow', preset = 0, followBlend = 1, txSmooth = 0, lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1};
const cam = {az: 38, el: 14, d: 9, tx: 1.2, ty: 0.7, tz: 0};
const hist = {t: [], v: [], t3: [], v1: [], v2: [], p1: [], p2: [], p: []};
const clearHist = () => { for (const k of Object.keys(hist)) hist[k].length = 0; };

const ui = createUI(app, {
  cmd(k, v) { userInput(); model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); if (k === 'F' && model.F > 0 && !model.run && model.t === 0) model.fan = true; if (!model.run) { reset(model); clearHist(); } preset = -1; ui.setPreset(-1); },
  preset(i) { userInput(); applyPreset(i); },
  run() { userInput(); toggleRun(); },
  fan() { userInput(); model.fan = !model.fan; },
  reset() { userInput(); reset(model); clearHist(); },
  mode(m) { userInput(); setMode(m); },
  teardown() { userInput(); setTd(!tdS.on); },
  tour() { if (tour.run) { tour.enabled = false; tour.run = false; } else { tour.enabled = true; startTour(); } lastInput = T; },
  view(v) { userInput(); setView(v); },
});
function setMode(m) { model.mode = m; reset(model); clearHist(); ui.setMode(m); preset = -1; ui.setPreset(-1); }
function applyPreset(i) { const p = PRESETS[i]; model.mode = p.mode; if (p.mode === 'N2') { model.F = p.F; model.M = p.M; } else { model.M1 = p.M1; model.M2 = p.M2; model.F0 = p.F0; } reset(model); clearHist(); ui.setMode(p.mode); preset = i; ui.setPreset(i); }
function startRun() { if (model.mode === 'N2') { if (model.t >= T_MAX || model.t > 0) { reset(model); clearHist(); } model.run = true; } else { if (model.c.phase !== 'ready') { reset(model); clearHist(); } fire(model); } }
function toggleRun() { if (model.mode === 'N2' && model.run) model.run = false; else if (model.mode === 'N2' && model.t > 0 && model.t < T_MAX) model.run = true; else startRun(); }
function setTd(on) { tdS.from = tdS.v; tdS.on = on; tdS.t0 = T; }
function setView(v) { viewName = v; off = {az: 0, el: 0, k: 1}; ui.setView(v); }
function startTour() { tour.run = true; tour.t0 = T; tour.ev = 0; off = {az: 0, el: 0, k: 1}; }
function userInput() { lastInput = T; if (tour.run) tour.run = false; }
addEventListener('pointerdown', (e) => { if (e.target.closest?.('#b-tour')) return; userInput(); });
addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === 't') ui.root.querySelector('#b-td').click(); else if (k === 'a') ui.root.querySelector('#b-tour').click(); else if (k === ' ') ui.root.querySelector('#b-run').click(); else if (k === 'r') ui.root.querySelector('#b-reset').click();
  else if ('1234'.includes(k) && k) { userInput(); setView(['follow', 'wide', 'top', 'close'][Number(k) - 1]); } else return;
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
  const items = [], part = clamp((td - 0.8) / 0.2, 0, 1), at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  if (r.mode === 'N2') {
    at('F', rig.pts.F, {text: `F = ${f1(r.F)} N`, sub: r.fan ? 'lực đẩy của quạt' : 'quạt đã tắt', color: OR, dy: -34, a: r.F > 0.05 ? 1 : 0.0});
    at('car', rig.pts.car, {text: `v = ${f1(r.v, 2)} m/s`, sub: `a = F/M = ${f1(r.a, 2)} m/s²`, color: TL, dy: -34, a: 1 - part * 0.0});
    at('fan', rig.partPts.fan, {text: 'QUẠT', sub: 'đẩy khí ra sau → khí đẩy xe tới', color: INK, part: true, dx: -90, dy: -70, a: part});
    at('mot', rig.partPts.motor, {text: 'ĐỘNG CƠ', sub: 'quay cánh quạt', color: INK, part: true, dx: -40, dy: 60, a: part});
  } else {
    if (r.phase === 'contact') { at('fA', rig.pts.fA, {text: `F₂₁ = ${f1(r.f, 0)} N`, sub: 'lực của xe 2 lên xe 1', color: OR, dy: -40, dx: -10, a: 1}); at('fB', rig.pts.fB, {text: `F₁₂ = ${f1(r.f, 0)} N`, sub: 'lực của xe 1 lên xe 2', color: TL, dy: -40, dx: 10, a: 1}); }
    at('A', rig.pts.A, {text: `xe 1 · ${f1(r.M1, 0)} kg`, sub: `v₁ = ${f1(r.v1, 2)} m/s`, color: TL, dy: -30, a: 1}); at('B', rig.pts.B, {text: `xe 2 · ${f1(r.M2, 0)} kg`, sub: `v₂ = ${f1(r.v2, 2)} m/s`, color: OR, dy: -30, a: 1});
    at('sA', rig.pts.sA, {text: 'CẢM BIẾN LỰC 1', sub: `đọc ${f1(r.f, 0)} N`, color: INK, part: true, dy: 60, dx: -10, a: part}); at('sB', rig.pts.sB, {text: 'CẢM BIẾN LỰC 2', sub: `đọc ${f1(r.f, 0)} N`, color: INK, part: true, dy: 60, dx: 10, a: part});
  }
  return items;
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, v] = EVENTS[tour.ev++]; if (kind === 'td') setTd(v); else if (kind === 'preset') applyPreset(v); else if (kind === 'view') setView(v); else if (kind === 'run') startRun(); else if (kind === 'fanoff') model.fan = false; }
    ui.setView('');
  }
  advance(model, dt);
  const r = readout(model), sp = runSpan(model);
  // history for the graphs (reset whenever the run restarts)
  if (r.mode === 'N2') { if (hist.t.length && r.t < hist.t[hist.t.length - 1]) clearHist(); if (!hist.t.length || r.t - hist.t[hist.t.length - 1] > 0.03) { hist.t.push(r.t); hist.v.push(r.v); } }
  else { if (hist.t3.length && r.t < hist.t3[hist.t3.length - 1]) clearHist(); if (!hist.t3.length || r.t - hist.t3[hist.t3.length - 1] > 0.03) { hist.t3.push(r.t); hist.v1.push(r.v1); hist.v2.push(r.v2); hist.p1.push(r.p1); hist.p2.push(r.p2); hist.p.push(r.p); } }
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, T, dt);
  const v = VIEWFN[viewName](r, sp), k = 1 - Math.exp(-dt / 0.3);
  followBlend += ((v[6] ? 1 : 0) - followBlend) * (1 - Math.exp(-dt / 0.25)); txSmooth += (v[3] - txSmooth) * k; if (followBlend > 0.99) txSmooth = v[3];
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx = txSmooth + (v[3] - txSmooth) * followBlend; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: cam.el * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model, hist); ui.sliders(model); ui.setFan(model.fan);
  ui.setRun(r.mode === 'N2' ? (model.run ? '❚❚ Dừng' : model.t > 0 ? '▶ Tiếp / chạy lại' : '▶ Chạy') : (r.phase === 'ready' ? '▶ Chạy (bật lò xo)' : '↺ Chạy lại'));
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, td));
  if (!window.M6.shown) window.M6.shown = true;
  requestAnimationFrame(frame);
}
window.M6 = {st, rig, model, readout: () => readout(model), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd, setMode, startRun,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.run) startRun(); if (o.fan !== undefined) model.fan = o.fan; if (o.set) Object.assign(model, o.set); }};
addEventListener('error', (e) => window.M6.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.M6.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  setN2(F, M) { model.mode = 'N2'; model.F = F; model.M = M; reset(model); clearHist(); ui.setMode('N2'); preset = -1; ui.setPreset(-1); },
  setN3(M1, M2, F0) { model.mode = 'N3'; model.M1 = M1; model.M2 = M2; model.F0 = F0; reset(model); clearHist(); ui.setMode('N3'); preset = -1; ui.setPreset(-1); },
  reset() { reset(model); clearHist(); },
}), {ctx: () => ({s: model, r: readout(model), mode: model.mode, td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.M6.lesson = lesson;
ui.setMode('N2'); ui.setView('follow'); ui.setPreset(-1);
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.M6.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

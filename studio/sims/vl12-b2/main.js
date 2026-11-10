// VL12-B2 live page: field of a straight wire, a loop and a solenoid. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, coilField, createModel, MU0, newCompass, PRESETS, probePos, RANGE, readout, record, SOL, srcHoriz, wireB, wireIdeal} from './physics.js';
import {createRig, GRID, TABLE} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B2 · Từ trường của dòng điện (Teardown)';
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
const comps = GRID.map(([x, z]) => newCompass(x, z)), probe = newCompass(0, 0), all = [...comps, probe];
let T = 0, last = performance.now(), scale = 1, tier = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700 ? 2 : 0;
const tdS = {on: false, v: 0, from: 0, t0: -9};
const tour = {enabled: true, run: true, t0: 0, ev: 0, last: -1};
let lastInput = 0, viewName = 'hero', lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1}, curve = null, curveKey = '';
const cam = {az: 0, el: 52, d: 4.1, tx: 0, ty: 0.7, tz: 0.06};
const VIEWFN = {hero: () => [18, 38, 4.4, 0, 0.78, 0.04], top: () => [0, 89, 3.4, 0, 0.7, 0], near: () => [0, 50, 1.7, 0, 0.7, 0.02], side: () => [75, 14, 3.4, 0.1, 0.8, 0]};
const DURATION = 66;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 0], [0.02, 'view', 'hero'], [0.05, 'mode', 'compass'], [8, 'cmd', 'I', -5], [14, 'cmd', 'I', 5], [16, 'mode', 'lines'], [22, 'preset', 1], [22.1, 'mode', 'lines'], [22.2, 'view', 'near'], [30, 'mode', 'filings'], [34, 'preset', 2], [34.1, 'mode', 'filings'], [34.2, 'view', 'top'], [42, 'mode', 'lines'], [46, 'view', 'hero'], [48, 'td', true], [48.1, 'view', 'side'], [56, 'td', false], [56.1, 'view', 'hero'], [60, 'preset', 0]];
const touch = () => { model.dirty = true; model.fdirty = true; };
function cmd(k, v) { let lo = RANGE[k]?.[0], hi = RANGE[k]?.[1]; if (k === 'N') { lo = model.src === 'loop' ? 1 : 10; hi = model.src === 'loop' ? 6 : 200; v = Math.round(v); } if (k === 'r') lo = model.src === 'wire' ? 0.05 : 0; model[k] = clamp(v, lo ?? -1e9, hi ?? 1e9); touch(); }
function curveFor(s) {
  if (s.src === 'wire') { const m = [], id = []; for (let i = 0; i <= 60; i++) { const r = 0.05 * Math.pow(0.5 / 0.05, i / 60); m.push([r, Math.abs(wireB(s.I || 1e-9, r))]); id.push([r, Math.abs(wireIdeal(s.I || 1e-9, r))]); } const mx = Math.max(...id.map((p) => p[1])), mn = Math.min(...m.map((p) => p[1])); return {model: m, ideal: id, lo: 10 ** Math.floor(Math.log10(mn)), hi: 10 ** Math.ceil(Math.log10(mx))}; }
  const m = []; for (let i = 0; i <= 80; i++) { const u = -0.4 + (0.8 * i) / 80; m.push([u, coilField(s, u, 0, 60)[0]]); }
  const ideal = Math.abs(s.src === 'loop' ? (MU0 * s.N * s.I) / (2 * s.R) : (MU0 * s.N * s.I) / SOL.L), mx = Math.max(ideal, ...m.map((p) => Math.abs(p[1]))) || 1e-6, big = mx >= 1e-3;
  return {model: m, ideal, hi: mx * 1.15, unit: big ? 1e3 : 1e6, unitName: big ? 'mT' : 'µT'};
}
function setMode(m) { model.mode = m; touch(); if (m !== 'compass' && viewName === 'hero') viewName = 'near'; }
function toggle(k) { model[k] = !model[k]; touch(); }
function setSrc(src) { model.src = src; if (src === 'loop') { model.N = clamp(model.N, 1, 6); } else if (src === 'sol') { model.N = clamp(model.N < 10 ? 150 : model.N, 10, 200); } if (src === 'wire' && model.r < 0.05) model.r = 0.05; model.rows = []; touch(); }
function applyPreset(i) { const p = PRESETS[i]; setSrc(p.src); Object.assign(model, {I: p.I, N: p.src === 'sol' ? 150 : p.N, R: p.R, r: p.r, alpha: p.alpha}); model.rows = []; touch(); ui.setPreset(i); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); }, mode(m) { userInput(); setMode(m); }, source(s) { userInput(); setSrc(s); ui.setPreset(-1); }, toggle(k) { userInput(); toggle(k); },
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
  else if ('1234'.includes(k) && k) { userInput(); setView(['hero', 'top', 'near', 'side'][Number(k) - 1]); } else return;
  e.preventDefault();
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = {x: e.clientX, y: e.clientY}; canvas.setPointerCapture(e.pointerId); canvas.classList.add('drag'); });
canvas.addEventListener('pointermove', (e) => { if (!drag) return; off.az -= ((e.clientX - drag.x) / scale) * 0.3; off.el = clamp(off.el + ((e.clientY - drag.y) / scale) * 0.2, -40, 40); drag = {x: e.clientX, y: e.clientY}; lastInput = T; });
const endDrag = () => { drag = null; canvas.classList.remove('drag'); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); userInput(); off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.3, 3); }, {passive: false});
const TIERS = [{pr: 2, shadow: 2048}, {pr: 1.5, shadow: 1024}, {pr: 1, shadow: 1024}];
const fit = () => { scale = Math.min(innerWidth / W, innerHeight / H); app.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`; st.setQuality({pr: clamp((devicePixelRatio || 1) * scale, 0.75, TIERS[tier].pr), shadow: TIERS[tier].shadow}); };
fit(); addEventListener('resize', fit);
const proj = (p) => st.project(rig.worldPt(p));
const fmtB = (T2) => (T2 >= 1e-3 ? `${(T2 * 1e3).toFixed(3).replace('.', ',')} mT` : `${(T2 * 1e6).toFixed(1).replace('.', ',')} µT`);
function labelItems(r, s, td) {
  const items = [], part = clamp((td - 0.8) / 0.2, 0, 1), at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  at('src', s.src === 'wire' ? rig.pts.wireTop : rig.pts.coil, {text: { wire: 'DÂY THẲNG ĐỨNG', loop: `KHUNG ${s.N} VÒNG · R = ${(s.R * 100).toFixed(0)} cm`, sol: `ỐNG DÂY ${s.N} VÒNG · ℓ = 40 cm` }[s.src], sub: `I = ${s.I.toFixed(1).replace('.', ',').replace('-', '−')} A (mũi tên xanh lá)`, color: GR, dy: -34, dx: 80, a: 1});
  if (s.hand && Math.abs(s.I) > 0.05) at('hand', rig.pts.hand, {text: 'BÀN TAY PHẢI', sub: s.src === 'wire' ? 'ngón cái: chiều dòng điện · 4 ngón: chiều B' : 'bốn ngón: chiều dòng điện · ngón cái: chiều B', color: '#b06a2a', dy: -36, dx: 90, a: 1});
  at('probe', rig.pts.probe, {text: 'KIM THỬ', sub: `B = ${fmtB(r.bm)}`, color: OR, dy: -42, dx: 70, a: 1});
  at('north', rig.pts.north, {text: 'HƯỚNG BẮC', sub: s.earth ? 'từ trường Trái Đất 40 µT (đang bật)' : 'từ trường Trái Đất: bỏ qua', color: GR, dy: -20, dx: 60, a: 1});
  at('sheet', rig.pts.sheet, {text: 'TẤM BÌA TRONG SUỐT', sub: 'đặt trên 4 trụ, ngang tâm dòng điện', color: INK, part: true, dy: 30, dx: 20, a: part});
  at('leg', rig.pts.leg, {text: 'TRỤ ĐỠ', sub: 'giữ tấm bìa và kim', color: INK, part: true, dy: 40, dx: 40, a: part});
  at('supply', rig.pts.supply, {text: 'NGUỒN ĐIỆN', sub: 'một chiều, nối bằng 2 dây', color: INK, part: true, dy: -30, dx: 50, a: part});
  at('lead', rig.pts.lead, {text: 'DÂY NỐI', sub: 'mô hình bỏ qua từ trường của dây nối', color: INK, part: true, dy: 30, dx: 0, a: part});
  return items;
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'mode') setMode(a); else if (kind === 'cmd') cmd(a, b); }
    ui.setView('');
  }
  const [px, pz] = probePos(model); if (Math.abs(probe.x - px) + Math.abs(probe.z - pz) > 1e-9) { probe.x = px; probe.z = pz; model.dirty = true; }
  advance(model, dt, all);
  const ck = `${model.src}|${model.I}|${model.N}|${model.R}`; if (ck !== curveKey) { curve = curveFor(model); curveKey = ck; }
  const r = readout(model, probe);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, comps, probe);
  const v = VIEWFN[viewName](r, model).slice(), k = 1 - Math.exp(-dt / 0.3); if (model.src !== 'wire' && (viewName === 'hero' || viewName === 'near')) v[0] += 42;
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: clamp(cam.el, -5, 89.5) * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model, curve); ui.syncSliders(model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.B2.shown) window.B2.shown = true;
  requestAnimationFrame(frame);
}
window.B2 = {st, rig, model, comps, probe, readout: () => readout(model, probe), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.src) setSrc(o.src); if (o.mode) setMode(o.mode); if (o.set) { for (const [k2, v2] of Object.entries(o.set)) { if (k2 === 'earth' || k2 === 'hand') { model[k2] = v2; touch(); } else cmd(k2, v2); } } }};
addEventListener('error', (e) => window.B2.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B2.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.clear) model.rows = []; if (o.src && o.src !== model.src) setSrc(o.src); if (o.earth !== undefined) model.earth = o.earth; if (o.hand !== undefined) model.hand = o.hand; for (const k2 of ['I', 'N', 'R', 'r', 'alpha']) if (o[k2] !== undefined) cmd(k2, o[k2]); if (o.mode) model.mode = o.mode; touch(); ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model, probe), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B2.lesson = lesson;
applyPreset(0); ui.setView('hero'); ui.setPreset(-1); void TABLE; void RD; void BL; void srcHoriz;
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B2.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

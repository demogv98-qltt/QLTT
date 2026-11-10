// VL12-B1 live page: bar magnet, compasses, iron filings, field lines. One state drives the spring, the arrows, the table, the graph and every number.
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
import {advance, createModel, magnetHoriz, newCompass, PRESETS, probePos, RANGE, readout, record} from './physics.js';
import {createRig, GRID, TABLE} from './rig.js';
import {createUI, CSS} from './ui.js';
import {makeLesson} from './bai_hoc.js';

document.title = 'VL12-B1 · Từ trường và đường sức từ (Teardown)';
const W = 1600, H = 900, IDLE = 25, D2R = Math.PI / 180;
const TL = '#0b8f8c', OR = '#e8590c', INK = '#14303c', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
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
let lastInput = 0, viewName = 'hero', lessonH = 0, shift = 0, off = {az: 0, el: 0, k: 1}, curve = null, curveBr = -1;
const cam = {az: 0, el: 55, d: 3.4, tx: 0, ty: 0.46, tz: 0};
const VIEWFN = {hero: () => [0, 52, 4.1, 0, 0.46, 0.06], top: () => [0, 89, 3.4, 0, 0.46, 0], near: () => [0, 48, 1.55, 0, 0.47, 0.02], side: () => [58, 24, 3.0, 0, 0.5, 0]};
const DURATION = 64;
const EVENTS = [[0.02, 'td', false], [0.02, 'preset', 1], [0.02, 'view', 'hero'], [0.05, 'mode', 'compass'], [6, 'toggle', 'magnet'], [10, 'toggle', 'magnet'], [14, 'mode', 'filings'], [20, 'mode', 'lines'], [24, 'view', 'near'], [28, 'flip'], [31, 'view', 'hero'], [32, 'mode', 'compass'], [33, 'cmd', 'r', 0.34], [40, 'cmd', 'r', 0.2], [45, 'td', true], [45.1, 'view', 'side'], [53, 'td', false], [53.1, 'view', 'top'], [58, 'view', 'hero']];
const touch = () => { model.dirty = true; model.fdirty = true; };
function cmd(k, v) { model[k] = clamp(v, RANGE[k][0], RANGE[k][1]); if (k === 'phi') model.phi = ((v % 360) + 360) % 360; touch(); }
function curveFor(Br) { const mk = (alpha) => { const o = [], s2 = {...model, Br, phi: 0, magnet: true}; for (let i = 0; i <= 60; i++) { const r = 0.08 * Math.pow(0.6 / 0.08, i / 60), a = alpha * D2R; o.push([r, Math.hypot(...magnetHoriz(s2, r * Math.cos(a), -r * Math.sin(a)))]); } return o; }; return {axis: mk(0), equ: mk(90)}; }
function setMode(m) { model.mode = m; touch(); if (m !== 'compass' && viewName === 'hero') viewName = 'near'; }
function toggle(k) { model[k] = !model[k]; touch(); }
function applyPreset(i) { const p = PRESETS[i]; model.magnet = p.magnet; model.earth = p.earth; model.phi = p.phi; model.Br = p.Br; model.rows = []; touch(); ui.setPreset(i); }
const ui = createUI(app, {
  cmd(k, v) { userInput(); cmd(k, v); ui.setPreset(-1); }, mode(m) { userInput(); setMode(m); }, toggle(k) { userInput(); toggle(k); ui.setPreset(-1); }, flip() { userInput(); cmd('phi', model.phi + 180); },
  record() { userInput(); if (model.magnet) record(model); }, clear() { userInput(); model.rows = []; }, preset(i) { userInput(); applyPreset(i); }, speed(v) { model.speed = v; },
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
function labelItems(r, s, td) {
  const items = [], part = clamp((td - 0.8) / 0.2, 0, 1), at = (id, p, o) => { const q = proj(p); items.push({id, x: q.x, y: q.y, visible: q.visible, ...o}); };
  if (s.magnet) { at('N', rig.pts.N, {text: 'CỰC N', sub: 'đường sức đi ra', color: RD, dy: -34, dx: 30, a: 1}); at('S', rig.pts.S, {text: 'CỰC S', sub: 'đường sức đi vào', color: BL, dy: -34, dx: -30, a: 1}); }
  at('probe', rig.pts.probe, {text: 'KIM THỬ', sub: r.bm > 0 ? `B = ${(r.bm * 1e6).toFixed(1).replace('.', ',')} µT` : 'chỉ có Trái Đất', color: OR, dy: -40, dx: 60, a: 1});
  at('north', rig.pts.north, {text: 'HƯỚNG BẮC', sub: 'từ trường Trái Đất ≈ 40 µT (nằm ngang)', color: GR, dy: -20, dx: 0, a: 1});
  at('sheet', rig.pts.sheet, {text: 'TẤM BÌA TRONG SUỐT', sub: 'đặt trên 4 trụ, ngay trên nam châm', color: INK, part: true, dy: 30, dx: 20, a: part});
  at('leg', rig.pts.leg, {text: 'TRỤ ĐỠ', sub: 'giữ tấm bìa và kim', color: INK, part: true, dy: 40, dx: 40, a: part});
  at('rings', rig.pts.rings, {text: 'VÒNG DÂY TƯƠNG ĐƯƠNG', sub: 'mô hình: K = Br/μ₀', color: '#a86f00', part: true, dy: 70, dx: 70, a: part});
  return items;
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; T += dt;
  if (!tour.run && tour.enabled && T - lastInput > IDLE) startTour();
  if (tour.run) {
    const c = (T - tour.t0) % DURATION; if (c < tour.last) tour.ev = 0; tour.last = c;
    while (tour.ev < EVENTS.length && EVENTS[tour.ev][0] <= c) { const [, kind, a, b] = EVENTS[tour.ev++]; if (kind === 'td') setTd(a); else if (kind === 'preset') applyPreset(a); else if (kind === 'view') setView(a); else if (kind === 'mode') setMode(a); else if (kind === 'toggle') toggle(a); else if (kind === 'flip') cmd('phi', model.phi + 180); else if (kind === 'cmd') cmd(a, b); }
    ui.setView('');
  }
  const [px, pz] = probePos(model); if (Math.abs(probe.x - px) + Math.abs(probe.z - pz) > 1e-9) { probe.x = px; probe.z = pz; model.dirty = true; }
  advance(model, dt, all);
  if (curveBr !== model.Br) { curve = curveFor(model.Br); curveBr = model.Br; }
  const r = readout(model, probe);
  const td = tdS.from + ((tdS.on ? 1 : 0) - tdS.from) * ease((T - tdS.t0) / 1.8); tdS.v = td;
  rig.update(r, model, td, comps, probe);
  const v = VIEWFN[viewName](r, model), k = 1 - Math.exp(-dt / 0.3);
  cam.az += (v[0] + off.az - cam.az) * k; cam.el += (v[1] + off.el - cam.el) * k; cam.d += (v[2] * off.k - cam.d) * k; cam.tx += (v[3] - cam.tx) * k; cam.ty += (v[4] - cam.ty) * k; cam.tz += (v[5] - cam.tz) * k;
  st.setCenter(cam.tx); st.frame({az: cam.az * D2R, el: clamp(cam.el, -5, 89.5) * D2R, d: cam.d, tx: cam.tx, ty: cam.ty, tz: cam.tz});
  lesson.tick(); shift += ((lessonH * 0.45) - shift) * 0.15; st.setShift(shift);
  ui.update(r, model, curve); ui.syncSliders(model);
  ui.setTeardown(tdS.on, td); ui.setTour(tour.run ? 'run' : tour.enabled ? 'wait' : 'off'); ui.labels(labelItems(r, model, td));
  if (!window.B1.shown) window.B1.shown = true;
  requestAnimationFrame(frame);
}
window.B1 = {st, rig, model, comps, probe, readout: () => readout(model, probe), cam, tdS, tour, errors: [], shown: false, ready: false, get tier() { return tier; }, applyPreset, setTd,
  pose(o) { if (o.td !== undefined) { tdS.on = o.td > 0.5; tdS.from = tdS.v = o.td; tdS.t0 = T - 99; } if (o.view) { tour.enabled = false; tour.run = false; setView(o.view); } if (o.preset !== undefined) applyPreset(o.preset); if (o.mode) setMode(o.mode); if (o.set) { for (const [k2, v2] of Object.entries(o.set)) { if (k2 === 'magnet' || k2 === 'earth' || k2 === 'lines3d') { model[k2] = v2; touch(); } else cmd(k2, v2); } } }};
addEventListener('error', (e) => window.B1.errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => window.B1.errors.push('promise: ' + e.reason));
const lesson = createLesson(ui.root, makeLesson({
  set(o) { if (o.clear) model.rows = []; for (const k2 of ['magnet', 'earth']) if (o[k2] !== undefined) model[k2] = o[k2]; for (const k2 of ['Br', 'phi', 'r', 'alpha']) if (o[k2] !== undefined) cmd(k2, o[k2]); if (o.mode) model.mode = o.mode; touch(); ui.setPreset(-1); },
}), {ctx: () => ({s: model, r: readout(model, probe), td: tdS.v}), onSize: (px) => { lessonH = px; ui.setBottom(870 - px - 12); }});
window.B1.lesson = lesson;
applyPreset(1); ui.setView('hero'); ui.setPreset(-1); void TABLE; void TL; void GR;
document.fonts.ready.then(() => warmUp(st.renderer, st.camera, [{scene: st.scene, target: null}])).catch(() => {}).then(() => { window.B1.ready = true; requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); }); });

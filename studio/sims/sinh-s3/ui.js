// S3 overlay: calm layout. Left: key numbers, cycle timeline and ONE graph at a time (tabs). Right: few controls.
// Labels sit in two tidy columns with straight leader lines (textbook style). The double circulation is a flat diagram, not 3D clutter.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {EDV, ESV, F_ATR, F_VEN, HR_RANGE, PRESETS, readout} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b', BL = '#2b59c3';
export const CSS = BASE + `canvas.gr{width:100%;height:226px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:5px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.tl{display:flex;height:26px;border-radius:4px;overflow:hidden;margin:2px 0 8px;font:700 11.5px 'JetBrains Mono',monospace;color:#fff}.tl div{display:flex;align-items:center;justify-content:center;white-space:nowrap}.tl .cur{outline:3px solid #14303c;outline-offset:-3px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.tabs{display:flex;gap:4px;margin:2px 0 5px}.tabs button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:6px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer}.tabs button.on{background:#14303c;color:#fff;border-color:#14303c}#circ{position:absolute;left:412px;top:84px;width:776px;height:560px;background:#fff;border:1px solid #b6c6d0;border-radius:10px;box-shadow:0 10px 30px rgba(30,60,80,.2);display:none;pointer-events:none}#circ canvas{width:100%;height:100%;display:block}.lab{width:188px;white-space:normal}.lab small{white-space:normal}.pr{display:flex;gap:5px;margin-bottom:8px}.pr button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:6px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.3}.pr button.on{background:#e8590c;border-color:#e8590c;color:#fff}.pr small{display:block;font:600 10.5px 'JetBrains Mono',monospace;opacity:.85}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
const LAB_MODES = ['Chú thích: ĐẦY ĐỦ', 'Chú thích: CHỈ NGĂN TIM', 'Chú thích: TẮT'];

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>TIM VÀ VÒNG TUẦN HOÀN</h1><p>CẤU TẠO TIM · CHU KÌ TIM · KHTN 8 · SINH HỌC CƠ THỂ NGƯỜI</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU CỦA TIM</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${RD}">${row('Nhịp', 'hr', RD)}${row('Chu kì', 'T', INK)}${row('Pha', 'ph', OR)}${row('V thất', 'vol', BL)}${row('H.áp', 'bp', PU)}${row('Q tim', 'co', TL)}</div>
    <div style="font:700 11px 'JetBrains Mono',monospace;color:#5b7080;margin:2px 0 1px">MỘT CHU KÌ TIM (<span id="tlT"></span> s)</div><div class="tl" id="tl"></div>
    <div class="tabs" id="tabs"><button data-g="ecg">Điện tim</button><button data-g="vol">Thể tích thất</button><button data-g="bp">Huyết áp</button></div>
    <canvas class="gr" id="g1" width="680" height="450"></canvas></div>`));
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="sl" style="--c:${RD}"><div class="top"><div>Nhịp tim <span>${HR_RANGE[0]}…${HR_RANGE[1]}</span></div><b id="sv-hr"></b></div><input id="s-hr" type="range" min="${HR_RANGE[0]}" max="${HR_RANGE[1]}" step="1"></div>
    <div class="pr" id="pre">${PRESETS.map((p, i) => `<button data-i="${i}">${p.short}<small>${p.hr}/phút</small></button>`).join('')}</div>
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-pause" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">❚❚ Dừng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div style="font:700 12px Inter;margin-bottom:4px">Dừng ở pha:</div><div class="sw" id="phb"><button data-p="atrial">Nhĩ co</button><button data-p="ventricular">Thất co</button><button data-p="diastole">Dãn chung</button></div>
    <div class="sw"><button id="b-sound">🔊 Tiếng tim</button><button id="b-flow">Dòng máu</button></div>
    <div class="sw"><button id="b-lab" style="font-size:11.5px"></button></div>
    <button class="btn big" id="b-td" style="margin-top:2px">MẶT CẮT · XEM BÊN TRONG<small>[T] 4 ngăn · van tim · vách ngăn</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>NGUYÊN KHỐI</button><button data-v="cut">2<br>BÊN TRONG</button><button data-v="circuit">3<br>SƠ ĐỒ VÒNG</button><button data-v="side">4<br>NHÌN NGHIÊNG</button></div></div>`));
  const circ = el('<div id="circ"><canvas width="1552" height="1120"></canvas></div>'); root.appendChild(circ);
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  let graph = 'ecg';
  $('s-hr').addEventListener('input', (e) => hooks.hr(Number(e.target.value)));
  $('b-pause').addEventListener('click', () => hooks.pause()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  root.querySelectorAll('#phb button').forEach((b) => b.addEventListener('click', () => hooks.phase(b.dataset.p)));
  $('b-sound').addEventListener('click', () => hooks.sound()); $('b-flow').addEventListener('click', () => hooks.flow()); $('b-lab').addEventListener('click', () => hooks.labels());
  root.querySelectorAll('#pre button').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  root.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => { graph = b.dataset.g; }));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const COLS = {atrial: '#e8590c', ventricular: '#c0392b', diastole: '#0b8f8c'};
  // ------------------------------------------------------------------ one graph over a cycle
  function drawGraph(r, s) {
    const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height, m = {l: 74, r: 16, t: 58, b: 28}; g.clearRect(0, 0, w, h);
    const N = 160, ts = Array.from({length: N + 1}, (_, i) => readout({...s, phi: i / N, paused: false}));
    const cfg = {ecg: {key: 'ecg', y0: -0.5, y1: 1.2, title: 'ĐIỆN TIM (ECG)', unit: 'mV', col: RD}, vol: {key: 'vol', y0: 40, y1: 130, title: 'THỂ TÍCH THẤT TRÁI', unit: 'mL', col: BL}, bp: {key: 'pao', y0: 0, y1: 140, title: 'HUYẾT ÁP', unit: 'mmHg', col: PU}}[graph];
    const X = (fr) => m.l + fr * (w - m.l - m.r), Y = (y) => h - m.b - ((y - cfg.y0) / (cfg.y1 - cfg.y0)) * (h - m.t - m.b);
    for (const [a, b, col, name] of [[0, F_ATR, 'rgba(232,89,12,.14)', 'nhĩ co'], [F_ATR, F_ATR + F_VEN, 'rgba(192,57,43,.14)', 'thất co'], [F_ATR + F_VEN, 1, 'rgba(11,143,140,.11)', 'dãn chung']]) { g.fillStyle = col; g.fillRect(X(a), m.t, X(b) - X(a), h - m.t - m.b); g.fillStyle = '#5b7080'; g.font = '15px monospace'; g.textAlign = 'center'; g.fillText(name, (X(a) + X(b)) / 2, m.t - 8); }
    g.strokeStyle = '#e2eaef'; g.lineWidth = 1.5; g.fillStyle = INK; g.font = '16px monospace'; g.textAlign = 'right';
    for (let i = 0; i <= 4; i++) { const y = cfg.y0 + ((cfg.y1 - cfg.y0) * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(1), Y(y)); g.stroke(); g.fillText(f(y, graph === 'ecg' ? 1 : 0), m.l - 8, Y(y) + 6); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(cfg.y0)); g.lineTo(X(1), Y(cfg.y0)); g.moveTo(X(0), Y(cfg.y0)); g.lineTo(X(0), Y(cfg.y1)); g.stroke();
    g.fillStyle = INK; g.font = '700 19px monospace'; g.textAlign = 'left'; g.fillText(cfg.title + ' (' + cfg.unit + ')', m.l, 22);
    const path = (k, upTo) => { g.beginPath(); let first = true; ts.forEach((q, i) => { if (i / N > upTo + 1e-9) return; first ? g.moveTo(X(i / N), Y(q[k])) : g.lineTo(X(i / N), Y(q[k])); first = false; }); g.stroke(); };
    g.lineJoin = 'round'; g.strokeStyle = cfg.col + '55'; g.lineWidth = 3; path(cfg.key, 1); g.strokeStyle = cfg.col; g.lineWidth = 6; path(cfg.key, r.f);
    if (graph === 'bp') { g.strokeStyle = OR + '77'; g.lineWidth = 3; path('plv', 1); g.strokeStyle = OR; g.lineWidth = 5; path('plv', r.f); g.font = '700 16px monospace'; g.fillStyle = PU; g.fillText('động mạch chủ', X(0.55), Y(106)); g.fillStyle = OR; g.fillText('thất trái', X(0.57), Y(40)); }
    if (graph === 'vol') { g.fillStyle = INK; g.font = '15px monospace'; g.textAlign = 'right'; g.fillText(EDV + ' mL (đầy)', w - 22, Y(EDV) - 6); g.fillText(ESV + ' mL (sau khi co)', w - 22, Y(ESV) - 8); }
    if (graph === 'ecg') { g.fillStyle = INK; g.font = '15px monospace'; g.textAlign = 'center'; g.fillText('P', X(0.04), Y(0.42)); g.fillText('QRS', X(0.14), Y(1.1)); g.fillText('T', X(0.40), Y(0.6)); }
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(X(r.f), m.t); g.lineTo(X(r.f), h - m.b); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(X(r.f), Y(r[cfg.key] ?? ts[0][cfg.key]), 8, 0, 7); g.fill();
  }
  // ------------------------------------------------------------------ flat diagram of the double circulation
  const DP = [[340, 360], [285, 360], [190, 360], [190, 112], [250, 112], [520, 112], [580, 112], [580, 255], [440, 255], [440, 360], [490, 385], [640, 385], [640, 478], [600, 478], [170, 478], [250, 478], [250, 255], [340, 255], [340, 360]];
  const segLen = DP.slice(1).map((p, i) => Math.hypot(p[0] - DP[i][0], p[1] - DP[i][1])), tot = segLen.reduce((a, b) => a + b, 0);
  const at = (u) => { let d = ((u % 1) + 1) % 1 * tot, i = 0; while (d > segLen[i]) { d -= segLen[i]; i++; } const a = DP[i], b = DP[i + 1], t = d / segLen[i]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, i + t]; };
  const mix = (t) => { const k = Math.min(1, Math.max(0, t)), a = [43, 89, 195], b = [214, 40, 57]; return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * k)).join(',')})`; };
  // oxygen level along the loop: low (blue) from the body bed to the lung bed, high (red) from the lung bed to the body bed
  const o2 = (pi) => (pi < 4 ? 0 : pi < 5 ? pi - 4 : pi < 12.2 ? 1 : pi < 13.8 ? 1 - (pi - 12.2) / 1.6 : 0);
  let acc = 0, lastT = performance.now();
  function drawCircuit(r, s) {
    const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (!s.paused && s.flow === 'on') acc += dt * (0.05 + 0.1 * (r.ph.id === 'ventricular' ? Math.sin(Math.PI * r.ph.k) : 0.15)) * (r.hr / 75) * s.speed;
    const c = circ.querySelector('canvas'), g = c.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 776, 560); g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = INK; g.font = '800 19px Inter,sans-serif'; g.textAlign = 'left'; g.fillText('SƠ ĐỒ HAI VÒNG TUẦN HOÀN', 24, 34); g.font = '600 13px Inter,sans-serif'; g.fillStyle = '#5b7080'; g.fillText('Máu luôn chảy một chiều: tim → động mạch → mao mạch → tĩnh mạch → tim', 24, 54);
    const box = (x, y, w, h, fill, stroke, title, sub) => { g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill(); g.stroke(); g.fillStyle = INK; g.textAlign = 'center'; g.font = '800 15px Inter'; g.fillText(title, x + w / 2, y + 24); g.font = '600 12px Inter'; g.fillStyle = '#6a4a4a'; g.fillText(sub, x + w / 2, y + h - 10); };
    box(230, 70, 300, 84, '#fbe3e6', '#e6a3ad', 'PHỔI', 'mao mạch phổi: máu nhận O₂, thải CO₂'); box(150, 440, 470, 74, '#f6e6d6', '#d9b690', 'CƠ THỂ (các cơ quan)', 'mao mạch: máu thải O₂, nhận CO₂ và chất dinh dưỡng');
    // vessels
    g.lineWidth = 12; for (let i = 0; i < DP.length - 1; i++) { const m = i + 0.5, k = o2(m); g.strokeStyle = mix(k); g.globalAlpha = 0.32; g.beginPath(); g.moveTo(...DP[i]); g.lineTo(...DP[i + 1]); g.stroke(); g.globalAlpha = 1; }
    // heart with beating chambers (right side of the person on the left of the picture)
    const kv = (r.vol - 50) / 70, ks = 0.9 + 0.1 * kv, ka = 0.92 + 0.08 * r.atr;
    const chLabels = [];
    const ch = (cx, cy, w, h, sc, fill, stroke, label) => { const W = w * sc, H = h * sc; g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 3; g.beginPath(); g.roundRect(cx - W / 2, cy - H / 2, W, H, 14); g.fill(); g.stroke(); chLabels.push([cx, cy, label]); };
    ch(340, 255, 92, 78, ka, '#c9d6f4', BL, ['TÂM NHĨ', 'PHẢI']); ch(440, 255, 92, 78, ka, '#f6c7cb', RD, ['TÂM NHĨ', 'TRÁI']); ch(340, 360, 92, 108, ks, '#c9d6f4', BL, ['TÂM THẤT', 'PHẢI']); ch(440, 360, 92, 108, ks, '#f6c7cb', RD, ['TÂM THẤT', 'TRÁI']);
    g.fillStyle = '#fff'; g.fillRect(385, 205, 6, 200);
    // valves as small marks that open and close
    const vm = (x, y, open, label) => { g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); if (open) { g.moveTo(x - 12, y - 8); g.lineTo(x - 12, y + 8); g.moveTo(x + 12, y - 8); g.lineTo(x + 12, y + 8); } else { g.moveTo(x - 13, y); g.lineTo(x + 13, y); } g.stroke(); g.fillStyle = '#3d5563'; g.font = '600 10.5px Inter'; g.textAlign = 'center'; g.fillText(label, x, y + 20); };
    vm(340, 306, r.avOpen, ''); vm(440, 306, r.avOpen, ''); vm(332, 412, r.slOpen, ''); vm(448, 412, r.slOpen, '');
    // blood dots first, then the names with a white halo so that they stay readable
    for (let i = 0; i < 90; i++) { const [x, y, pi] = at(i / 90 + acc); g.fillStyle = mix(o2(pi)); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.stroke(); }
    g.textAlign = 'center'; g.lineJoin = 'round'; for (const [cx, cy, lb] of chLabels) { for (const [t, dy, fnt] of [[lb[0], -3, '800 13px Inter'], [lb[1], 12, '700 12px Inter']]) { g.font = fnt; g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeText(t, cx, cy + dy); g.fillStyle = INK; g.fillText(t, cx, cy + dy); } }
    // names
    g.font = '800 12.5px Inter'; g.textAlign = 'left'; g.fillStyle = BL; g.fillText('Động mạch phổi', 44, 240); g.fillText('(máu đỏ sẫm)', 44, 256); g.fillStyle = RD; g.fillText('Tĩnh mạch phổi', 592, 200); g.fillText('(máu đỏ tươi)', 592, 216); g.fillText('Động mạch chủ', 650, 420); g.fillText('(máu đỏ tươi)', 650, 436);
    g.fillStyle = BL; g.fillText('Tĩnh mạch chủ', 40, 395); g.fillText('(máu đỏ sẫm) →', 40, 411);
    g.fillStyle = BL; g.font = '800 14px Inter'; g.fillText('VÒNG TUẦN HOÀN NHỎ', 24, 100); g.font = '600 12px Inter'; g.fillStyle = '#5b7080'; g.fillText('thất phải → phổi → nhĩ trái', 24, 117); g.fillStyle = RD; g.font = '800 14px Inter'; g.fillText('VÒNG TUẦN HOÀN LỚN', 24, 452); g.font = '600 12px Inter'; g.fillStyle = '#5b7080'; g.fillText('thất trái → cơ thể → nhĩ phải', 24, 469);
    g.fillStyle = mix(1); g.beginPath(); g.arc(560, 36, 7, 0, 7); g.fill(); g.fillStyle = INK; g.font = '600 12.5px Inter'; g.fillText('giàu O₂ (đỏ tươi)', 574, 41); g.fillStyle = mix(0); g.beginPath(); g.arc(560, 58, 7, 0, 7); g.fill(); g.fillStyle = INK; g.fillText('nghèo O₂ (đỏ sẫm)', 574, 63);
    g.fillStyle = '#5b7080'; g.font = '600 12.5px Inter'; g.textAlign = 'center'; g.fillText(`Pha hiện tại: ${r.ph.vi} · nhịp ${s.hr}/phút · dấu ║ ở giữa tim = van tim (hở: mở, gạch ngang: đóng)`, 388, 545);
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('#pre button').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · NGUYÊN KHỐI' : 'MẶT CẮT · XEM BÊN TRONG'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'MẶT CẮT · BÊN TRONG' : 'NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s, view) {
      const e = $('s-hr'); if (document.activeElement !== e) e.value = s.hr; $('sv-hr').textContent = s.hr + ' /phút';
      $('b-pause').textContent = s.paused ? '▶ Chạy tiếp' : '❚❚ Dừng'; $('b-sound').classList.toggle('on', s.sound); $('b-flow').classList.toggle('on', s.flow === 'on'); $('b-lab').textContent = LAB_MODES[s.labMode];
      root.querySelectorAll('#phb button').forEach((b) => b.classList.toggle('on', s.paused && b.dataset.p === r.ph.id)); root.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.g === graph));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('hr', `${s.hr}<small>lần/phút</small>`, s.hr / 180); set('T', `${f(r.T, 2)}<small>s</small>`, r.T / 1.5); set('ph', `<span style="font-size:13px">${r.ph.vi}</span>`, r.f, COLS[r.ph.id]); set('vol', `${f(r.vol, 0)}<small>mL</small>`, r.vol / EDV); set('bp', `${f(r.pao, 0)}<small>mmHg</small>`, r.pao / 130); set('co', `${f(r.co, 2)}<small>L/phút</small>`, r.co / 12);
      $('tlT').textContent = f(r.T, 2);
      $('tl').innerHTML = [['Nhĩ co', r.tAtr, F_ATR, '#e8590c', 'atrial'], ['Thất co', r.tVen, F_VEN, '#c0392b', 'ventricular'], ['Dãn chung', r.tDia, 1 - F_ATR - F_VEN, '#0b8f8c', 'diastole']].map(([n, t, fr, c, id]) => `<div style="flex:${fr};background:${c}" class="${r.ph.id === id ? 'cur' : ''}">${n} ${f(t, 2)} s</div>`).join('');
      drawGraph(r, s); const on = view === 'circuit'; if (circ.style.display !== (on ? 'block' : 'none')) circ.style.display = on ? 'block' : 'none'; if (on) drawCircuit(r, s);
    },
    // labels: two straight columns left and right of the heart, ordered by height, with a leader line and a dot on the structure
    labels(items, view) {
      const seen = new Set(), act = [], hide = view === 'circuit';
      for (const it of items) {
        seen.add(it.id); let o = labs[it.id];
        if (!o) { const d = el('<div class="lab"></div>'), ln = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'), dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); ln.setAttribute('fill', 'none'); ln.setAttribute('stroke-width', '1.6'); dot.setAttribute('r', '4.5'); labels.appendChild(d); leaders.appendChild(ln); leaders.appendChild(dot); o = labs[it.id] = {d, ln, dot, txt: ''}; }
        const show = !hide && it.a > 0.02 && it.visible !== false && it.x > 395 && it.x < 1205 && it.y > 90 && it.y < B.bottom;
        o.d.style.display = o.ln.style.display = o.dot.style.display = show ? '' : 'none'; if (!show) continue;
        const html = it.sub ? `${it.text}<small>${it.sub}</small>` : it.text; if (o.txt !== html) { o.d.innerHTML = html; o.txt = html; }
        o.d.className = 'lab' + (it.part ? ' part' : ''); o.d.style.setProperty('--c', it.color); o.d.style.opacity = it.a; o.d.style.font = "700 13.5px 'JetBrains Mono',monospace";
        act.push({it, o, left: it.x < 800 + (it.bias || 0), h: it.sub ? 46 : 30});
      }
      for (const side of [true, false]) {
        const col = act.filter((a) => a.left === side).sort((a, b) => a.it.y - b.it.y); let y = B.top + 30;
        for (const a of col) { a.y = Math.max(a.it.y, y); y = a.y + a.h + 10; }
        const over = (col.length ? col[col.length - 1].y + col[col.length - 1].h / 2 : 0) - (B.bottom - 6); if (over > 0) for (const a of col) a.y -= over;
        for (const a of col) { a.x = side ? 508 : 1098; a.o.d.style.left = a.x + 'px'; a.o.d.style.top = a.y + 'px'; const ex = side ? a.x + 94 : a.x - 94; a.o.ln.setAttribute('points', `${ex},${a.y} ${ex + (side ? 18 : -18)},${a.y} ${a.it.x},${a.it.y}`); a.o.ln.setAttribute('stroke', a.it.color); a.o.ln.style.opacity = a.it.a; a.o.dot.setAttribute('cx', a.it.x); a.o.dot.setAttribute('cy', a.it.y); a.o.dot.setAttribute('fill', a.it.color); a.o.dot.style.opacity = a.it.a; }
      }
      for (const id of Object.keys(labs)) if (!seen.has(id)) { const o = labs[id]; o.d.style.display = o.ln.style.display = o.dot.style.display = 'none'; }
    },
  };
}

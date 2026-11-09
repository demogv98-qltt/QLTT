// S3 overlay: telemetry, the cycle timeline, and three aligned graphs over one cardiac cycle (ECG, left-ventricular volume, pressures).
import {CSS as BASE} from '../vl10-m5/ui.js';
import {EDV, ESV, F_ATR, F_VEN, HR_RANGE, PRESETS, readout} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b', BL = '#2b59c3';
export const CSS = BASE + `canvas.gr{width:100%;height:118px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:5px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.tl{display:flex;height:26px;border-radius:4px;overflow:hidden;margin:2px 0 4px;font:700 11.5px 'JetBrains Mono',monospace;color:#fff}.tl div{display:flex;align-items:center;justify-content:center;white-space:nowrap}.tl .cur{outline:3px solid #14303c;outline-offset:-3px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>S3 · TIM VÀ VÒNG TUẦN HOÀN</h1><p>CẤU TẠO TIM · CHU KÌ TIM · MÁU ĐỎ TƯƠI VÀ ĐỎ SẪM · KHTN 8</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU CỦA TIM</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${RD}">${row('Nhịp', 'hr', RD)}${row('Chu kì', 'T', INK)}${row('Pha', 'ph', OR)}${row('V thất', 'vol', BL)}${row('H.áp', 'bp', PU)}${row('Q tim', 'co', TL)}</div>
    <div style="font:700 11px 'JetBrains Mono',monospace;color:#5b7080;margin:2px 0 1px">MỘT CHU KÌ TIM (<span id="tlT"></span> s)</div><div class="tl" id="tl"></div>
    <canvas class="gr" id="g1" width="680" height="236"></canvas><canvas class="gr" id="g2" width="680" height="236"></canvas><canvas class="gr" id="g3" width="680" height="236"></canvas></div>`));
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="sl" style="--c:${RD}"><div class="top"><div>Nhịp tim <span>${HR_RANGE[0]}…${HR_RANGE[1]} lần/phút</span></div><b id="sv-hr"></b></div><input id="s-hr" type="range" min="${HR_RANGE[0]}" max="${HR_RANGE[1]}" step="1"></div>
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-pause" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">❚❚ Dừng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div style="font:700 12px Inter;margin-bottom:4px">Dừng ở pha:</div><div class="sw" id="phb"><button data-p="atrial">Nhĩ co</button><button data-p="ventricular">Thất co</button><button data-p="diastole">Dãn chung</button></div>
    <div class="sw"><button id="b-sound">🔊 Tiếng tim</button><button id="b-flow">🩸 Dòng máu</button></div>
    <div class="ptitle" style="margin-top:2px"><span>TÌNH HUỐNG</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">MẶT CẮT · XEM BÊN TRONG<small>[T] 4 ngăn tim · van tim · vách ngăn</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="cut">2<br>BÊN TRONG</button><button data-v="vessels">3<br>VÒNG TUẦN HOÀN</button><button data-v="side">4<br>NHÌN NGHIÊNG</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  $('s-hr').addEventListener('input', (e) => hooks.hr(Number(e.target.value)));
  $('b-pause').addEventListener('click', () => hooks.pause()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  root.querySelectorAll('#phb button').forEach((b) => b.addEventListener('click', () => hooks.phase(b.dataset.p)));
  $('b-sound').addEventListener('click', () => hooks.sound()); $('b-flow').addEventListener('click', () => hooks.flow());
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const COLS = {atrial: '#e8590c', ventricular: '#c0392b', diastole: '#0b8f8c'};
  function frame(g, w, h, m, y0, y1, title, yl) {
    g.clearRect(0, 0, w, h); const X = (f) => m.l + f * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    for (const [a, b, c] of [[0, F_ATR, 'rgba(232,89,12,.13)'], [F_ATR, F_ATR + F_VEN, 'rgba(192,57,43,.13)'], [F_ATR + F_VEN, 1, 'rgba(11,143,140,.11)']]) { g.fillStyle = c; g.fillRect(X(a), m.t, X(b) - X(a), h - m.t - m.b); }
    g.strokeStyle = '#e2eaef'; g.lineWidth = 1.4; for (let i = 0; i <= 4; i++) { const y = y0 + ((y1 - y0) * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(1), Y(y)); g.stroke(); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(X(0), Y(y0)); g.lineTo(X(1), Y(y0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.font = '700 16px monospace'; g.textAlign = 'left'; g.fillText(title, m.l + 6, 17); g.textAlign = 'right'; g.fillStyle = '#5b7080'; g.font = '14px monospace'; g.fillText(yl, m.l - 5, m.t + 10);
    return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'MẶT CẮT · XEM BÊN TRONG'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'MẶT CẮT · BÊN TRONG' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const e = $('s-hr'); if (document.activeElement !== e) e.value = s.hr; $('sv-hr').textContent = s.hr + ' /phút';
      $('b-pause').textContent = s.paused ? '▶ Chạy tiếp' : '❚❚ Dừng'; $('b-sound').classList.toggle('on', s.sound); $('b-flow').classList.toggle('on', s.flow === 'on');
      root.querySelectorAll('#phb button').forEach((b) => b.classList.toggle('on', s.paused && b.dataset.p === r.ph.id));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('hr', `${s.hr}<small>lần/phút</small>`, s.hr / 180); set('T', `${f(r.T, 2)}<small>s</small>`, r.T / 1.5); set('ph', `<span style="font-size:13px">${r.ph.vi}</span>`, r.f, COLS[r.ph.id]); set('vol', `${f(r.vol, 0)}<small>mL</small>`, r.vol / EDV); set('bp', `${f(r.pao, 0)}<small>mmHg</small>`, r.pao / 130); set('co', `${f(r.co, 2)}<small>L/phút</small>`, r.co / 12);
      $('tlT').textContent = f(r.T, 2);
      $('tl').innerHTML = [['Nhĩ co', r.tAtr, F_ATR, '#e8590c', 'atrial'], ['Thất co', r.tVen, F_VEN, '#c0392b', 'ventricular'], ['Dãn chung', r.tDia, 1 - F_ATR - F_VEN, '#0b8f8c', 'diastole']].map(([n, t, fr, c, id]) => `<div style="flex:${fr};background:${c}" class="${r.ph.id === id ? 'cur' : ''}">${n} ${f(t, 2)} s</div>`).join('');
      const N = 160, ts = Array.from({length: N + 1}, (_, i) => readout({...s, phi: i / N, paused: false}));
      // ECG
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height, A = frame(g, w, h, {l: 54, r: 10, t: 24, b: 12}, -0.5, 1.2, 'ĐIỆN TIM (ECG)', 'mV');
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2; g.beginPath(); ts.forEach((q, i) => (i ? g.lineTo(A.X(i / N), A.Y(q.ecg)) : g.moveTo(A.X(0), A.Y(q.ecg)))); g.stroke();
      g.strokeStyle = RD; g.lineWidth = 4; g.beginPath(); ts.forEach((q, i) => { if (i / N > r.f) return; i ? g.lineTo(A.X(i / N), A.Y(q.ecg)) : g.moveTo(A.X(0), A.Y(q.ecg)); }); g.stroke();
      const cur = (A) => { g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(A.X(r.f), 20); g.lineTo(A.X(r.f), h - 10); g.stroke(); };
      cur(A); g.font = '13px monospace'; g.fillStyle = INK; g.textAlign = 'center'; g.fillText('P', A.X(0.04), A.Y(0.4)); g.fillText('QRS', A.X(0.14), A.Y(1.12)); g.fillText('T', A.X(0.40), A.Y(0.6));
      // volume
      c = $('g2'); g = c.getContext('2d'); A = frame(g, w, h, {l: 54, r: 10, t: 24, b: 12}, 40, 130, 'THỂ TÍCH THẤT TRÁI (mL)', 'mL');
      g.strokeStyle = 'rgba(43,89,195,.35)'; g.lineWidth = 3; g.beginPath(); ts.forEach((q, i) => (i ? g.lineTo(A.X(i / N), A.Y(q.vol)) : g.moveTo(A.X(0), A.Y(q.vol)))); g.stroke();
      g.strokeStyle = BL; g.lineWidth = 5; g.beginPath(); ts.forEach((q, i) => { if (i / N > r.f) return; i ? g.lineTo(A.X(i / N), A.Y(q.vol)) : g.moveTo(A.X(0), A.Y(q.vol)); }); g.stroke(); cur(A);
      g.fillStyle = INK; g.font = '13px monospace'; g.textAlign = 'right'; g.fillText(EDV + ' mL (đầy)', w - 14, A.Y(EDV) - 4); g.fillText(ESV + ' mL (sau co)', w - 14, A.Y(ESV) - 6);
      // pressures
      c = $('g3'); g = c.getContext('2d'); A = frame(g, w, h, {l: 54, r: 10, t: 24, b: 12}, 0, 140, 'ÁP SUẤT (mmHg)', 'mmHg');
      for (const [k, col] of [['plv', OR], ['pao', PU]]) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); ts.forEach((q, i) => (i ? g.lineTo(A.X(i / N), A.Y(q[k])) : g.moveTo(A.X(0), A.Y(q[k])))); g.stroke(); }
      cur(A); g.font = '700 14px monospace'; g.textAlign = 'left'; g.fillStyle = OR; g.fillText('thất trái', A.X(0.56), A.Y(40)); g.fillStyle = PU; g.fillText('động mạch chủ', A.X(0.56), A.Y(100));
    },
    labels(items) {
      const seen = new Set(), act = [];
      for (const it of items) {
        seen.add(it.id); let o = labs[it.id];
        if (!o) { const d = el('<div class="lab"></div>'), ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('stroke-width', '1.5'); labels.appendChild(d); leaders.appendChild(ln); o = labs[it.id] = {d, ln, txt: ''}; }
        const show = it.a > 0.02 && it.visible !== false && it.x > 395 && it.x < 1205 && it.y > 80 && it.y < B.bottom + 14;
        o.d.style.display = o.ln.style.display = show ? '' : 'none'; if (!show) continue;
        const html = it.sub ? `${it.text}<small>${it.sub}</small>` : it.text; if (o.txt !== html) { o.d.innerHTML = html; o.txt = html; }
        o.d.className = 'lab' + (it.part ? ' part' : ''); o.d.style.setProperty('--c', it.color); o.d.style.opacity = it.a;
        act.push({it, o, w: Math.max(it.text.length * 9.4, (it.sub || '').length * 6.3) + 20, h: it.sub ? 44 : 28, x: it.x + (it.dx || 0), y: it.y + (it.dy || 0)});
      }
      const cl = (a) => { a.x = Math.min(1200 - a.w / 2, Math.max(400 + a.w / 2, a.x)); a.y = Math.min(B.bottom - a.h / 2, Math.max(B.top + a.h / 2, a.y)); };
      act.forEach(cl);
      for (let k = 0; k < 24; k++) { let mv = false; for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) { const A = act[i], C = act[j], ox = (A.w + C.w) / 2 + 6 - Math.abs(A.x - C.x), oy = (A.h + C.h) / 2 + 6 - Math.abs(A.y - C.y); if (ox > 0 && oy > 0) { const d = C.y >= A.y ? 1 : -1; C.y += d * (oy / 2 + 1); A.y -= d * (oy / 2 + 1); mv = true; } } act.forEach(cl); if (!mv) break; }
      for (const {it, o, x, y} of act) { o.d.style.left = x + 'px'; o.d.style.top = y + 'px'; const far = Math.hypot(x - it.x, y - it.y) > 6; o.ln.style.display = far ? '' : 'none'; if (far) { o.ln.setAttribute('x1', it.x); o.ln.setAttribute('y1', it.y); o.ln.setAttribute('x2', x); o.ln.setAttribute('y2', y); o.ln.setAttribute('stroke', it.color); o.ln.style.opacity = it.a; } }
      for (const id of Object.keys(labs)) if (!seen.has(id)) labs[id].d.style.display = labs[id].ln.style.display = 'none';
    },
  };
}

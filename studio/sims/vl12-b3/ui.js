// B3 overlay: số liệu, bảng đo F theo I, đồ thị và hình vẽ quy tắc bàn tay trái nhìn từ trên xuống.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', BL = '#2b59c3', GR = '#2c9a4b';
export const CSS = BASE + `canvas.gr{width:100%;height:176px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.rw{display:flex;gap:6px;margin-bottom:6px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>B3 · LỰC TỪ LÊN DÂY DẪN</h1><p>F = B·I·l·sinθ · QUY TẮC BÀN TAY TRÁI · Vật lí 12 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${OR}">${row('B', 'B', BL)}${row('I', 'I', GR)}${row('θ', 'th', PU)}${row('F', 'F', OR)}${row('F đo', 'Fm', TL)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <canvas class="gr" id="g0" width="680" height="300"></canvas>
    <table class="tb" id="tb"></table>
    <canvas class="gr" id="g1" width="680" height="340"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('I', 'I dòng điện (A)', RANGE.I[0], RANGE.I[1], 0.1, GR)}${sl('B', 'B cảm ứng từ (T)', RANGE.B[0], RANGE.B[1], 0.01, BL)}${sl('l', 'l dây trong từ trường (m)', RANGE.l[0], RANGE.l[1], 0.01, TL)}${sl('th', 'θ góc dây–đường sức (°)', RANGE.th[0], RANGE.th[1], 1, PU)}
    <div class="rw"><button class="btn big" id="b-rec" style="margin:0;height:38px;font-size:14px;flex:2;box-shadow:none">＋ Ghi số liệu</button><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] nam châm · lò xo · thanh ngang</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="ruler">3<br>ĐỌC THƯỚC</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['I', 'B', 'l', 'th']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear());
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const arrow = (g, x0, y0, x1, y1, col, w = 4) => { const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < 3) return; g.strokeStyle = g.fillStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - Math.cos(a) * 9, y1 - Math.sin(a) * 9); g.stroke(); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - Math.cos(a - 0.45) * 14, y1 - Math.sin(a - 0.45) * 14); g.lineTo(x1 - Math.cos(a + 0.45) * 14, y1 - Math.sin(a + 0.45) * 14); g.closePath(); g.fill(); };
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    syncSliders(s) { for (const k of ['I', 'B', 'l', 'th']) { const v = k === 'I' ? s.cmd.I : s[k]; const i = $('s-' + k); if (document.activeElement !== i) i.value = v; $('sv-' + k).textContent = k === 'th' ? `${f(v, 0)}°` : k === 'I' ? `${f(v, 1)} A` : k === 'B' ? `${f(v, 2)} T` : `${f(v, 2)} m`; } },
    update(r, s) {
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('B', `${f(r.B, 2)}<small>T</small>`, r.B / 0.3); set('I', `${f(r.I, 2)}<small>A</small>`, r.I / 5); set('th', `${f(r.th, 0)}<small>°</small>`, r.th / 90); set('F', `${f(r.F, 3)}<small>N</small>`, r.F / 0.4); set('Fm', `${f(Math.abs(r.Fmeas), 3)}<small>N</small>`, Math.abs(r.Fmeas) / 0.4);
      $('tag').innerHTML = r.dir === 0 ? 'Chưa có dòng điện: <b>F = 0</b>, thanh đứng tại vạch 0' : `Lực từ hướng <b style="color:${OR}">${r.dir > 0 ? 'LÊN' : 'XUỐNG'}</b> · F<sub>đo</sub> = 2k·Δy = ${f(Math.abs(r.Fmeas), 3)} N`;
      // hình từ trên xuống: trục x sang phải, z hướng xuống; F hướng lên/ra khỏi trang = ⊙, xuống/vào trang = ⊗
      { const c = $('g0'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); g.fillStyle = '#f6f9fb'; g.fillRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2 + 6, K = 120; g.strokeStyle = '#c9d6de'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(20, cy); g.lineTo(w - 20, cy); g.moveTo(cx, 16); g.lineTo(cx, h - 16); g.stroke();
        g.font = '700 17px monospace'; g.fillStyle = INK; g.textAlign = 'left'; g.fillText('NHÌN TỪ TRÊN XUỐNG', 12, 20);
        g.fillStyle = '#e6edf2'; g.fillRect(cx - 5, cy - 118, 10, 236); g.fillStyle = INK; g.fillText('thanh', cx + 10, cy - 100);
        arrow(g, cx - r.b[0] * K * 1.0, cy - r.b[2] * K * 1.0, cx + r.b[0] * K, cy + r.b[2] * K, BL, 5);
        g.fillStyle = BL; g.textAlign = 'center'; g.fillText('B', cx + r.b[0] * K + 16 * Math.sign(r.b[0] || 1), cy + r.b[2] * K + 18);
        if (Math.abs(r.I) > 0.05) { const s2 = Math.sign(r.I); arrow(g, cx + 36, cy - s2 * 40, cx + 36, cy + s2 * 40, GR, 5); g.fillStyle = GR; g.fillText('I', cx + 56, cy + 6); }
        if (r.dir) { g.strokeStyle = OR; g.fillStyle = OR; g.lineWidth = 5; const X0 = w - 70, Y0 = cy; g.beginPath(); g.arc(X0, Y0, 24, 0, 7); g.stroke(); if (r.dir > 0) { g.beginPath(); g.arc(X0, Y0, 6, 0, 7); g.fill(); } else { g.lineWidth = 4; g.beginPath(); g.moveTo(X0 - 12, Y0 - 12); g.lineTo(X0 + 12, Y0 + 12); g.moveTo(X0 + 12, Y0 - 12); g.lineTo(X0 - 12, Y0 + 12); g.stroke(); } g.font = '700 16px monospace'; g.fillText(r.dir > 0 ? 'F ra khỏi trang (lên)' : 'F vào trang (xuống)', X0 - 40, Y0 + 52); }
      }
      $('tb').innerHTML = `<tr><th>I (A)</th><th>θ (°)</th><th>l (m)</th><th>B (T)</th><th>F (N)</th></tr>` + (r.rows.length ? r.rows.map((q) => `<tr><td>${f(q.I, 1)}</td><td>${f(q.th, 0)}</td><td>${f(q.l, 2)}</td><td>${f(q.B, 2)}</td><td>${f(Math.abs(q.F), 3)}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi số liệu”</td></tr>');
      const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 76, r: 16, t: 30, b: 34}, FM = 0.5, X = (x) => m.l + ((x + 5) / 10) * (w - m.l - m.r), Y = (y) => h - m.b - ((y + 0.5) / 1) * (h - m.t - m.b);
      g.font = '17px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (let x = -5; x <= 5; x += 1) { g.beginPath(); g.moveTo(X(x), Y(-FM)); g.lineTo(X(x), Y(FM)); g.stroke(); if (x % 2 === 0) g.fillText(String(x).replace('-', '−'), X(x), h - 10); }
      g.textAlign = 'right'; for (let y = -0.4; y <= 0.41; y += 0.2) { g.beginPath(); g.moveTo(X(-5), Y(y)); g.lineTo(X(5), Y(y)); g.stroke(); g.fillText(y.toFixed(1).replace('.', ',').replace('-', '−'), m.l - 8, Y(y) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(-5), Y(0)); g.lineTo(X(5), Y(0)); g.moveTo(X(0), Y(-FM)); g.lineTo(X(0), Y(FM)); g.stroke();
      const sl2 = r.B * r.l * r.sinth; g.strokeStyle = 'rgba(11,143,140,.45)'; g.lineWidth = 3; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(X(-5), Y(-5 * sl2)); g.lineTo(X(5), Y(5 * sl2)); g.stroke(); g.setLineDash([]);
      const pts = r.rows.map((q) => [X(q.I), Y(q.F)]); g.fillStyle = OR; pts.forEach((p) => { g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.fill(); });
      g.fillStyle = INK; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(r.I), Y(r.Fmeas), 9, 0, 7); g.fill(); g.stroke();
      g.font = '700 16px monospace'; g.textAlign = 'right'; g.fillStyle = TL; g.fillText('đường lí thuyết hiện tại (nét đứt)', w - 8, 20); g.fillStyle = INK; g.fillText('I (A)', w - 6, h - 36); g.textAlign = 'left'; g.fillText('F (N), + = lên', 6, 20);
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

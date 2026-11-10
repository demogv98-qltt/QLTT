// B1 overlay: số liệu từ trường tại kim thử, bảng và đồ thị B theo r (log–log), các nút chế độ.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {MAG, PRESETS, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:210px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.rw{display:flex;gap:6px;margin-bottom:6px}.md{display:flex;gap:5px;margin-bottom:8px}.md button,.tg button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.md button.on,.tg button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.tg{display:flex;gap:5px;margin-bottom:8px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
export const uT = (T) => T * 1e6;

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>B1 · TỪ TRƯỜNG VÀ ĐƯỜNG SỨC TỪ</h1><p>NAM CHÂM THANH · LA BÀN · MẠT SẮT · TỪ TRƯỜNG TRÁI ĐẤT · Vật lí 12 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>KIM THỬ (CAM)</span><span>PROBE</span></div>
    <div class="blk" style="--c:${OR}">${row('B_NC', 'm', RD)}${row('B_TĐ', 'e', GR)}${row('B tổng', 't', BL)}${row('Lệch', 'd', OR)}${row('r', 'r', PU)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <canvas class="gr" id="g1" width="680" height="420"></canvas>
    <table class="tb" id="tb"></table></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="md" id="md"><button data-m="compass">Kim<br>la bàn</button><button data-m="filings">Mạt<br>sắt</button><button data-m="lines">Đường<br>sức</button></div>
    <div class="tg"><button id="t-mag">Nam châm</button><button id="t-earth">Trái Đất</button><button id="t-3d">Đường sức 3D</button></div>
    ${sl('Br', 'Br độ từ dư (T)', RANGE.Br[0], RANGE.Br[1], 0.01, RD)}${sl('phi', 'φ hướng nam châm (°)', 0, 360, 1, BL)}
    <div class="rw"><button class="pre" id="b-flip" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">↻ Quay ngược 180° (đổi chiều cực)</button></div>
    ${sl('r', 'r khoảng cách kim thử (m)', RANGE.r[0], RANGE.r[1], 0.01, OR)}${sl('alpha', 'α hướng so với trục nam châm (°)', 0, 360, 1, PU)}
    <div class="rw"><button class="btn big" id="b-rec" style="margin:0;height:36px;font-size:14px;flex:2;box-shadow:none">＋ Ghi B tại kim</button><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] nam châm · dòng điện tương đương</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="near">3<br>CẬN CẢNH</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['Br', 'phi', 'r', 'alpha']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#md button').forEach((b) => b.addEventListener('click', () => hooks.mode(b.dataset.m)));
  $('t-mag').addEventListener('click', () => hooks.toggle('magnet')); $('t-earth').addEventListener('click', () => hooks.toggle('earth')); $('t-3d').addEventListener('click', () => hooks.toggle('lines3d'));
  $('b-flip').addEventListener('click', () => hooks.flip()); $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear());
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    syncSliders(s) { for (const k of ['Br', 'phi', 'r', 'alpha']) { const i = $('s-' + k); if (document.activeElement !== i) i.value = s[k]; $('sv-' + k).textContent = k === 'Br' ? `${f(s[k], 2)} T` : k === 'r' ? `${f(s[k], 2)} m` : `${f(s[k], 0)}°`; } },
    update(r, s, curve) {
      root.querySelectorAll('#md button').forEach((b) => b.classList.toggle('on', b.dataset.m === s.mode));
      $('t-mag').classList.toggle('on', s.magnet); $('t-earth').classList.toggle('on', s.earth); $('t-3d').classList.toggle('on', s.lines3d); $('t-mag').textContent = s.magnet ? 'Nam châm: CÓ' : 'Nam châm: KHÔNG'; $('t-earth').textContent = s.earth ? 'Trái Đất: CÓ' : 'Trái Đất: KHÔNG';
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      const lg = (v) => Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1e-8)) + 7) / 4));
      set('m', `${f(uT(r.bm), 1)}<small>µT</small>`, lg(r.bm)); set('e', `${f(uT(r.be), 1)}<small>µT</small>`, lg(r.be)); set('t', `${f(uT(r.bt), 1)}<small>µT</small>`, lg(r.bt)); set('d', `${f(r.needle, 0)}<small>°</small>`, Math.abs(r.needle) / 180); set('r', `${f(r.r * 100, 0)}<small>cm</small>`, r.r / 0.6);
      $('tag').innerHTML = r.bm > 0 ? `Tại kim: B<sub>nam châm</sub> = <b>${f(uT(r.bm), 1)} µT</b> ${r.be ? `· B<sub>TĐ</sub> = ${f(uT(r.be), 0)} µT · tỉ số ${f(r.bm / r.be, 2)}` : ''}` : 'Không có nam châm: kim chỉ hướng của từ trường Trái Đất (Bắc)';
      $('tb').innerHTML = `<tr><th>r (cm)</th><th>α (°)</th><th>B (µT)</th><th>B·r³ (10⁻⁶ T·m³)</th></tr>` + (r.rows.length ? r.rows.map((q) => `<tr><td>${f(q.r * 100, 0)}</td><td>${f(q.alpha, 0)}</td><td>${f(uT(q.B), 1)}</td><td>${f(uT(q.B) * q.r ** 3, 2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi B tại kim”</td></tr>');
      const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 82, r: 14, t: 30, b: 38}, R0 = 0.08, R1 = 0.6, LB0 = -8.5, LB1 = -2.5; const X = (rr) => m.l + (Math.log10(rr / R0) / Math.log10(R1 / R0)) * (w - m.l - m.r), Y = (b) => h - m.b - ((Math.log10(Math.max(b, 1e-9)) - LB0) / (LB1 - LB0)) * (h - m.t - m.b);
      g.font = '16px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (const rr of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) { g.beginPath(); g.moveTo(X(rr), Y(10 ** LB0)); g.lineTo(X(rr), Y(10 ** LB1)); g.stroke(); g.fillText(String(Math.round(rr * 100)), X(rr), h - 14); }
      g.textAlign = 'right'; for (let e = -8; e <= -3; e++) { g.beginPath(); g.moveTo(X(R0), Y(10 ** e)); g.lineTo(X(R1), Y(10 ** e)); g.stroke(); g.fillText(`${(10 ** (e + 6)).toString().replace('.', ',')}`, m.l - 6, Y(10 ** e) + 5); }
      if (r.be) { g.strokeStyle = GR; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(X(R0), Y(r.be)); g.lineTo(X(R1), Y(r.be)); g.stroke(); g.setLineDash([]); g.fillStyle = GR; g.textAlign = 'left'; g.fillText('B Trái Đất', X(R0) + 6, Y(r.be) - 6); }
      for (const [cv, col, nm] of [[curve.axis, BL, 'trục'], [curve.equ, RD, 'trung trực']]) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); cv.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); g.fillStyle = col; g.textAlign = 'left'; g.fillText(nm, X(cv[cv.length - 1][0]) - 100, Y(cv[cv.length - 1][1]) + (nm === 'trục' ? -8 : 20)); }
      g.strokeStyle = 'rgba(20,48,60,.55)'; g.lineWidth = 1.5; g.setLineDash([3, 4]); const r0 = 0.3, b0 = curve.equ.find((p) => p[0] >= r0)?.[1] ?? 1e-6; g.beginPath(); g.moveTo(X(R0), Y(b0 * (r0 / R0) ** 3)); g.lineTo(X(R1), Y(b0 * (r0 / R1) ** 3)); g.stroke(); g.setLineDash([]); g.fillStyle = INK; g.textAlign = 'right'; g.fillText('dốc −3 (∝ 1/r³)', w - 8, 20);
      g.fillStyle = OR; r.rows.forEach((q) => { g.beginPath(); g.arc(X(q.r), Y(q.B), 6, 0, 7); g.fill(); });
      if (r.bm > 0) { g.fillStyle = INK; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(r.r), Y(r.bm), 9, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = INK; g.font = '700 16px monospace'; g.textAlign = 'left'; g.fillText('B (µT) theo r (cm), thang log–log', 6, 20);
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

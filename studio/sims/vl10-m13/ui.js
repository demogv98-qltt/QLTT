// M13 overlay: telemetry, data table and the F–Δl graph built from the recorded measurements.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {N_MAX, PRESETS, SPRINGS} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:188px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.sp{display:flex;gap:6px;margin-bottom:8px}.sp button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:6px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.3}.sp button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.sp small{display:block;font:600 11px 'JetBrains Mono',monospace;opacity:.85}.wt{display:flex;align-items:center;gap:6px;margin-bottom:8px}.wt button{width:54px;height:42px;font:800 22px Inter,sans-serif;border:1px solid #b6c6d0;background:#fff;border-radius:5px;cursor:pointer}.wt b{flex:1;text-align:center;font:800 20px 'JetBrains Mono',monospace;color:#8a6a1c}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M13 · ĐỊNH LUẬT HOOKE</h1><p>LÒ XO TREO, QUẢ NẶNG VÀ THƯỚC ĐO · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU LÒ XO</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('m', 'm', '#c8a24a')}${row('F=mg', 'F', TL)}${row('Δl', 'l', OR)}${row('F/Δl', 'k', PU)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <table class="tb" id="tb"></table>
    <canvas class="gr" id="g1" width="680" height="376"></canvas></div>`));
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div style="font:700 12px Inter;margin-bottom:4px">Chọn lò xo</div><div class="sp" id="sp">${SPRINGS.map((p, i) => `<button data-s="${i}">${p.id}<small>k = ${p.k} N/m</small></button>`).join('')}</div>
    <div style="font:700 12px Inter;margin-bottom:4px">Quả nặng treo vào (mỗi quả 100 g)</div><div class="wt"><button id="b-minus">−</button><b id="nw"></b><button id="b-plus">+</button></div>
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-rec" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">＋ Ghi số liệu</button><button class="pre" id="b-clear" style="margin:0;width:auto;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button></div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="pre" id="b-fresh" style="margin:0;flex:2;text-align:center;font:700 12px Inter,sans-serif">Thay lò xo mới</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] quả nặng · móc treo · lò xo</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="ruler">2<br>ĐỌC THƯỚC</button><button data-v="spring">3<br>LÒ XO</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  root.querySelectorAll('#sp button').forEach((b) => b.addEventListener('click', () => hooks.spring(Number(b.dataset.s))));
  $('b-minus').addEventListener('click', () => hooks.weights(-1)); $('b-plus').addEventListener('click', () => hooks.weights(1));
  $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear()); $('b-fresh').addEventListener('click', () => hooks.fresh());
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
    update(r, s) {
      root.querySelectorAll('#sp button').forEach((b) => b.classList.toggle('on', Number(b.dataset.s) === s.sp)); $('nw').textContent = `${s.n} quả = ${s.n * 100} g`; $('b-plus').disabled = s.n >= N_MAX; $('b-minus').disabled = s.n <= 0;
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('m', `${f(r.m * 1000, 0)}<small>g</small>`, r.m / 1); set('F', `${f(r.F, 2)}<small>N</small>`, r.F / 10); set('l', `${f(r.x * 100, 1)}<small>cm</small>`, r.x / 0.7, r.over ? RD : OR); set('k', `${r.n ? f(r.kest, 1) : '—'}<small>N/m</small>`, r.kest / 100, r.over ? RD : PU);
      $('tag').innerHTML = r.over ? `<b style="color:#c0392b">Quá giới hạn đàn hồi!</b> lò xo đã giãn vĩnh viễn ${f(r.p * 100, 1)} cm` : `Giới hạn đàn hồi: F ≤ <b>${r.Flim} N</b> (Δl ≤ ${f(r.xlim * 100, 0)} cm)  · độ cứng k = <b>${r.k}</b> N/m`;
      $('tb').innerHTML = `<tr><th>n</th><th>m (g)</th><th>F (N)</th><th>Δl (cm)</th><th>F/Δl</th></tr>` + (r.rows.length ? r.rows.map((q) => `<tr><td>${q.n}</td><td>${f(q.m * 1000, 0)}</td><td>${f(q.F, 2)}</td><td>${f(q.dl * 100, 1)}</td><td>${f(q.F / q.dl, 1)}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi số liệu”</td></tr>');
      const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 70, r: 16, t: 30, b: 34}, DL = 0.72, FM = 10, X = (x) => m.l + (x / DL) * (w - m.l - m.r), Y = (y) => h - m.b - (y / FM) * (h - m.t - m.b);
      g.font = '17px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (let x = 0; x <= 70; x += 10) { g.beginPath(); g.moveTo(X(x / 100), Y(0)); g.lineTo(X(x / 100), Y(FM)); g.stroke(); g.fillText(String(x), X(x / 100), h - 10); }
      g.textAlign = 'right'; for (let y = 0; y <= FM; y += 2) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(DL), Y(y)); g.stroke(); g.fillText(String(y), m.l - 8, Y(y) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(DL), Y(0)); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(FM)); g.stroke();
      const sp = SPRINGS[s.sp], xl = sp.Flim / sp.k;
      g.strokeStyle = 'rgba(11,143,140,.35)'; g.lineWidth = 3; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(Math.min(DL, FM / sp.k)), Y(Math.min(FM, sp.k * DL))); g.stroke(); g.setLineDash([]);
      g.strokeStyle = RD; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(X(xl), Y(0)); g.lineTo(X(xl), Y(Math.min(FM, sp.Flim))); g.stroke(); g.setLineDash([]); g.fillStyle = RD; g.textAlign = 'left'; g.fillText('giới hạn', Math.min(X(xl) + 5, w - 100), Y(sp.Flim) + 20);
      const pts = r.rows.map((q) => [X(q.dl), Y(q.F)]); if (pts.length > 1) { g.strokeStyle = OR; g.lineWidth = 4; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
      g.fillStyle = OR; pts.forEach((p) => { g.beginPath(); g.arc(p[0], p[1], 8, 0, 7); g.fill(); });
      g.fillStyle = INK; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(Math.min(DL, r.x)), Y(Math.min(FM, r.Fs)), 9, 0, 7); g.fill(); g.stroke();
      g.font = '700 17px monospace'; g.textAlign = 'right'; g.fillStyle = TL; g.fillText('đường lí thuyết F = k·Δl (nét đứt)', w - 8, 20); g.fillStyle = INK; g.fillText('Δl (cm)', w - 6, h - 36); g.textAlign = 'left'; g.fillText('F (N)', 6, 20);
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

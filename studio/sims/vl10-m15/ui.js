// M15 overlay: measurement table, processing of the data (mean, absolute and relative errors, g and its error) and two plots.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {G_TRUE, N_CHOICES, PRESETS} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:150px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.sp{display:flex;gap:6px;margin-bottom:8px}.sp button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:6px 2px;font:700 13px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.3}.sp button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.rs{font:600 12.3px/1.55 'JetBrains Mono',monospace;background:#f2f7fa;border:1px solid #c9d6de;border-radius:5px;padding:6px 9px;margin-bottom:6px}.rs b{color:#e8590c}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M15 · SAI SỐ CỦA PHÉP ĐO</h1><p>ĐO CHU KÌ CON LẮC ĐƠN, TÍNH g · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>BẢNG SỐ LIỆU</span><span>DATA</span></div>
    <table class="tb" id="tb"></table><div class="rs" id="rs"></div>
    <canvas class="gr" id="g1" width="680" height="300"></canvas><canvas class="gr" id="g2" width="680" height="300"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('l', 'l chiều dài dây (cm)', 50, 150, 1, OR)}
    <div style="font:700 12px Inter;margin:2px 0 4px">Mỗi lần bấm giờ đo bao nhiêu dao động?</div><div class="sp" id="spn">${N_CHOICES.map((n) => `<button data-n="${n}">${n}</button>`).join('')}</div>
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-meas" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">⏱ Đo 1 lần</button><button class="pre" id="b-clear" style="margin:0;width:auto;flex:1;text-align:center;font:700 12.5px Inter,sans-serif">Xoá bảng</button></div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-proc" style="margin:0;height:38px;font-size:14px;flex:2;box-shadow:none;background:#5b3cc4;border-color:#5b3cc4">∑ Xử lí số liệu</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] viên bi · đồng hồ · kẹp treo</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="bob">2<br>QUẢ NẶNG</button><button data-v="ruler">3<br>THƯỚC</button><button data-v="watch">4<br>ĐỒNG HỒ</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  $('s-l').addEventListener('input', (e) => hooks.cmd('l', Number(e.target.value) / 100));
  root.querySelectorAll('#spn button').forEach((b) => b.addEventListener('click', () => hooks.n(Number(b.dataset.n))));
  $('b-meas').addEventListener('click', () => hooks.measure()); $('b-clear').addEventListener('click', () => hooks.clear()); $('b-proc').addEventListener('click', () => hooks.process()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const e = $('s-l'); if (document.activeElement !== e) e.value = s.l * 100; $('sv-l').textContent = f(s.l * 100, 0) + ' cm';
      root.querySelectorAll('#spn button').forEach((b) => b.classList.toggle('on', Number(b.dataset.n) === s.n));
      const st = r.st, sh = r.show && st;
      $('tb').innerHTML = `<tr><th>Lần</th><th>t (s) · ${s.n} dao động</th><th>|t − t̄| (s)</th></tr>` + (s.rows.length ? s.rows.map((t, i) => `<tr><td>${i + 1}</td><td>${f(t, 2)}</td><td>${sh ? f(st.dev[i], 3) : '?'}</td></tr>`).join('') + (sh ? `<tr><td><b>TB</b></td><td><b>${f(st.mean, 3)}</b></td><td><b>${f(st.dng, 3)}</b></td></tr>` : '') : '<tr><td colspan="3" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “⏱ Đo 1 lần”</td></tr>');
      $('rs').innerHTML = !st ? 'Mỗi lần đo, tay bấm đồng hồ trễ nhanh khác nhau nên kết quả dao động quanh giá trị thật.' : !sh ? `Đã có <b>${st.N}</b> lần đo. Hãy tự tính trung bình và sai số rồi bấm <b>∑ Xử lí số liệu</b> để đối chiếu.` :
        `t̄ = <b>${f(st.mean, 3)}</b> s · Δt (ngẫu nhiên) = <b>${f(st.dng, 3)}</b> s<br>Δt = ${f(st.dng, 3)} + ${f(0.005, 3)} (dụng cụ) = <b>${f(st.dt, 3)}</b> s<br>δ = Δt/t̄ = <b>${f(st.dltT * 100, 2)} %</b><br>T = t̄/${st.n} = <b>${f(st.T, 4)}</b> ± ${f(st.dT, 4)} s<br>δg = δl + 2δT = ${f(st.dl * 100, 2)}% + 2·${f(st.dltT * 100, 2)}% = <b>${f(st.dgRel * 100, 2)} %</b><br>g = 4π²l/T² = <b>${f(st.g, 3)} ± ${f(st.dgAbs, 3)}</b> m/s²<br>${st.inside ? `<span class="ok">✔ g thật ${f(G_TRUE, 1)} nằm trong khoảng đo</span>` : `<span style="color:#c0392b">g thật ${f(G_TRUE, 1)} nằm ngoài khoảng đo</span>`}`;
      // dot plot
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      g.font = '17px monospace'; g.fillStyle = INK;
      if (st) {
        const lo = Math.min(...s.rows, st.mean - st.dt) - 0.03 * st.n, hi = Math.max(...s.rows, st.mean + st.dt) + 0.03 * st.n, X = (v) => 30 + ((v - lo) / (hi - lo)) * (w - 60), N = s.rows.length;
        g.strokeStyle = '#e2eaef'; g.lineWidth = 1.4; for (let i = 0; i <= 4; i++) { const v = lo + ((hi - lo) * i) / 4; g.beginPath(); g.moveTo(X(v), 30); g.lineTo(X(v), h - 26); g.stroke(); g.textAlign = 'center'; g.fillText(f(v, st.n >= 10 ? 1 : 2), X(v), h - 6); }
        if (sh) { g.fillStyle = 'rgba(91,60,196,.15)'; g.fillRect(X(st.mean - st.dt), 30, X(st.mean + st.dt) - X(st.mean - st.dt), h - 56); g.strokeStyle = PU; g.lineWidth = 3; g.beginPath(); g.moveTo(X(st.mean), 30); g.lineTo(X(st.mean), h - 26); g.stroke(); }
        s.rows.forEach((v, i) => { const y = 44 + (i * (h - 100)) / Math.max(N - 1, 1) * (N > 1 ? 1 : 0); g.fillStyle = OR; g.beginPath(); g.arc(X(v), y, 8, 0, 7); g.fill(); });
        g.fillStyle = INK; g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillText('các lần đo t (s)' + (sh ? ' · vạch tím: trung bình, vùng tím: ± Δt' : ''), 6, 20);
      } else { g.textAlign = 'center'; g.fillStyle = '#6a8190'; g.fillText('Biểu đồ các lần đo sẽ hiện ở đây', w / 2, h / 2); }
      // relative errors
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); g.font = '700 17px monospace'; g.fillStyle = INK; g.textAlign = 'left'; g.fillText('sai số tỉ đối (%)', 6, 20);
      if (sh) { const vals = [['δl', st.dl * 100, OR], ['δT', st.dltT * 100, TL], ['2δT', 2 * st.dltT * 100, TL], ['δg', st.dgRel * 100, PU]], mx = Math.max(0.5, ...vals.map((q) => q[1])) * 1.1; vals.forEach(([k, v, col], i) => { const y = 42 + i * 62, bw = (v / mx) * (w - 220); g.fillStyle = INK; g.textAlign = 'right'; g.fillText(k, 70, y + 28); g.fillStyle = col; g.fillRect(84, y, Math.max(2, bw), 40); g.fillStyle = INK; g.textAlign = 'left'; g.fillText(f(v, 2) + ' %', 92 + bw, y + 28); }); }
      else { g.textAlign = 'center'; g.fillStyle = '#6a8190'; g.fillText('Bấm “Xử lí số liệu” để xem các sai số', w / 2, h / 2); }
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

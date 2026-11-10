// B6 overlay: số liệu Φ, e, i, F; đồ thị Φ(t) và e(t); bảng e_max theo v, N.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:150px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.rw{display:flex;gap:6px;margin-bottom:6px}.md{display:flex;gap:5px;margin-bottom:8px}.md button,.tg button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.md button.on,.tg button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.tg{display:flex;gap:5px;margin-bottom:8px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>B6 · CẢM ỨNG ĐIỆN TỪ</h1><p>TỪ THÔNG · e = −NΔΦ/Δt · ĐỊNH LUẬT LENZ · Vật lí 12 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k" style="white-space:nowrap;font-size:11px">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${OR}">${row('NΦ (↓)', 'p', BL)}${row('e', 'e', OR)}${row('i', 'i', GR)}${row('v (↓ +)', 'v', PU)}${row('F hãm (↑)', 'F', RD)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <canvas class="gr" id="g1" width="680" height="300"></canvas><canvas class="gr" id="g2" width="680" height="300"></canvas>
    <table class="tb" id="tb"></table></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="sw-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="md" id="md"><button data-m="motor">Kéo bằng<br>motor</button><button data-m="fall">Thả<br>rơi</button></div>
    <div id="pm">${sl('v', 'v vận tốc kéo (m/s), + = xuống', RANGE.v[0], RANGE.v[1], 0.05, PU)}<div class="rw"><button class="pre" id="b-stop" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">■ Dừng</button><button class="pre" id="b-reset" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">↺ Đưa nam châm lên</button></div></div>
    <div id="pf"><div class="rw"><button class="btn big" id="b-drop" style="margin:0;height:40px;font-size:15px;flex:2;box-shadow:none">▼ THẢ nam châm</button><button class="pre" id="b-reset2" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">↺ Đặt lại</button></div></div>
    <div class="tg"><button id="t-open">Mạch: KÍN</button><button id="t-flip">Cực N: XUỐNG</button></div><div class="tg"><button id="t-hand">Bàn tay phải: HIỆN</button></div>
    ${sl('N', 'N số vòng dây', RANGE.N[0], RANGE.N[1], 10, BL)}${sl('R', 'R điện trở mạch (Ω)', RANGE.R[0], RANGE.R[1], 1, TL)}${sl('Br', 'Br độ từ dư nam châm (T)', RANGE.Br[0], RANGE.Br[1], 0.01, RD)}
    <div class="rw"><button class="btn big" id="b-rec" style="margin:0;height:36px;font-size:14px;flex:2;box-shadow:none">＋ Ghi e_max</button><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.1">×0,1</option><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] ống · cuộn dây · giá đỡ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="coil">2<br>CUỘN DÂY</button><button data-v="gal">3<br>ĐIỆN KẾ</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['v', 'N', 'R', 'Br']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#md button').forEach((b) => b.addEventListener('click', () => hooks.mode(b.dataset.m)));
  $('b-stop').addEventListener('click', () => hooks.stop()); $('b-reset').addEventListener('click', () => hooks.reset()); $('b-reset2').addEventListener('click', () => hooks.reset()); $('b-drop').addEventListener('click', () => hooks.drop());
  $('t-open').addEventListener('click', () => hooks.toggle('open')); $('t-flip').addEventListener('click', () => hooks.toggle('flip')); $('t-hand').addEventListener('click', () => hooks.toggle('hand'));
  $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear());
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  function plot(c, hist, key, label, col, unit, scale) {
    const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); const m = {l: 78, r: 12, t: 26, b: 22}; g.font = '15px monospace'; g.fillStyle = INK;
    const T1 = hist.length ? hist[hist.length - 1].t : 1, T0 = Math.max(0, T1 - 1.2), pts = hist.filter((p) => p.t >= T0); let mx = 1e-9; for (const p of hist) mx = Math.max(mx, Math.abs(p[key])); mx = Math.max(mx, key === 'phi' ? 1e-3 : 0.05);
    const X = (t) => m.l + ((t - T0) / 1.2) * (w - m.l - m.r), Y = (v) => h / 2 - (v / (mx * 1.15)) * (h / 2 - m.t - 2);
    g.strokeStyle = '#e2eaef'; g.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(m.l, Y(k * mx)); g.lineTo(w - m.r, Y(k * mx)); g.stroke(); } g.strokeStyle = '#7d93a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
    g.textAlign = 'right'; g.fillText((mx * scale).toFixed(mx * scale < 10 ? 2 : 1).replace('.', ','), m.l - 6, Y(mx) + 5); g.fillText('0', m.l - 6, Y(0) + 5); g.fillText((-mx * scale).toFixed(mx * scale < 10 ? 2 : 1).replace('.', ',').replace('-', '−').replace(/^/, '−').replace('−−', '−'), m.l - 6, Y(-mx) + 5);
    g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p[key])) : g.moveTo(X(p.t), Y(p[key])))); g.stroke(); g.textAlign = 'left'; g.font = '700 15px monospace'; g.fillText(`${label} (${unit}) theo t, 1,2 s gần nhất`, 6, 17);
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    syncSliders(s) { $('pm').style.display = s.mode === 'motor' ? '' : 'none'; $('pf').style.display = s.mode === 'fall' ? '' : 'none'; for (const k of ['v', 'N', 'R', 'Br']) { const i = $('s-' + k), val = k === 'v' ? s.vcmd : s[k]; if (document.activeElement !== i) i.value = val; $('sv-' + k).textContent = k === 'v' ? `${f(val, 2)} m/s` : k === 'N' ? `${val} vòng` : k === 'R' ? `${val} Ω` : `${f(val, 2)} T`; } },
    update(r, s, fs) {
      root.querySelectorAll('#md button').forEach((b) => b.classList.toggle('on', b.dataset.m === s.mode)); $('t-hand').classList.toggle('on', s.hand); $('t-hand').textContent = s.hand ? 'Bàn tay phải: HIỆN' : 'Bàn tay phải: ẨN'; $('t-open').classList.toggle('on', s.open); $('t-open').textContent = s.open ? 'Mạch: HỞ (không dòng)' : 'Mạch: KÍN'; $('t-flip').classList.toggle('on', s.flip); $('t-flip').textContent = s.flip ? 'Cực N: HƯỚNG LÊN' : 'Cực N: XUỐNG';
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('p', `${f(r.phiDown * 1e3, 1)}<small>mWb</small>`, Math.abs(r.phiDown) / 0.06); set('e', `${f(r.e, 2)}<small>V</small>`, Math.abs(r.e) / 5); set('i', `${f(r.i, 3)}<small>A</small>`, Math.abs(r.i) / Math.max(fs, 1e-6)); set('v', `${f(-r.v, 2)}<small>m/s ↓</small>`, Math.abs(r.v) / 3.5); set('F', `${f(r.F, 2)}<small>N</small>`, Math.abs(r.F) / 3);
      $('tag').innerHTML = r.mode === 'fall' ? (r.hit ? `Đã rơi xong: <b>t = ${f(r.tFall, 3)} s</b> · KE lúc chạm = ${f(r.KEhit, 3)} J · nhiệt toả ra trong dây Q = <b>${f(r.heat * 1e3, 1)} mJ</b>` : r.released ? `Đang rơi… t = ${f(r.tFall, 2)} s` : 'Bấm “THẢ nam châm”. Cuộn dây ở giữa ống; nam châm cách 30 cm phía trên.') : `NΦ = từ thông toàn phần qua cuộn (chiều xuống). |NΦ| lớn nhất khi nam châm ở giữa cuộn; e = −d(NΦ)/dt đổi dấu khi nam châm đi qua. e cực đại <b>${f(r.emax, 2)} V</b>`;
      plot($('g1'), r.hist, 'phi', 'NΦ (chiều xuống)', BL, 'mWb', 1e3); plot($('g2'), r.hist, 'e', 'e cảm ứng', OR, 'V', 1);
      $('tb').innerHTML = `<tr><th>v (m/s)</th><th>N</th><th>R (Ω)</th><th>e_max (V)</th></tr>` + (r.rows.length ? r.rows.map((q) => `<tr><td>${f(q.v, 2)}</td><td>${q.N}</td><td>${q.R}</td><td>${f(q.emax, 2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi e_max”</td></tr>');
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

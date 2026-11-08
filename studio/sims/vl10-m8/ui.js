// M8 overlay: numbers, the v–t / s–t graph and a bar chart that compares the weights with the string tension.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, G, SMAX} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:128px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 104px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M8 · BÀI TOÁN ĐỘNG LỰC HỌC</h1><p>MÁY ATWOOD · XE + QUẢ CÂN · LỰC CĂNG DÂY · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span id="lt">SỐ LIỆU</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('a', 'a', PU)}${row('T', 'T', TL)}${row('v', 'v', INK)}${row('s', 's', INK)}${row('t', 't', INK)}${row('mg', 'w', RD)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.55;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="256"></canvas><canvas class="gr" id="g2" width="680" height="256"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="w-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="tabs"><button id="tabA" class="on">Máy Atwood</button><button id="tabC">Xe + quả cân</button></div>
    <div id="pA">${sl('m1', 'm₁ khối bên trái (kg)', RANGE.m1[0], RANGE.m1[1], 0.05, OR)}${sl('m2', 'm₂ khối bên phải (kg)', RANGE.m2[0], RANGE.m2[1], 0.05, TL)}</div>
    <div id="pC" style="display:none">${sl('M', 'M khối lượng xe (kg)', RANGE.M[0], RANGE.M[1], 0.1, TL)}${sl('m', 'm quả cân treo (kg)', RANGE.m[0], RANGE.m[1], 0.05, OR)}</div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-go" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">▶ Thả</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5" selected>×0,5</option><option value="1">×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] ổ bi ròng rọc · cảm biến lực căng</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="pulley">2<br>RÒNG RỌC</button><button data-v="mass">3<br>VẬT NẶNG</button><button data-v="ruler">4<br>THƯỚC</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['m1', 'm2', 'M', 'm']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-go').addEventListener('click', () => hooks.go()); $('b-reset').addEventListener('click', () => hooks.reset()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('tabA').addEventListener('click', () => hooks.mode('A')); $('tabC').addEventListener('click', () => hooks.mode('C'));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  function axes(g, w, h, m, x1, y1, xl, yl) {
    const X = (x) => m.l + (x / x1) * (w - m.l - m.r), Y = (y) => h - m.b - (y / y1) * (h - m.t - m.b);
    g.font = '19px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let i = 0; i <= 4; i++) { const x = (x1 * i) / 4; g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(Math.round(x * 100) / 100), X(x), h - 6); }
    g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = (y1 * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 100) / 100), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(x1), Y(0)); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    setMode(m) { $('tabA').classList.toggle('on', m === 'A'); $('tabC').classList.toggle('on', m === 'C'); $('pA').style.display = m === 'A' ? '' : 'none'; $('pC').style.display = m === 'C' ? '' : 'none'; $('lt').textContent = m === 'A' ? 'MÁY ATWOOD' : 'XE + QUẢ CÂN'; },
    sliders(s) { for (const k of ['m1', 'm2', 'M', 'm']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], k === 'M' ? 1 : 2) + ' kg'; } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setGo(t) { $('b-go').textContent = t; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar) => { $('v' + id).innerHTML = txt; $('b' + id).style.width = Math.min(100, Math.abs(bar) * 100) + '%'; };
      set('a', `${f(Math.abs(r.a), 3)}<small>m/s²</small>`, Math.abs(r.a) / 5); set('T', `${f(r.T, 3)}<small>N</small>`, r.T / 12); set('v', `${f(Math.abs(r.v), 3)}<small>m/s</small>`, Math.abs(r.v) / 3); set('s', `${f(Math.abs(r.s), 3)}<small>m</small>`, Math.abs(r.s) / SMAX); set('t', `${f(r.t, 3)}<small>s</small>`, r.t / 1.5); set('w', `${f(r.mg, 2)}<small>N</small>`, r.mg / 12);
      const isA = r.mode === 'A';
      $('tag').innerHTML = isA ? (r.balanced ? 'Hai khối bằng nhau: <b>cân bằng</b>, a = 0, T = mg' : `Khối <b>m${r.heavier}</b> nặng hơn nên đi xuống`) + ` · T ${r.balanced ? '=' : '<'} trọng lượng khối nặng` : `Quả cân đi xuống kéo xe: a = <b>${f(r.a, 3)}</b> m/s²`;
      $('res').innerHTML = isA ? `Khối nặng: m₂g − T = m₂a ; khối nhẹ: T − m₁g = m₁a<br>⇒ a = (m₂ − m₁)g/(m₁ + m₂) = <b>${f(r.a, 3)}</b> m/s² ; T = 2m₁m₂g/(m₁ + m₂) = <b>${f(r.T, 3)}</b> N<br>` + (r.aExp !== null ? `Đo: a = 2s/t² = 2·${f(r.s, 2)}/${f(r.t, 3)}² = <b>${f(r.aExp, 3)}</b> m/s² <span class="ok">✔</span>` : 'Thả để đo a bằng thước và đồng hồ.')
        : `Quả cân: mg − T = ma ; xe: T = M·a<br>⇒ a = mg/(M + m) = <b>${f(r.a, 3)}</b> m/s² ; T = Mmg/(M + m) = <b>${f(r.T, 3)}</b> N<br>` + (r.aExp !== null ? `Đo: a = 2s/t² = <b>${f(r.aExp, 3)}</b> m/s² <span class="ok">✔</span>` : 'Thả để đo a bằng thước và đồng hồ.');
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const tE = Math.min(3, Math.max(0.5, isFinite(r.ts) ? r.ts * 1.1 : 2)), vmax = Math.max(0.5, Math.abs(r.a) * tE * 1.1), A = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, tE, vmax, 't (s)', 'v (m/s)');
      g.strokeStyle = 'rgba(11,143,140,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(A.X(0), A.Y(0)); g.lineTo(A.X(tE), A.Y(Math.abs(r.a) * tE)); g.stroke(); g.strokeStyle = TL; g.lineWidth = 5; g.beginPath(); g.moveTo(A.X(0), A.Y(0)); g.lineTo(A.X(Math.min(r.t, tE)), A.Y(Math.abs(r.v))); g.stroke(); g.fillStyle = TL; g.beginPath(); g.arc(A.X(Math.min(r.t, tE)), A.Y(Math.abs(r.v)), 8, 0, 7); g.fill();
      g.font = '700 17px monospace'; g.fillStyle = INK; g.textAlign = 'left'; g.fillText('v = a·t (độ dốc = a)', 76, 28);
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const bars = isA ? [[`m₁g`, r.F1, OR], ['T', r.T, TL], [`m₂g`, r.F2, RD]] : [['mg', r.F1, RD], ['T', r.T, TL], ['M·a', s.M * Math.abs(r.a), PU]], mx = Math.max(1, ...bars.map((b) => b[1])) * 1.15, bw = 110, base = h - 34;
      bars.forEach(([lab, v, col], i) => { const x = 70 + i * 200, hh = (v / mx) * (h - 70); g.fillStyle = col; g.fillRect(x, base - hh, bw, hh); g.fillStyle = INK; g.font = '700 19px monospace'; g.textAlign = 'center'; g.fillText(lab, x + bw / 2, base + 22); g.fillText(f(v, 2) + ' N', x + bw / 2, base - hh - 8); });
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
  void G;
}

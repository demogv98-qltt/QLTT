// M2 overlay: telemetry, live v–t and d–t graphs (the shaded area is the displacement), controls.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, T_MAX, vAt, dAt, sAt} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', NEG = '#c0392b';
export const CSS = BASE + `
canvas.gr{width:100%;height:122px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}
.g3{display:grid;grid-template-columns:48px 112px 1fr;align-items:center;gap:6px;height:24px}
`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
const niceStep = (range, n) => { const raw = range / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
const rangeOf = (fn) => { let lo = 0, hi = 0; for (let i = 0; i <= 80; i++) { const y = fn((T_MAX * i) / 80); lo = Math.min(lo, y); hi = Math.max(hi, y); } if (hi - lo < 1) hi = lo + 1; const p = (hi - lo) * 0.1; return [lo - p, hi + p]; };

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M2 · CHUYỂN ĐỘNG THẲNG BIẾN ĐỔI ĐỀU</h1><p>XE THỬ NGHIỆM TRÊN ĐƯỜNG THẲNG · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU CHUYỂN ĐỘNG</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('t', 't', INK)}${row('v', 'v', TL)}${row('a', 'a', OR)}${row('d', 'd', INK)}${row('s', 's', INK)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <div class="res" id="res"></div>
    <canvas class="gr" id="gv" width="680" height="244"></canvas><canvas class="gr" id="gd" width="680" height="244"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('v0', 'v₀ vận tốc đầu', RANGE.v0[0], RANGE.v0[1], 0.5, TL)}${sl('a', 'a gia tốc', RANGE.a[0], RANGE.a[1], 0.1, OR)}${sl('t', 't thời gian', 0, T_MAX, 0.01, INK)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-play" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">▶ Chạy</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Đặt lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH XE<small>[T] mở vỏ · động cơ · pin · đĩa mã hoá</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="follow">1<br>THEO XE</button><button data-v="wide">2<br>TOÀN CẢNH</button><button data-v="top">3<br>TỪ TRÊN</button><button data-v="wheel">4<br>BÁNH XE</button></div>
    <div class="small">Kéo chuột để xoay · lăn chuột để zoom. Cứ mỗi giây có một “ảnh xe” để em so sánh khoảng cách: xe nhanh dần thì khoảng cách giữa các ảnh tăng dần.</div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['v0', 'a', 't']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-play').addEventListener('click', () => hooks.play()); $('b-reset').addEventListener('click', () => hooks.reset());
  $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));

  function axes(g, w, h, m, y0, y1, xl, yl) {
    const X = (x) => m.l + (x / T_MAX) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    g.font = '20px monospace'; g.lineWidth = 1.5; const sy = niceStep(y1 - y0, 4);
    g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let x = 0; x <= T_MAX; x += 2) { g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(x), X(x), h - 6); }
    g.textAlign = 'right';
    for (let y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(T_MAX), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(T_MAX), Y(0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14);
    return {X, Y};
  }
  function drawV(s, t) {
    const c = $('gv'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    const [lo, hi] = rangeOf((x) => vAt(s, x)), {X, Y} = axes(g, w, h, {l: 60, r: 16, t: 10, b: 26}, lo, hi, 't (s)', 'v (m/s)');
    const tz = s.a !== 0 ? -s.v0 / s.a : Infinity;
    const fill = (a, b) => { if (b <= a + 1e-9) return; g.fillStyle = vAt(s, (a + b) / 2) >= 0 ? 'rgba(11,143,140,.32)' : 'rgba(192,57,43,.3)'; g.beginPath(); g.moveTo(X(a), Y(0)); g.lineTo(X(a), Y(vAt(s, a))); g.lineTo(X(b), Y(vAt(s, b))); g.lineTo(X(b), Y(0)); g.closePath(); g.fill(); };
    if (tz > 0 && tz < t) { fill(0, tz); fill(tz, t); } else fill(0, t);
    g.strokeStyle = 'rgba(20,48,60,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0), Y(vAt(s, 0))); g.lineTo(X(T_MAX), Y(vAt(s, T_MAX))); g.stroke();
    g.strokeStyle = TL; g.lineWidth = 5; g.beginPath(); g.moveTo(X(0), Y(vAt(s, 0))); g.lineTo(X(t), Y(vAt(s, t))); g.stroke();
    g.fillStyle = TL; g.beginPath(); g.arc(X(t), Y(vAt(s, t)), 8, 0, 7); g.fill();
    g.fillStyle = INK; g.font = '700 20px monospace'; g.textAlign = 'left'; g.fillText('diện tích = d = ' + f(dAt(s, t), 1) + ' m', 70, h - 36);
  }
  function drawD(s, t) {
    const c = $('gd'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    const [lo, hi] = rangeOf((x) => dAt(s, x)), {X, Y} = axes(g, w, h, {l: 70, r: 16, t: 10, b: 26}, lo, hi, 't (s)', 'd (m)');
    const curve = (a, b) => { g.beginPath(); for (let i = 0; i <= 100; i++) { const x = a + ((b - a) * i) / 100; i ? g.lineTo(X(x), Y(dAt(s, x))) : g.moveTo(X(x), Y(dAt(s, x))); } g.stroke(); };
    g.strokeStyle = 'rgba(20,48,60,.25)'; g.lineWidth = 3; curve(0, T_MAX); g.strokeStyle = INK; g.lineWidth = 5; curve(0, t);
    const d = dAt(s, t), v = vAt(s, t), dt = 1.7; g.strokeStyle = TL; g.lineWidth = 4; g.beginPath(); g.moveTo(X(t - dt), Y(d - v * dt)); g.lineTo(X(t + dt), Y(d + v * dt)); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(X(t), Y(d), 8, 0, 7); g.fill();
    g.font = '700 20px monospace'; g.textAlign = 'left'; g.fillText('độ dốc tiếp tuyến = v = ' + f(v, 1), 80, h - 36);
  }
  return {
    root,
    setBottom(y) { B.bottom = y; },
    sliders(s) { for (const k of ['v0', 'a', 't']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], k === 't' ? 2 : 1) + (k === 'v0' ? ' m/s' : k === 'a' ? ' m/s²' : ' s'); } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setPlay(p, done) { $('b-play').textContent = p ? '❚❚ Dừng' : done ? '↺ Chạy lại' : '▶ Chạy'; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP XE' : 'TEARDOWN · BÓC TÁCH XE'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('t', `${f(r.t, 2)}<small>s</small>`, r.t / T_MAX); set('v', `${f(r.v, 2)}<small>m/s</small>`, r.v / 40, r.v >= 0 ? TL : NEG); set('a', `${f(r.a, 2)}<small>m/s²</small>`, r.a / 5);
      set('d', `${f(r.d, 2)}<small>m</small>`, r.d / 200, r.d >= 0 ? INK : NEG); set('s', `${f(r.s, 2)}<small>m</small>`, r.s / 200);
      $('tag').innerHTML = `Loại chuyển động: <b>${r.kind}</b>`;
      const ok = Math.abs(r.lhs - r.rhs) < 1e-9 * Math.max(1, Math.abs(r.lhs));
      $('res').innerHTML = `v = v₀ + a·t = ${f(s.v0, 1)} + (${f(s.a, 1)})·${f(r.t, 2)} = <b>${f(r.v, 2)}</b><br>d = v₀t + ½at² = <b>${f(r.d, 2)}</b> m · s = <b>${f(r.s, 2)}</b> m<br>v² − v₀² = ${f(r.lhs, 2)} ; 2ad = ${f(r.rhs, 2)} <span class="ok">${ok ? '✔ khớp' : '✘'}</span><br>Đĩa mã hoá đếm: <b>${r.pulses}</b> xung`;
      drawV(s, r.t); drawD(s, r.t);
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
  void sAt;
}

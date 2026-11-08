// M4 overlay: telemetry, the y–x trajectory (with predicted paths) and the velocity components against time.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, G, pos, flight} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:128px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:58px 108px 1fr;align-items:center;gap:6px;height:24px}
.tg{display:flex;gap:6px;margin-bottom:8px}.tg button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:4px;padding:6px 4px;font:700 12px Inter,sans-serif;cursor:pointer;color:${INK}}.tg button.on{background:${INK};color:#fff;border-color:${INK}}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M4 · CHUYỂN ĐỘNG NÉM</h1><p>SÚNG BẮN BI · THƯỚC ĐO GÓC · BIA · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU CHUYỂN ĐỘNG</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('t', 't', INK)}${row('x', 'x', INK)}${row('y', 'y', INK)}${row('vₓ', 'vx', OR)}${row('v_y', 'vy', TL)}${row('v', 'v', PU)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="256"></canvas><canvas class="gr" id="g2" width="680" height="256"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('alpha', 'α góc bắn (độ)', RANGE.alpha[0], RANGE.alpha[1], 0.5, OR)}${sl('v0', 'v₀ tốc độ ban đầu (m/s)', RANGE.v0[0], RANGE.v0[1], 0.5, TL)}${sl('h0', 'h₀ độ cao súng (m)', RANGE.h0[0], RANGE.h0[1], 0.1, INK)}${sl('D', 'D khoảng cách bia (m)', RANGE.D[0], RANGE.D[1], 0.1, PU)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-fire" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">🎯 Bắn</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5" selected>×0,5</option><option value="1">×1</option></select></div>
    <div class="tg"><button id="t-pred">Hiện quỹ đạo dự kiến</button><button id="t-comp">So sánh góc phụ (90° − α)</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH SÚNG<small>[T] lò xo · pít-tông · cò</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TOÀN CẢNH</button><button data-v="gun">2<br>SÚNG</button><button data-v="follow">3<br>THEO BI</button><button data-v="top">4<br>TỪ TRÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['alpha', 'v0', 'h0', 'D']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-fire').addEventListener('click', () => hooks.fire()); $('b-reset').addEventListener('click', () => hooks.reset()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('t-pred').addEventListener('click', () => hooks.toggle('pred')); $('t-comp').addEventListener('click', () => hooks.toggle('comp'));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  function axes(g, w, h, m, x0, x1, y0, y1, xl, yl) {
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    g.font = '19px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let i = 0; i <= 4; i++) { const x = x0 + ((x1 - x0) * i) / 4; g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(Math.round(x * 10) / 10), X(x), h - 6); }
    g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = y0 + ((y1 - y0) * i) / 4; g.beginPath(); g.moveTo(X(x0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(x0), Y(0)); g.lineTo(X(x1), Y(0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    sliders(s) { for (const k of ['alpha', 'v0', 'h0', 'D']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], 1) + (k === 'alpha' ? '°' : k === 'v0' ? ' m/s' : ' m'); } $('t-pred').classList.toggle('on', !!s.pred); $('t-comp').classList.toggle('on', !!s.comp); },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setFire(t) { $('b-fire').textContent = t; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH SÚNG'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('t', `${f(r.t, 2)}<small>s</small>`, r.t / Math.max(0.1, r.tFlight)); set('x', `${f(r.x, 2)}<small>m</small>`, r.x / 30); set('y', `${f(r.y, 2)}<small>m</small>`, r.y / 6); set('vx', `${f(r.vx, 2)}<small>m/s</small>`, r.vx / 15); set('vy', `${f(r.vy, 2)}<small>m/s</small>`, r.vy / 15, r.vy >= 0 ? TL : RD); set('v', `${f(r.speed, 2)}<small>m/s</small>`, r.speed / 20);
      $('tag').innerHTML = !r.fired ? `Bia ở D = <b>${f(s.D, 1)} m</b>. Chọn α, v₀ rồi bấm Bắn` : r.landed ? (r.hit ? '<b style="color:#2d7d3a">TRÚNG BIA!</b> ' : '<b style="color:#c0392b">Trượt bia.</b> ') + `Bi rơi cách súng ${f(r.x, 2)} m` : 'Bi đang bay…';
      $('res').innerHTML = `vₓ = v₀cosα = <b>${f(r.vx0, 2)}</b> m/s (không đổi) · v_y₀ = v₀sinα = <b>${f(r.vy0, 2)}</b> m/s<br>Thời gian bay: <b>${f(r.tFlight, 3)}</b> s · tầm xa L = <b>${f(r.L, 2)}</b> m · độ cao cực đại H = <b>${f(r.H, 2)}</b> m<br>Lò xo nén ${f(r.compress * 100, 1)} cm ⇒ ½kx² = <b>${f(r.E, 2)}</b> J = ½mv₀²`;
      // graph 1: the path
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const xm = Math.max(5, Math.ceil(Math.max(r.L, s.D, s.comp ? r.Lcomp : 0) * 1.08)), ym = Math.max(2, Math.ceil(Math.max(r.H, s.comp ? Math.max(s.h0, ((s.v0 * Math.cos(s.alpha * Math.PI / 180)) ** 2) / (2 * G) + s.h0) : 0) * 1.15)), A = axes(g, w, h, {l: 58, r: 14, t: 10, b: 26}, 0, xm, 0, ym, 'x (m)', 'y (m)');
      const path = (alpha, col, wd, dash, upTo) => { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); const tl = flight(alpha, s.v0, s.h0), t1 = Math.min(upTo, tl); g.beginPath(); for (let i = 0; i <= 80; i++) { const q = pos(alpha, s.v0, s.h0, (t1 * i) / 80); i ? g.lineTo(A.X(q.x), A.Y(Math.max(0, q.y))) : g.moveTo(A.X(q.x), A.Y(Math.max(0, q.y))); } g.stroke(); g.setLineDash([]); };
      if (s.pred || !r.fired) path(s.alpha, 'rgba(11,143,140,.35)', 3, [8, 6], 1e9); if (s.comp) path(90 - s.alpha, OR, 3, [8, 6], 1e9); if (r.fired) path(s.alpha, INK, 5, null, r.t);
      g.fillStyle = RD; g.fillRect(A.X(s.D) - 7, A.Y(0) - 14, 14, 14); g.fillStyle = INK; g.beginPath(); g.arc(A.X(r.x), A.Y(Math.max(0, r.y)), 8, 0, 7); g.fill();
      // graph 2: velocity components against time
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const tl = r.tFlight, vm = Math.ceil(s.v0 * 1.05), A2 = axes(g, w, h, {l: 58, r: 14, t: 10, b: 26}, 0, tl, -vm, vm, 't (s)', 'v (m/s)');
      g.strokeStyle = OR; g.lineWidth = 4; g.beginPath(); g.moveTo(A2.X(0), A2.Y(r.vx0)); g.lineTo(A2.X(r.fired ? Math.min(r.t, tl) : tl), A2.Y(r.vx0)); g.stroke();
      g.strokeStyle = TL; g.lineWidth = 4; g.beginPath(); g.moveTo(A2.X(0), A2.Y(r.vy0)); g.lineTo(A2.X(r.fired ? Math.min(r.t, tl) : tl), A2.Y(r.vy0 - G * (r.fired ? Math.min(r.t, tl) : tl))); g.stroke();
      g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = OR; g.fillText('vₓ = hằng số', 70, 28); g.fillStyle = TL; g.fillText('v_y = v₀sinα − g·t', 215, 28);
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

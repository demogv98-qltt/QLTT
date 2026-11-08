// M3 overlay: telemetry for the ball and the feather, v–t and y–t graphs, pump and release controls.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, G, fall, landTime} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4';
export const CSS = BASE + `canvas.gr{width:100%;height:128px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:78px 104px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M3 · RƠI TỰ DO</h1><p>ỐNG NEWTON · BƠM CHÂN KHÔNG · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU RƠI</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('t', 't', INK)}${row('bi y', 'by', TL)}${row('bi v', 'bv', TL)}${row('lông y', 'fy', OR)}${row('lông v', 'fv', OR)}${row('p', 'p', PU)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.55;font-size:12.5px"></div>
    <canvas class="gr" id="g1" width="680" height="256"></canvas><canvas class="gr" id="g2" width="680" height="256"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('H', 'h độ cao thả (m)', RANGE.H[0], RANGE.H[1], 0.1, OR)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="pre" id="b-air" style="margin:0;flex:1.6;text-align:center;font:700 13px Inter,sans-serif;border-color:${PU}">⏻ Hút chân không</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5" selected>×0,5</option><option value="1">×1</option></select></div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-go" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">⏏ Thả (ngắt nam châm)</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Lại</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] nam châm · cổng quang · bơm</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="bottom">2<br>ĐÁY ỐNG</button><button data-v="top">3<br>NAM CHÂM</button><button data-v="pump">4<br>BƠM</button></div>
    <div class="small">Chân không cần vài giây: chờ kim áp suất về 0 rồi mới thả. Quan sát các “ảnh” cách nhau 0,1 s.</div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  $('s-H').addEventListener('input', (e) => hooks.cmd('H', Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-air').addEventListener('click', () => hooks.air()); $('b-go').addEventListener('click', () => hooks.go()); $('b-reset').addEventListener('click', () => hooks.reset()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  function axes(g, w, h, m, x1, y1, xl, yl) {
    const X = (x) => m.l + (x / x1) * (w - m.l - m.r), Y = (y) => h - m.b - (y / y1) * (h - m.t - m.b);
    g.font = '20px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let i = 0; i <= 4; i++) { const x = (x1 * i) / 4; g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(Math.round(x * 100) / 100), X(x), h - 6); }
    g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = (y1 * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(x1), Y(0)); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    sliders(s) { const e = $('s-H'); if (document.activeElement !== e) e.value = s.H; $('sv-H').textContent = f(s.H, 1) + ' m'; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setAir(air, p) { const b = $('b-air'); b.textContent = air ? '⏻ Hút chân không' : '⏻ Cho khí vào'; b.classList.toggle('on', !air); },
    setGo(t) { $('b-go').textContent = t; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar) => { $('v' + id).innerHTML = txt; $('b' + id).style.width = Math.min(100, Math.abs(bar) * 100) + '%'; };
      const [bl, fe] = r.objs;
      set('t', `${f(r.t, 3)}<small>s</small>`, r.t / 1.6); set('by', `${f(bl.y, 3)}<small>m</small>`, bl.y / 2); set('bv', `${f(bl.v, 2)}<small>m/s</small>`, bl.v / 7); set('fy', `${f(fe.y, 3)}<small>m</small>`, fe.y / 2); set('fv', `${f(fe.v, 2)}<small>m/s</small>`, fe.v / 7); set('p', `${f(r.pKPa, 1)}<small>kPa</small>`, r.p);
      $('tag').innerHTML = !r.released ? (r.vacuum ? 'Ống <b>đã hút chân không</b>: sẵn sàng thả' : r.air ? 'Ống chứa <b>không khí</b>: sẵn sàng thả' : 'Đang hút khí… chờ kim áp suất về 0') : (bl.landed && fe.landed ? `Cả hai đã chạm đáy: bi ở t = <b>${f(bl.tLand, 3)}</b> s, lông ở t = <b>${f(fe.tLand, 3)}</b> s` : 'Đang rơi…');
      $('res').innerHTML = `Chân không lí thuyết: t = √(2h/g) = <b>${f(r.t0, 3)}</b> s · v = √(2gh) = <b>${f(r.v0, 2)}</b> m/s<br>` + (r.gExp !== null ? `g đo = 2h/t² = 2·${f(s.H, 1)}/${f(r.tMeasured, 3)}² = <b>${f(r.gExp, 2)}</b> m/s² ${Math.abs(r.gExp - G) < 0.15 ? '<span class="ok">✔ ≈ 9,8</span>' : '(có lực cản)'}` : 'Thả vật để đo g bằng đồng hồ của cổng quang.');
      const pr = s.pAtRelease ?? s.p, bs = [r.objs[0].b, r.objs[1].b], tl = Math.max(landTime(bs[0], s.H), landTime(bs[1], s.H)) * 1.05; // predicted curves from the pressure at release (or now)
      const pb = [r.released ? bs[0] : 0.02 * pr, r.released ? bs[1] : 6 * pr];
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const vmax = Math.ceil(r.v0 * 1.05), A = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, tl, vmax, 't (s)', 'v (m/s)');
      const curve = (b, T, col, wd, dash, key) => { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.beginPath(); for (let i = 0; i <= 80; i++) { const t = (T * i) / 80, v = fall(b, t)[key]; i ? g.lineTo(A.X(t), A.Y(Math.min(v, vmax))) : g.moveTo(A.X(t), A.Y(Math.min(v, vmax))); } g.stroke(); g.setLineDash([]); };
      curve(0, tl, 'rgba(20,48,60,.3)', 3, [8, 6], 'v'); curve(pb[1], tl, 'rgba(232,89,12,.35)', 3, null, 'v'); curve(pb[0], tl, 'rgba(11,143,140,.35)', 3, null, 'v');
      if (r.released) { curve(pb[1], Math.min(r.t, landTime(pb[1], s.H)), OR, 5, null, 'v'); curve(pb[0], Math.min(r.t, landTime(pb[0], s.H)), TL, 5, null, 'v'); }
      g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = TL; g.fillText('bi', 76, 28); g.fillStyle = OR; g.fillText('lông', 110, 28); g.fillStyle = 'rgba(20,48,60,.7)'; g.fillText('v = g·t (chân không)', 175, 28);
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const A2 = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, tl, s.H, 't (s)', 'y (m)');
      const curve2 = (b, T, col, wd, dash) => { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.beginPath(); for (let i = 0; i <= 80; i++) { const t = (T * i) / 80, y = Math.min(s.H, fall(b, t).y); i ? g.lineTo(A2.X(t), A2.Y(y)) : g.moveTo(A2.X(t), A2.Y(y)); } g.stroke(); g.setLineDash([]); };
      curve2(0, tl, 'rgba(20,48,60,.3)', 3, [8, 6]); curve2(pb[1], tl, 'rgba(232,89,12,.35)', 3); curve2(pb[0], tl, 'rgba(11,143,140,.35)', 3);
      if (r.released) { curve2(pb[1], Math.min(r.t, landTime(pb[1], s.H)), OR, 5); curve2(pb[0], Math.min(r.t, landTime(pb[0], s.H)), TL, 5); }
      g.fillStyle = INK; g.font = '700 17px monospace'; g.fillText('y = ½gt² (chân không): đường parabol', 76, 28);
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

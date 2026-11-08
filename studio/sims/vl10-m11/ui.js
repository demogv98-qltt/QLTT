// M11 overlay: momentum and kinetic energy before and after the collision, drawn straight from the collision model.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, T_MAX, readout} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:128px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 104px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M11 · ĐỘNG LƯỢNG &amp; VA CHẠM</h1><p>HAI XE TRÊN ĐỆM KHÔNG KHÍ · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU VA CHẠM</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('v₁', 'v1', TL)}${row('v₂', 'v2', OR)}${row('p₁', 'p1', TL)}${row('p₂', 'p2', OR)}${row('p', 'p', INK)}${row('Wđ', 'k', PU)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="256"></canvas><canvas class="gr" id="g2" width="680" height="256"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('m1', 'm₁ xe xanh (kg)', RANGE.m1[0], RANGE.m1[1], 0.5, TL)}${sl('v1', 'v₁ trước va chạm (m/s)', RANGE.v1[0], RANGE.v1[1], 0.5, TL)}${sl('m2', 'm₂ xe cam (kg)', RANGE.m2[0], RANGE.m2[1], 0.5, OR)}${sl('v2', 'v₂ trước va chạm (m/s)', RANGE.v2[0], RANGE.v2[1], 0.5, OR)}${sl('e', 'e hệ số phục hồi (0 = dính)', RANGE.e[0], RANGE.e[1], 0.05, PU)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-go" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">▶ Chạy</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH XE<small>[T] đệm · cảm biến tốc độ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="collision">2<br>CHỖ VA CHẠM</button><button data-v="follow">3<br>THEO XE</button><button data-v="top">4<br>TỪ TRÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['m1', 'm2', 'v1', 'v2', 'e']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-go').addEventListener('click', () => hooks.go()); $('b-reset').addEventListener('click', () => hooks.reset()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  function axes(g, w, h, m, y0, y1, xl, yl) {
    const X = (x) => m.l + (x / T_MAX) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    g.font = '19px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let x = 0; x <= T_MAX; x += 3) { g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(x), X(x), h - 6); }
    g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = y0 + ((y1 - y0) * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(T_MAX), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(T_MAX), Y(0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    sliders(s) { for (const k of ['m1', 'm2', 'v1', 'v2', 'e']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], k === 'e' ? 2 : 1) + (k[0] === 'm' ? ' kg' : k === 'e' ? '' : ' m/s'); } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setGo(t) { $('b-go').textContent = t; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH XE'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('v1', `${f(r.v1, 2)}<small>m/s</small>`, r.v1 / 8, r.v1 >= 0 ? TL : RD); set('v2', `${f(r.v2, 2)}<small>m/s</small>`, r.v2 / 8, r.v2 >= 0 ? OR : RD); set('p1', `${f(r.p1, 2)}<small>kg·m/s</small>`, r.p1 / 20); set('p2', `${f(r.p2, 2)}<small>kg·m/s</small>`, r.p2 / 20); set('p', `${f(r.p, 2)}<small>kg·m/s</small>`, r.p / 20); set('k', `${f(r.kNow, 2)}<small>J</small>`, r.kNow / 50);
      $('tag').innerHTML = !r.collides ? '<b style="color:#c0392b">Hai xe không va chạm</b> (cần v₁ > v₂)' : `${r.kind} · e = ${f(s.e, 2)} ${r.hit ? '· <b>đã va chạm</b>' : ''}`;
      $('res').innerHTML = `Trước: p = <b>${f(r.pBefore, 2)}</b> kg·m/s · Wđ = <b>${f(r.kBefore, 2)}</b> J<br>Sau: p = <b>${f(r.pAfter, 2)}</b> kg·m/s · Wđ = <b>${f(r.kAfter, 2)}</b> J<br>v₁′ = <b>${f(r.v1After, 2)}</b> m/s · v₂′ = <b>${f(r.v2After, 2)}</b> m/s · mất Wđ: <b>${f(r.kLost, 2)}</b> J ` + (Math.abs(r.pAfter - r.pBefore) < 1e-9 ? '<span class="ok">✔ p bảo toàn</span>' : '');
      const N = 160, pts = []; for (let i = 0; i <= N; i++) pts.push(readout({...s, t: (T_MAX * i) / N}));
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const pm = Math.max(2, ...pts.map((q) => Math.max(Math.abs(q.p1), Math.abs(q.p2), Math.abs(q.p)))) * 1.1, A = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, -pm, pm, 't (s)', 'p (kg·m/s)');
      const draw = (key, col, wd, upTo) => { g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); let first = true; pts.forEach((q) => { if (q.t > upTo + 1e-9) return; const x = A.X(q.t), y = A.Y(q[key]); first ? g.moveTo(x, y) : g.lineTo(x, y); first = false; }); g.stroke(); };
      for (const [k, col, wd] of [['p1', 'rgba(11,143,140,.3)', 3], ['p2', 'rgba(232,89,12,.3)', 3], ['p', 'rgba(20,48,60,.3)', 3]]) draw(k, col, wd, T_MAX); draw('p1', TL, 5, r.t); draw('p2', OR, 5, r.t); draw('p', INK, 6, r.t);
      g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = TL; g.fillText('p₁', 76, 28); g.fillStyle = OR; g.fillText('p₂', 112, 28); g.fillStyle = INK; g.fillText('p = p₁ + p₂ (đường đen: không đổi)', 150, 28);
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const km = Math.max(2, ...pts.map((q) => q.kNow)) * 1.15, A2 = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, 0, km, 't (s)', 'Wđ (J)');
      g.strokeStyle = 'rgba(111,60,196,.3)'; g.lineWidth = 3; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(A2.X(q.t), A2.Y(q.kNow)) : g.moveTo(A2.X(q.t), A2.Y(q.kNow)))); g.stroke();
      g.strokeStyle = PU; g.lineWidth = 6; g.beginPath(); let first = true; pts.forEach((q) => { if (q.t > r.t + 1e-9) return; first ? g.moveTo(A2.X(q.t), A2.Y(q.kNow)) : g.lineTo(A2.X(q.t), A2.Y(q.kNow)); first = false; }); g.stroke();
      g.fillStyle = INK; g.font = '700 17px monospace'; g.fillText('động năng tổng: giảm khi va chạm mất năng lượng', 76, 28);
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

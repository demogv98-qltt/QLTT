// M12 overlay: telemetry, F(ω) graph and a top-view diagram of the velocity and the centripetal acceleration.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {FMAX, PRESETS, R_DISC, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:150px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}canvas.sq{width:100%;height:210px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
const KEYS = ['m', 'r', 'w'];

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M12 · CHUYỂN ĐỘNG TRÒN ĐỀU</h1><p>BI QUAY TRÊN MÂM, DÂY NỐI CẢM BIẾN LỰC · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU CHUYỂN ĐỘNG</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('ω', 'w', PU)}${row('v', 'v', TL)}${row('a_ht', 'a', OR)}${row('F_ht', 'F', OR)}${row('T', 'T', INK)}${row('f', 'f', INK)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.5;font-size:12.3px"></div>
    <canvas class="sq" id="g2" width="680" height="420"></canvas><canvas class="gr" id="g1" width="680" height="300"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('m', 'm khối lượng bi (kg)', RANGE.m[0], RANGE.m[1], 0.05, TL)}${sl('r', 'r bán kính quỹ đạo (m)', RANGE.r[0], RANGE.r[1], 0.05, OR)}${sl('w', 'ω tốc độ góc (rad/s)', RANGE.w[0], RANGE.w[1], 0.1, PU)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-cut" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none;background:#c0392b;border-color:#c0392b">✂ Cắt dây</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH BÀN<small>[T] cảm biến lực · động cơ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="close">3<br>CẬN CẢNH</button><button data-v="wide">4<br>BAY XA</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of KEYS) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-cut').addEventListener('click', () => hooks.cut()); $('b-reset').addEventListener('click', () => hooks.reset()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const arrow = (g, x0, y0, x1, y1, col, wd) => { const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < 3) return; g.strokeStyle = g.fillStyle = col; g.lineWidth = wd; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - Math.cos(a) * 9, y1 - Math.sin(a) * 9); g.stroke(); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - Math.cos(a - 0.45) * 16, y1 - Math.sin(a - 0.45) * 16); g.lineTo(x1 - Math.cos(a + 0.45) * 16, y1 - Math.sin(a + 0.45) * 16); g.fill(); };
  const trailPts = [];
  return {
    root, setBottom(y) { B.bottom = y; },
    sliders(s) { for (const k of KEYS) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], k === 'w' ? 1 : k === 'm' ? 2 : 2) + (k === 'm' ? ' kg' : k === 'r' ? ' m' : ' rad/s'); } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setCut(on, broken) { const b = $('b-cut'); b.disabled = on; b.textContent = on ? (broken ? '✂ Dây đã đứt' : '✂ Đã cắt dây') : '✂ Cắt dây'; b.style.opacity = on ? 0.55 : 1; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH BÀN'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('w', `${f(r.w, 2)}<small>rad/s</small>`, r.w / 10); set('v', `${f(r.v, 2)}<small>m/s</small>`, r.v / 15); set('a', `${f(r.a, 1)}<small>m/s²</small>`, r.a / 150); set('F', `${f(r.F, 1)}<small>N</small>`, r.F / FMAX, r.F > FMAX ? RD : OR); set('T', `${f(r.T, 3)}<small>s</small>`, r.T / 12); set('f', `${f(r.f, 3)}<small>Hz</small>`, r.f / 1.6);
      $('tag').innerHTML = r.cut ? (r.broken ? '<b style="color:#c0392b">Dây đứt!</b> F_ht &gt; ' + FMAX + ' N · bi bay theo tiếp tuyến' : '<b style="color:#c0392b">Đã cắt dây</b> · bi bay thẳng theo tiếp tuyến') : `Dây chịu tối đa <b>${FMAX} N</b> · đang căng <b>${f(r.load * 100, 0)}%</b> · ω tới hạn = <b>${f(r.wCrit, 2)}</b> rad/s`;
      $('res').innerHTML = `v = ω·r = <b>${f(r.w, 2)}</b>·<b>${f(r.r, 2)}</b> = <b>${f(r.v, 2)}</b> m/s<br>a_ht = ω²r = v²/r = <b>${f(r.a, 2)}</b> m/s²<br>F_ht = m·a_ht = <b>${f(r.F, 2)}</b> N (lực căng dây, hướng vào tâm)<br>T = 2π/ω = <b>${f(r.T, 3)}</b> s · đã quay <b>${f(Math.max(0, r.turns), 2)}</b> vòng`;
      // top view diagram
      let c = $('g2'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + 4, S = (h / 2 - 28) / 1.7; // pixels per metre
      g.strokeStyle = '#c9d6de'; g.lineWidth = 2; g.fillStyle = INK; g.font = '17px monospace'; g.textAlign = 'center';
      for (const rr of [0.5, 1, 1.5]) { g.beginPath(); g.arc(cx, cy, rr * S, 0, 7); g.stroke(); }
      g.strokeStyle = '#a8b9c4'; g.setLineDash([6, 6]); g.beginPath(); g.arc(cx, cy, s.r * S, 0, 7); g.stroke(); g.setLineDash([]);
      const bx = cx + r.x * S, by = cy - r.y * S;
      if (!s.cut) { trailPts.length = 0; } else { trailPts.push([bx, by]); if (trailPts.length > 300) trailPts.shift(); }
      g.fillStyle = '#14303c'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
      if (!s.cut) { g.strokeStyle = '#14303c'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(bx, by); g.stroke(); }
      const k = Math.min(1, 62 / Math.max(r.speed * 6, 1));
      arrow(g, bx, by, bx + r.vx * 7 * k, by - r.vy * 7 * k, TL, 5);
      if (!s.cut) { const L = Math.hypot(r.x, r.y) || 1; arrow(g, bx, by, bx - (r.x / L) * Math.min(80, r.a * 1.3 + 14), by + (r.y / L) * Math.min(80, r.a * 1.3 + 14), OR, 5); }
      g.fillStyle = s.cut ? '#7d93a0' : INK; g.beginPath(); g.arc(Math.min(w - 12, Math.max(12, bx)), Math.min(h - 12, Math.max(12, by)), 11, 0, 7); g.fill();
      g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = TL; g.fillText('→ v (tiếp tuyến)', 10, 22); g.fillStyle = OR; g.fillText('→ a_ht, F_ht (vào tâm)', 10, 44); g.fillStyle = INK; g.textAlign = 'right'; g.fillText('nhìn từ trên xuống', w - 8, 22);
      // F(omega) graph
      c = $('g1'); g = c.getContext('2d'); w = c.width; h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 66, r: 16, t: 28, b: 28}, X = (x) => m.l + (x / 10) * (w - m.l - m.r), Ymax = 60, Y = (y) => h - m.b - (Math.min(y, Ymax) / Ymax) * (h - m.t - m.b);
      g.font = '17px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (let x = 0; x <= 10; x += 2) { g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(Ymax)); g.stroke(); g.fillText(String(x), X(x), h - 8); }
      g.textAlign = 'right'; for (let y = 0; y <= Ymax; y += 20) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(10), Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 6); }
      g.strokeStyle = RD; g.setLineDash([8, 6]); g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(0), Y(FMAX)); g.lineTo(X(10), Y(FMAX)); g.stroke(); g.setLineDash([]); g.fillStyle = RD; g.textAlign = 'left'; g.fillText('dây đứt: ' + FMAX + ' N', m.l + 8, Y(FMAX) - 6);
      g.strokeStyle = OR; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 10, y = s.m * s.r * x * x; i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(X(r.w), Y(r.F), 9, 0, 7); g.fill(); g.font = '700 17px monospace'; g.textAlign = 'right'; g.fillStyle = OR; g.fillText('F_ht = m·r·ω² (parabol)', w - 12, 20); g.fillStyle = INK; g.fillText('ω (rad/s)', w - 6, h - 32);
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

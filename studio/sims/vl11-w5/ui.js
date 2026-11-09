// W5 overlay: standing-wave numbers, the snapshot of the string (with the incident and reflected waves) and the resonance curve.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {ampMax, F_RANGE, fn, LMAX, LMIN, M_RANGE, PRESETS, shape} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', BL = '#2b59c3', GR = '#2c9a4b';
export const CSS = BASE + `canvas.gr{width:100%;height:196px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.fnb{display:flex;gap:4px;margin-bottom:8px}.fnb button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:5px 1px;font:700 11.5px 'JetBrains Mono',monospace;color:#14303c;cursor:pointer;line-height:1.3}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W5 · SÓNG DỪNG</h1><p>DÂY HAI ĐẦU CỐ ĐỊNH · NÚT, BỤNG, CỘNG HƯỞNG · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SÓNG DỪNG TRÊN DÂY</span><span>STANDING WAVE</span></div>
    <div class="blk" style="--c:${OR}">${row('f', 'f', OR)}${row('v sóng', 'v', PU)}${row('λ=v/f', 'lam', TL)}${row('2L/λ', 'n', RD)}${row('T=mg', 'T', INK)}${row('A bụng', 'a', GR)}</div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="392"></canvas><canvas class="gr" id="g2" width="680" height="392"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('f', 'f tần số máy rung (Hz)', F_RANGE[0], F_RANGE[1], 0.01, OR)}${sl('L', 'L chiều dài dây (m)', LMIN, LMAX, 0.05, TL)}${sl('mass', 'm quả nặng treo (g)', M_RANGE[0] * 1000, M_RANGE[1] * 1000, 10, PU)}
    <div style="font:700 12px Inter;margin:2px 0 4px">Đặt tần số bằng đúng cộng hưởng f<sub>n</sub> (kiểm tra đáp án):</div><div class="fnb" id="fnb">${[1, 2, 3, 4, 5].map((n) => `<button data-n="${n}">f<sub>${n}</sub></button>`).join('')}</div>
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-freeze" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">❚❚ Dừng hình</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.1">×0,1</option><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="sw"><button id="b-comp">Tách sóng tới – phản xạ</button><button id="b-nodes">Nút và bụng</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] máy rung · cầu đỡ · quả nặng</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="motor">2<br>MÁY RUNG</button><button data-v="bridge">3<br>CẦU ĐỠ</button><button data-v="side">4<br>NHÌN XIÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['f', 'L', 'mass']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#fnb button').forEach((b) => b.addEventListener('click', () => hooks.fn(Number(b.dataset.n))));
  $('b-freeze').addEventListener('click', () => hooks.freeze()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value))); $('b-comp').addEventListener('click', () => hooks.comp()); $('b-nodes').addEventListener('click', () => hooks.nodes());
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
      const vals = {f: s.f, L: s.L, mass: s.mass * 1000}, units = {f: ' Hz', L: ' m', mass: ' g'}, dig = {f: 2, L: 2, mass: 0};
      for (const k of Object.keys(vals)) { const e = $('s-' + k); if (document.activeElement !== e) e.value = vals[k]; $('sv-' + k).textContent = f(vals[k], dig[k]) + units[k]; }
      $('b-freeze').textContent = s.frozen ? '▶ Chạy tiếp' : '❚❚ Dừng hình'; $('b-comp').classList.toggle('on', s.showComp); $('b-nodes').classList.toggle('on', s.showNodes);
      root.querySelectorAll('#fnb button').forEach((b) => (b.title = f(fn(s, Number(b.dataset.n)), 2) + ' Hz'));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('f', `${f(r.f, 2)}<small>Hz</small>`, r.f / 12); set('v', `${f(r.v, 2)}<small>m/s</small>`, r.v / 8); set('lam', `${f(r.lam, 2)}<small>m</small>`, r.lam / 6); set('n', `${f(r.nReal, 2)}`, r.nReal / 8, r.near ? GR : RD); set('T', `${f(r.T, 2)}<small>N</small>`, r.T / 5); set('a', `${f(r.ampMax * 100, 1)}<small>cm</small>`, r.ampMax / 0.2, r.near ? GR : OR);
      $('res').innerHTML = r.near ? `<span class="ok">● CỘNG HƯỞNG bậc n = ${r.n}</span> · L = n·λ/2 = ${r.n}·${f(r.lam / 2, 2)} = <b>${f(r.n * r.lam / 2, 2)}</b> m<br>${r.n + 1} nút (kể cả 2 đầu) · ${r.n} bụng · biên độ bụng gấp <b>${f(r.gain, 0)}</b> lần biên độ máy rung` : `<span style="color:#d62839">Chưa cộng hưởng</span> · 2L/λ = ${f(r.nReal, 2)} chưa nguyên<br>biên độ bụng chỉ gấp <b>${f(r.gain, 1)}</b> lần biên độ máy rung`;
      // snapshot of the string
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 84, r: 16, t: 46, b: 42}, X = (x) => m.l + (x / s.L) * (w - m.l - m.r), YM = 24, Y = (cm) => m.t + (h - m.t - m.b) / 2 - (cm / YM) * ((h - m.t - m.b) / 2);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (let x = 0; x <= s.L + 1e-6; x += 0.25) { g.beginPath(); g.moveTo(X(x), m.t); g.lineTo(X(x), h - m.b); g.stroke(); if (Math.abs(x * 2 - Math.round(x * 2)) < 1e-6) g.fillText(f(x, 1), X(x), h - 12); }
      g.textAlign = 'right'; for (const y of [-20, -10, 0, 10, 20]) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
      const N = 240, env = [], inc = [], ref = [], tot = []; for (let i = 0; i <= N; i++) { const x = (i / N) * s.L, q = shape(s, x, r.t); env.push(q.amp * 100); inc.push(q.inc * 100); ref.push(q.ref * 100); tot.push(q.u * 100); }
      const line = (arr, col, wd, dash) => { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.beginPath(); arr.forEach((y, i) => (i ? g.lineTo(X((i / N) * s.L), Y(Math.max(-YM, Math.min(YM, y)))) : g.moveTo(X(0), Y(Math.max(-YM, Math.min(YM, y)))))); g.stroke(); g.setLineDash([]); };
      line(env, 'rgba(91,60,196,.55)', 2.5, [9, 7]); line(env.map((y) => -y), 'rgba(91,60,196,.55)', 2.5, [9, 7]);
      if (s.showComp) { line(inc, BL + 'cc', 3); line(ref, GR + 'cc', 3); }
      line(tot, OR, 5.5);
      if (s.showNodes) { for (const x of r.nodes) { g.fillStyle = RD; g.beginPath(); g.arc(X(x), Y(0), 8, 0, 7); g.fill(); } for (const x of r.anti) { g.fillStyle = GR; g.beginPath(); g.arc(X(x), Y(shape(s, x, r.t).u * 100), 8, 0, 7); g.fill(); } }
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('DÂY: li độ u (cm) theo x (m)', 8, 26); g.font = '700 19px monospace'; g.fillStyle = RD; g.textAlign = 'right'; g.fillText('● nút', w - 120, 26); g.fillStyle = GR; g.fillText('● bụng', w - 20, 26);
      if (s.showComp) { g.font = '700 19px monospace'; g.fillStyle = BL; g.textAlign = 'left'; g.fillText('sóng tới →', m.l + 6, h - 62); g.fillStyle = GR; g.fillText('sóng phản xạ ←', m.l + 190, h - 62); }
      // resonance curve
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); const FM = F_RANGE[1], AM = 22, PX = (ff) => m.l + ((ff - F_RANGE[0]) / (FM - F_RANGE[0])) * (w - m.l - m.r), PY = (a) => h - m.b - (Math.min(a, AM) / AM) * (h - m.t - m.b);
      g.font = '23px monospace'; g.strokeStyle = '#e2eaef'; g.lineWidth = 1.2; g.fillStyle = INK; g.textAlign = 'center'; for (let ff = 2; ff <= FM; ff += 2) { g.beginPath(); g.moveTo(PX(ff), m.t); g.lineTo(PX(ff), h - m.b); g.stroke(); g.fillText(String(ff), PX(ff), h - 12); }
      g.textAlign = 'right'; for (let a = 0; a <= 20; a += 10) { g.beginPath(); g.moveTo(m.l, PY(a)); g.lineTo(w - m.r, PY(a)); g.stroke(); g.fillText(String(a), m.l - 6, PY(a) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, PY(0)); g.lineTo(w - m.r, PY(0)); g.stroke();
      g.strokeStyle = PU; g.lineWidth = 4; g.beginPath(); for (let i = 0; i <= 500; i++) { const ff = F_RANGE[0] + (i / 500) * (FM - F_RANGE[0]), a = ampMax(s, ff) * 100; i ? g.lineTo(PX(ff), PY(a)) : g.moveTo(PX(ff), PY(a)); } g.stroke();
      for (let n = 1; n < 20; n++) { const ff = fn(s, n); if (ff > FM) break; g.strokeStyle = 'rgba(11,143,140,.5)'; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(PX(ff), m.t + 8); g.lineTo(PX(ff), h - m.b); g.stroke(); g.setLineDash([]); g.fillStyle = TL; g.font = '700 19px monospace'; g.textAlign = 'center'; g.fillText('f' + n, PX(ff), m.t + 4); }
      g.fillStyle = r.near ? GR : OR; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(PX(s.f), PY(r.ampMax * 100), 10, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('ĐƯỜNG CỘNG HƯỞNG: A bụng (cm) theo f (Hz)', 8, 26);
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

// M1 overlay: d–t graph with the distance s and a secant over a chosen window, v–t graph, controls.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {SCRIPTS, RANGE, T_MAX, DT_REC} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', NEG = '#c0392b', PU = '#5b3cc4';
export const CSS = BASE + `canvas.gr{width:100%;height:128px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:56px 112px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M1 · ĐỘ DỊCH CHUYỂN &amp; VẬN TỐC</h1><p>XE THỬ NGHIỆM · CẢM BIẾN VÒNG QUAY · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU CHUYỂN ĐỘNG</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('t', 't', INK)}${row('d', 'd', TL)}${row('s', 's', INK)}${row('v', 'v', TL)}${row('v_tb', 'vt', PU)}${row('s/t', 'tt', OR)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.55;font-size:12.5px"></div>
    <canvas class="gr" id="g1" width="680" height="256"></canvas><canvas class="gr" id="g2" width="680" height="256"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="w-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="tabs"><button id="tabS" class="on">Kịch bản có sẵn</button><button id="tabM">Tự lái xe</button></div>
    <div id="pM" style="display:none">${sl('v', 'v vận tốc lái xe (m/s)', RANGE.v[0], RANGE.v[1], 0.5, TL)}</div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-run" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">▶ Chạy</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Đặt lại</button></div>
    <div class="ptitle" style="margin-top:2px"><span>ĐO VẬN TỐC TRUNG BÌNH</span><span>t₁ → t₂</span></div>
    ${sl('t1', 't₁ (s)', RANGE.t1[0], RANGE.t1[1], 0.1, PU)}${sl('t2', 't₂ (s)', RANGE.t2[0], RANGE.t2[1], 0.1, PU)}
    <div class="ptitle" style="margin-top:2px"><span>KỊCH BẢN</span><span>PRESETS</span></div>
    ${SCRIPTS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH XE<small>[T] động cơ · pin · đĩa mã hoá</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="follow">1<br>THEO XE</button><button data-v="wide">2<br>TOÀN CẢNH</button><button data-v="top">3<br>TỪ TRÊN</button><button data-v="wheel">4<br>BÁNH XE</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['v', 't1', 't2']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-run').addEventListener('click', () => hooks.run()); $('b-reset').addEventListener('click', () => hooks.reset());
  $('tabS').addEventListener('click', () => hooks.mode('script')); $('tabM').addEventListener('click', () => hooks.mode('manual'));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  function axes(g, w, h, m, x1, y0, y1, xl, yl) {
    const X = (x) => m.l + (x / x1) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    g.font = '20px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let x = 0; x <= x1; x += x1 <= 12 ? 2 : 4) { g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(x), X(x), h - 6); }
    const sy = (y1 - y0) / 4; g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = y0 + i * sy; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(x1), Y(0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    setMode(m) { $('tabS').classList.toggle('on', m === 'script'); $('tabM').classList.toggle('on', m === 'manual'); $('pM').style.display = m === 'manual' ? '' : 'none'; },
    sliders(s) { for (const k of ['v', 't1', 't2']) { const e = $('s-' + (k)); const val = k === 'v' ? s.vman : s[k]; if (document.activeElement !== e) e.value = val; $('sv-' + k).textContent = f(val, 1) + (k === 'v' ? ' m/s' : ' s'); } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setRun(t) { $('b-run').textContent = t; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP XE' : 'TEARDOWN · BÓC TÁCH XE'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      // the graphs are drawn straight from the recorded path, so they are complete whatever the visitor jumped to
      const p = s.path, stride = Math.max(1, Math.floor(p.length / 400)), hist = {t: [], d: [], s: [], v: [], T: s.mode === 'script' ? SCRIPTS[s.script].T : T_MAX};
      let cum = 0; for (let i = 0; i < p.length; i++) { if (i) cum += Math.abs(p[i] - p[i - 1]); if (i % stride === 0 || i === p.length - 1) { hist.t.push(i * DT_REC); hist.d.push(p[i]); hist.s.push(cum); hist.v.push(i ? (p[i] - p[i - 1]) / DT_REC : (p.length > 1 ? (p[1] - p[0]) / DT_REC : 0)); } }
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('t', `${f(r.t, 2)}<small>s</small>`, r.t / T_MAX); set('d', `${f(r.d, 2)}<small>m</small>`, r.d / 100, r.d >= 0 ? TL : NEG); set('s', `${f(r.s, 2)}<small>m</small>`, r.s / 100); set('v', `${f(r.v, 2)}<small>m/s</small>`, r.v / 10, r.v >= 0 ? TL : NEG); set('vt', `${f(r.vAvg, 2)}<small>m/s</small>`, r.vAvg / 10, r.vAvg >= 0 ? PU : NEG); set('tt', `${f(r.speedAvg, 2)}<small>m/s</small>`, r.speedAvg / 10);
      $('tag').innerHTML = `Xe <b>${r.kind}</b> · d = ${f(r.d, 1)} m · s = ${f(r.s, 1)} m ${Math.abs(r.d) < r.s - 1e-6 ? '<b>(s > |d|: xe đã đổi chiều)</b>' : ''}`;
      $('res').innerHTML = `v_tb = d/t = <b>${f(r.vAvg, 2)}</b> m/s (có hướng) · tốc độ tb = s/t = <b>${f(r.speedAvg, 2)}</b> m/s<br>` + (r.win ? `Khoảng [${f(r.t1, 1)} ; ${f(r.t2, 1)}] s: Δd = ${f(r.dWin, 1)} m → v_tb = <b>${f(r.vWin, 2)}</b> m/s` : 'Chọn t₁ < t₂ (đã chạy tới t₂) để đo vận tốc trung bình.');
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const lim = Math.max(10, ...hist.d.map(Math.abs), ...hist.s), tE = hist.T, A = axes(g, w, h, {l: 66, r: 14, t: 10, b: 26}, tE, -lim * 0.0 - (hist.d.some((v) => v < 0) ? lim * 0.6 : 0), lim * 1.05, 't (s)', 'm');
      const line = (xs, ys, col, wd, dash) => { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(A.X(x), A.Y(ys[i])) : g.moveTo(A.X(x), A.Y(ys[i])))); g.stroke(); g.setLineDash([]); };
      line(hist.t, hist.s, 'rgba(20,48,60,.45)', 3, [8, 6]); line(hist.t, hist.d, TL, 5);
      if (r.win) { g.strokeStyle = PU; g.lineWidth = 4; g.beginPath(); g.moveTo(A.X(r.t1), A.Y(r.d1)); g.lineTo(A.X(r.t2), A.Y(r.d2)); g.stroke(); for (const [tt, dd] of [[r.t1, r.d1], [r.t2, r.d2]]) { g.fillStyle = PU; g.beginPath(); g.arc(A.X(tt), A.Y(dd), 8, 0, 7); g.fill(); } }
      g.fillStyle = TL; g.beginPath(); g.arc(A.X(r.t), A.Y(r.d), 8, 0, 7); g.fill(); g.font = '700 18px monospace'; g.textAlign = 'left'; g.fillStyle = TL; g.fillText('d–t', 76, 28); g.fillStyle = 'rgba(20,48,60,.7)'; g.fillText('s–t (nét đứt)', 130, 28);
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const A2 = axes(g, w, h, {l: 66, r: 14, t: 10, b: 26}, tE, -10, 10, 't (s)', 'v (m/s)');
      g.strokeStyle = TL; g.lineWidth = 5; g.beginPath(); hist.t.forEach((x, i) => (i ? g.lineTo(A2.X(x), A2.Y(hist.v[i])) : g.moveTo(A2.X(x), A2.Y(hist.v[i])))); g.stroke();
      g.font = '700 18px monospace'; g.fillStyle = INK; g.textAlign = 'left'; g.fillText('độ dốc d–t = v · diện tích v–t = d', 76, 28);
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

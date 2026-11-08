// M6 overlay: telemetry for either set-up, live graphs (v–t history and the a–F family of lines), controls.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, T_MAX, DT_C} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4';
export const CSS = BASE + `canvas.gr{width:100%;height:122px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:56px 112px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M6 · BA ĐỊNH LUẬT NEWTON</h1><p>XE QUẠT · HAI XE ĐẨY NHAU · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span id="lt">SỐ LIỆU</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}" id="rows"></div><div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res"></div>
    <canvas class="gr" id="g1" width="680" height="244"></canvas><canvas class="gr" id="g2" width="680" height="244"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="w-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="tabs"><button id="tabN2" class="on">Định luật 1–2: xe quạt</button><button id="tabN3">Định luật 3: hai xe</button></div>
    <div id="pN2">${sl('F', 'F lực đẩy của quạt (N)', RANGE.F[0], RANGE.F[1], 0.5, OR)}${sl('M', 'M khối lượng xe (kg)', RANGE.M[0], RANGE.M[1], 1, TL)}</div>
    <div id="pN3" style="display:none">${sl('F0', 'F lực lò xo đẩy (N)', RANGE.F0[0], RANGE.F0[1], 1, OR)}${sl('M1', 'M₁ xe xanh (kg)', RANGE.M1[0], RANGE.M1[1], 1, TL)}${sl('M2', 'M₂ xe cam (kg)', RANGE.M2[0], RANGE.M2[1], 1, OR)}</div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-run" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">▶ Chạy</button><button class="pre" id="b-fan" style="margin:0;width:auto;flex:1.3;text-align:center;font:700 13px Inter,sans-serif">⏻ Tắt quạt</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Lại</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH XE<small>[T] quạt · động cơ · pin · cảm biến lực</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="follow">1<br>THEO XE</button><button data-v="wide">2<br>TOÀN CẢNH</button><button data-v="top">3<br>TỪ TRÊN</button><button data-v="close">4<br>CẬN CẢNH</button></div>
    <div class="small">Kéo chuột để xoay · lăn chuột để zoom · [Cách] chạy/dừng. Bỏ qua ma sát (đệm khí).</div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['F', 'M', 'F0', 'M1', 'M2']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-run').addEventListener('click', () => hooks.run()); $('b-fan').addEventListener('click', () => hooks.fan()); $('b-reset').addEventListener('click', () => hooks.reset());
  $('tabN2').addEventListener('click', () => hooks.mode('N2')); $('tabN3').addEventListener('click', () => hooks.mode('N3'));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));

  function axes(g, w, h, m, x1, y0, y1, xl, yl) {
    const X = (x) => m.l + (x / x1) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    g.font = '20px monospace'; g.lineWidth = 1.5; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    const sx = x1 <= 2 ? 0.5 : x1 <= 12 ? 2 : 5; for (let x = 0; x <= x1 + 1e-9; x += sx) { g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(Math.round(x * 10) / 10), X(x), h - 6); }
    g.textAlign = 'right'; const sy = (y1 - y0) / 4; for (let i = 0; i <= 4; i++) { const y = y0 + i * sy; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(y0)); g.lineTo(X(x1), Y(y0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(y0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root,
    setBottom(y) { B.bottom = y; },
    setMode(m) { $('tabN2').classList.toggle('on', m === 'N2'); $('tabN3').classList.toggle('on', m === 'N3'); $('pN2').style.display = m === 'N2' ? '' : 'none'; $('pN3').style.display = m === 'N3' ? '' : 'none'; $('b-fan').style.display = m === 'N2' ? '' : 'none'; $('lt').textContent = m === 'N2' ? 'XE QUẠT · ĐL 1–2' : 'HAI XE · ĐL 3'; },
    sliders(s) { for (const k of ['F', 'M', 'F0', 'M1', 'M2']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], k === 'F' ? 1 : 0) + (k[0] === 'F' ? ' N' : ' kg'); } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setRun(txt) { $('b-run').textContent = txt; }, setFan(on) { $('b-fan').textContent = on ? '⏻ Tắt quạt' : '⏻ Bật quạt'; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP XE' : 'TEARDOWN · BÓC TÁCH XE'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s, hist) {
      const rows = $('rows'), set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      if (r.mode === 'N2') {
        if (rows.dataset.m !== 'N2') { rows.dataset.m = 'N2'; rows.innerHTML = row('F', 'F', OR) + row('M', 'M', TL) + row('a=F/M', 'a', PU) + row('v', 'v', TL) + row('x', 'x', INK) + row('t', 't', INK); }
        set('F', `${f(r.F, 2)}<small>N</small>`, r.F / 10); set('M', `${f(r.M, 0)}<small>kg</small>`, r.M / 10); set('a', `${f(r.a, 2)}<small>m/s²</small>`, r.a / 10); set('v', `${f(r.v, 2)}<small>m/s</small>`, r.v / 100); set('x', `${f(r.x, 1)}<small>m</small>`, r.x / 500); set('t', `${f(r.t, 2)}<small>s</small>`, r.t / T_MAX);
        $('tag').innerHTML = `Hợp lực = <b>${f(r.Fnet, 1)} N</b> → <b>${r.kind}</b>`;
        $('res').innerHTML = r.F > 0 ? `Định luật 2: a = F/M = ${f(r.F, 1)}/${f(r.M, 0)} = <b>${f(r.a, 2)}</b> m/s²<br>v = a·t = ${f(r.a, 2)}·${f(r.t, 2)} = <b>${f(r.a * r.t, 2)}</b> m/s ${Math.abs(r.a * r.t - r.v) < 1e-6 ? '<span class="ok">✔ khớp</span>' : '(đã tắt quạt trước đó)'}` : `Định luật 1: hợp lực = 0 → v giữ nguyên <b>${f(r.v, 2)}</b> m/s (thẳng đều)`;
        this.drawN2(s, r, hist);
      } else {
        if (rows.dataset.m !== 'N3') { rows.dataset.m = 'N3'; rows.innerHTML = row('F₁₂', 'f', OR) + row('M₁', 'm1', TL) + row('M₂', 'm2', OR) + row('v₁', 'v1', TL) + row('v₂', 'v2', OR) + row('t', 't', INK); }
        set('f', `${f(r.f, 1)}<small>N</small>`, r.f / 50); set('m1', `${f(r.M1, 0)}<small>kg</small>`, r.M1 / 5); set('m2', `${f(r.M2, 0)}<small>kg</small>`, r.M2 / 5); set('v1', `${f(r.v1, 2)}<small>m/s</small>`, r.v1 / 25, TL); set('v2', `${f(r.v2, 2)}<small>m/s</small>`, r.v2 / 25, OR); set('t', `${f(r.t, 2)}<small>s</small>`, r.t / T_MAX);
        $('tag').innerHTML = r.phase === 'ready' ? 'Bấm <b>Chạy</b> để lò xo đẩy hai xe ra' : r.phase === 'contact' ? 'Hai cảm biến lực đọc <b>bằng nhau</b>: lực – phản lực' : `Sau va chạm: xung F·Δt = <b>${f(r.impulse, 1)}</b> N·s mỗi xe`;
        $('res').innerHTML = `Lực lên xe 1: −${f(r.F0, 0)} N · lên xe 2: +${f(r.F0, 0)} N (Δt = ${f(DT_C, 1)} s)<br>a₁ = F/M₁ = ${f(r.F0 / r.M1, 1)} · a₂ = F/M₂ = ${f(r.F0 / r.M2, 1)} m/s²<br>p₁ = ${f(r.p1, 2)} · p₂ = ${f(r.p2, 2)} · tổng p = <b>${f(r.p, 2)}</b> kg·m/s`;
        this.drawN3(s, r, hist);
      }
    },
    drawN2(s, r, hist) {
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const vmax = Math.max(5, Math.ceil(Math.max(...hist.v, r.v, (r.Fcmd / r.M) * T_MAX) / 5) * 5), A1 = axes(g, w, h, {l: 66, r: 16, t: 10, b: 26}, T_MAX, 0, vmax, 't (s)', 'v (m/s)');
      g.strokeStyle = 'rgba(20,48,60,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(A1.X(0), A1.Y(0)); g.lineTo(A1.X(T_MAX), A1.Y((r.Fcmd / r.M) * T_MAX)); g.stroke();
      g.strokeStyle = TL; g.lineWidth = 5; g.beginPath(); hist.t.forEach((t, i) => (i ? g.lineTo(A1.X(t), A1.Y(hist.v[i])) : g.moveTo(A1.X(t), A1.Y(hist.v[i])))); g.stroke();
      g.fillStyle = TL; g.beginPath(); g.arc(A1.X(r.t), A1.Y(r.v), 8, 0, 7); g.fill();
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const A2 = axes(g, w, h, {l: 66, r: 16, t: 10, b: 26}, 10, 0, 10, 'F (N)', 'a (m/s²)');
      for (const [M, col] of [[1, 'rgba(11,143,140,.35)'], [2, 'rgba(232,89,12,.35)'], [4, 'rgba(91,60,196,.35)']]) { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(A2.X(0), A2.Y(0)); g.lineTo(A2.X(10), A2.Y(10 / M)); g.stroke(); g.fillStyle = col; g.font = '700 18px monospace'; g.textAlign = 'left'; g.fillText('M=' + M, A2.X(10) - 70, A2.Y(10 / M) - 6); }
      g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(A2.X(0), A2.Y(0)); g.lineTo(A2.X(10), A2.Y(10 / s.M)); g.stroke(); g.fillStyle = OR; g.beginPath(); g.arc(A2.X(r.Fcmd), A2.Y(r.Fcmd / s.M), 9, 0, 7); g.fill();
      g.fillStyle = INK; g.font = '700 20px monospace'; g.textAlign = 'left'; g.fillText('a tỉ lệ thuận F, tỉ lệ nghịch M', 74, h - 36);
    },
    drawN3(s, r, hist) {
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const A1 = axes(g, w, h, {l: 66, r: 16, t: 10, b: 26}, T_MAX, -(s.F0 * DT_C) / 1 - 1, (s.F0 * DT_C) / 1 + 1, 't (s)', 'v (m/s)');
      for (const [arr, col] of [[hist.v1, TL], [hist.v2, OR]]) { g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); hist.t3.forEach((t, i) => (i ? g.lineTo(A1.X(t), A1.Y(arr[i])) : g.moveTo(A1.X(t), A1.Y(arr[i])))); g.stroke(); }
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const pm = Math.max(1, s.F0 * DT_C) * 1.4, A2 = axes(g, w, h, {l: 66, r: 16, t: 10, b: 26}, T_MAX, -pm, pm, 't (s)', 'p (kg·m/s)');
      for (const [arr, col] of [[hist.p1, TL], [hist.p2, OR], [hist.p, INK]]) { g.strokeStyle = col; g.lineWidth = col === INK ? 6 : 4; g.beginPath(); hist.t3.forEach((t, i) => (i ? g.lineTo(A2.X(t), A2.Y(arr[i])) : g.moveTo(A2.X(t), A2.Y(arr[i])))); g.stroke(); }
      g.fillStyle = INK; g.font = '700 20px monospace'; g.textAlign = 'left'; g.fillText('p₁ + p₂ = 0 (đường đen)', 74, h - 36);
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

// W2 overlay: wave numbers, the snapshot (displacement and ring density) and the oscillation of the marked ring; for the intensity scene I(r) and the areas.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {A_RANGE, D0, F_RANGE, L, P_RANGE, PRESETS, R_RANGE, V_RANGE, dens, u, Iof} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', BL = '#2b59c3';
export const CSS = BASE + `canvas.gr{width:100%;height:196px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W2 · SÓNG NGANG, SÓNG DỌC</h1><p>LÒ XO SLINKY · NÉN – DÃN · CƯỜNG ĐỘ SÓNG · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span id="ptl">ĐẠI LƯỢNG CỦA SÓNG</span><span>WAVE</span></div>
    <div class="blk" style="--c:${OR}" id="blkW">${row('f', 'f', OR)}${row('T=1/f', 'T', INK)}${row('λ=v/f', 'lam', TL)}${row('v sóng', 'v', PU)}${row('vmax', 'vm', RD)}${row('Vòng', 'ring', BL)}</div>
    <div class="blk" style="--c:${TL};display:none" id="blkI">${row('P', 'P', OR)}${row('r₁', 'r1', TL)}${row('I₁', 'I1', TL)}${row('r₂=2r₁', 'r2', OR)}${row('I₂', 'I2', OR)}${row('I₁/I₂', 'ra', PU)}</div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="392"></canvas><canvas class="gr" id="g2" width="680" height="392"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="sw-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="sw" id="mdb"><button data-m="T">Sóng ngang</button><button data-m="L">Sóng dọc</button><button data-m="I">Cường độ</button></div>
    <div id="boxW">${sl('A', 'A biên độ (cm)', A_RANGE[0] * 100, A_RANGE[1] * 100, 1, RD)}${sl('f', 'f tần số (Hz)', F_RANGE[0], F_RANGE[1], 0.1, OR)}${sl('v', 'v tốc độ truyền (m/s)', V_RANGE[0], V_RANGE[1], 0.1, PU)}${sl('xP', 'Vòng khảo sát · vị trí x (m)', 0.15, 4.35, 0.075, BL)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-freeze" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">❚❚ Dừng hình</button><button class="pre" id="b-restart" style="margin:0;width:auto;flex:1;text-align:center;font:700 12.5px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div></div>
    <div id="boxI" style="display:none">${sl('P', 'P công suất nguồn (W)', P_RANGE[0], P_RANGE[1], 0.05, OR)}${sl('r', 'r₁ khoảng cách tới nguồn (m)', R_RANGE[0], R_RANGE[1], 0.05, TL)}</div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] tay kéo · đệm · loa</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="close">3<br>CẬN CẢNH</button><button data-v="hand">4<br>TAY KÉO</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['A', 'f', 'v', 'xP', 'P', 'r']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#mdb button').forEach((b) => b.addEventListener('click', () => hooks.mode(b.dataset.m)));
  $('b-freeze').addEventListener('click', () => hooks.freeze()); $('b-restart').addEventListener('click', () => hooks.restart()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
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
      const I = s.mode === 'I'; root.querySelectorAll('#mdb button').forEach((b) => b.classList.toggle('on', b.dataset.m === s.mode)); $('boxW').style.display = I ? 'none' : ''; $('boxI').style.display = I ? '' : 'none'; $('blkW').style.display = I ? 'none' : ''; $('blkI').style.display = I ? '' : 'none'; $('ptl').textContent = I ? 'CƯỜNG ĐỘ SÓNG' : 'ĐẠI LƯỢNG CỦA SÓNG';
      const vals = {A: r.A * 100, f: s.f, v: s.v, xP: r.xP, P: s.P, r: s.r}, units = {A: ' cm', f: ' Hz', v: ' m/s', xP: ' m', P: ' W', r: ' m'}, dig = {A: 0, f: 1, v: 1, xP: 2, P: 2, r: 2};
      for (const k of Object.keys(vals)) { const e = $('s-' + k); if (document.activeElement !== e) e.value = vals[k]; $('sv-' + k).textContent = f(vals[k], dig[k]) + units[k]; }
      $('s-A').max = s.mode === 'L' ? 3 : 10; $('b-freeze').textContent = s.frozen ? '▶ Chạy tiếp' : '❚❚ Dừng hình';
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      if (!I) {
        set('f', `${f(r.f, 1)}<small>Hz</small>`, r.f / 2.5); set('T', `${f(r.T, 2)}<small>s</small>`, r.T / 2); set('lam', `${f(r.lam, 2)}<small>m</small>`, r.lam / 6); set('v', `${f(r.v, 1)}<small>m/s</small>`, r.v / 3); set('vm', `${f(r.vmax, 2)}<small>m/s</small>`, r.vmax / 0.6); set('ring', `${f(r.uP * 100, 1)}<small>cm</small>`, Math.abs(r.uP) / 0.1, BL);
        $('res').innerHTML = s.mode === 'T' ? `Sóng <b>ngang</b>: vòng dao động theo phương <b>vuông góc</b> với phương truyền sóng<br>λ = v/f = <b>${f(r.v, 1)}</b>/<b>${f(r.f, 1)}</b> = <b>${f(r.lam, 2)}</b> m (khoảng cách hai đỉnh)` : `Sóng <b>dọc</b>: vòng dao động <b>dọc theo</b> phương truyền sóng<br>λ = <b>${f(r.lam, 2)}</b> m = khoảng cách hai vùng nén liên tiếp · mật độ tại vòng đang chọn: <b>${f(r.rho * 100, 0)}</b> %`;
      } else {
        set('P', `${f(r.P, 2)}<small>W</small>`, r.P / 2); set('r1', `${f(r.r, 2)}<small>m</small>`, r.r / 3); set('I1', `${f(r.I1 * 1000, 1)}<small>mW/m²</small>`, r.I1 / 0.35); set('r2', `${f(r.r2, 2)}<small>m</small>`, r.r2 / 6); set('I2', `${f(r.I2 * 1000, 1)}<small>mW/m²</small>`, r.I2 / 0.35); set('ra', `${f(r.ratio, 2)}`, r.ratio / 5);
        $('res').innerHTML = `I = P/S = P/(4πr²)<br>S₁ = <b>${f(r.S1, 2)}</b> m² · S₂ = <b>${f(r.S2, 2)}</b> m² (gấp <b>${f(r.S2 / r.S1, 0)}</b> lần)<br>Công suất qua mỗi mặt cầu: <b>${f(r.I1 * r.S1, 2)}</b> W = <b>${f(r.I2 * r.S2, 2)}</b> W`;
      }
      // graph 1
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 84, r: 16, t: 46, b: 40};
      if (!I) {
        const X = (x) => m.l + (x / L) * (w - m.l - m.r), YM = 11, Y = (cm) => m.t + (h - m.t - m.b) / 2 - (cm / YM) * ((h - m.t - m.b) / 2);
        g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center'; for (let x = 0; x <= L + 1e-6; x += 0.5) { g.beginPath(); g.moveTo(X(x), m.t); g.lineTo(X(x), h - m.b); g.stroke(); g.fillText(f(x, 1), X(x), h - 12); }
        g.textAlign = 'right'; for (const y of [-10, -5, 0, 5, 10]) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 6); }
        g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
        if (s.mode === 'L') { // density strip
          for (let i = 0; i < 300; i++) { const x = (i / 300) * L, d = dens(s, x, r.t), a = Math.min(0.55, Math.abs(d) * 2.2); g.fillStyle = d > 0 ? `rgba(214,40,57,${a})` : `rgba(43,89,195,${a})`; g.fillRect(X(x), m.t, X(L) / 300 + 1.5, h - m.t - m.b); }
        }
        g.strokeStyle = OR; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 300; i++) { const x = (i / 300) * L, y = u(s, x, r.t) * 100; i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.stroke();
        g.fillStyle = BL; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(r.xP), Y(r.uP * 100), 9, 0, 7); g.fill(); g.stroke();
        const pr = s.mode === 'L' ? r.nen : r.crest; if (pr.length >= 2) { const a = X(pr[0]), b = X(pr[1]), yy = Y(YM - 1.5); g.strokeStyle = TL; g.lineWidth = 3; g.beginPath(); g.moveTo(a, yy); g.lineTo(b, yy); g.moveTo(a, yy - 6); g.lineTo(a, yy + 6); g.moveTo(b, yy - 6); g.lineTo(b, yy + 6); g.stroke(); g.fillStyle = TL; g.font = '700 21px monospace'; g.textAlign = 'center'; g.fillText('λ = ' + f(r.lam, 2) + ' m', (a + b) / 2, yy - 9); }
        g.fillStyle = INK; g.font = '700 22px monospace'; g.textAlign = 'left'; g.fillText(s.mode === 'L' ? 'LI ĐỘ u (cm) · đỏ: nén, xanh: dãn' : 'LI ĐỘ u (cm) theo x (m)', 8, 26);
        // graph 2: the marked ring over time
        c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); const win = 2.2 * r.T, t0 = r.t - win, TX = (t) => m.l + ((t - t0) / win) * (w - m.l - m.r);
        g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'right'; for (const y of [-10, -5, 0, 5, 10]) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 6); }
        g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
        g.strokeStyle = BL; g.lineWidth = 5; g.beginPath(); let first = true; for (let i = 0; i <= 240; i++) { const t = t0 + (i / 240) * win; if (t < 0) continue; const y = u(s, r.xP, t) * 100; first ? g.moveTo(TX(t), Y(y)) : g.lineTo(TX(t), Y(y)); first = false; } g.stroke();
        g.fillStyle = BL; g.beginPath(); g.arc(TX(r.t), Y(r.uP * 100), 9, 0, 7); g.fill(); g.strokeStyle = PU; g.lineWidth = 3; const ty = Y(-YM + 1.5), ta = TX(r.t) - (r.T / win) * (w - m.l - m.r), tb = TX(r.t); g.beginPath(); g.moveTo(ta, ty); g.lineTo(tb, ty); g.moveTo(ta, ty - 6); g.lineTo(ta, ty + 6); g.moveTo(tb, ty - 6); g.lineTo(tb, ty + 6); g.stroke(); g.fillStyle = PU; g.font = '700 21px monospace'; g.textAlign = 'center'; g.fillText('T = ' + f(r.T, 2) + ' s', (ta + tb) / 2, ty - 8);
        g.fillStyle = INK; g.font = '700 22px monospace'; g.textAlign = 'left'; g.fillText('MỘT VÒNG (xanh): dao động tại chỗ', 8, 26); g.fillStyle = '#5b7080'; g.font = '20px monospace'; g.textAlign = 'right'; g.fillText('t (s) →', w - m.r, h - 12);
      } else {
        const X = (rr) => m.l + ((rr - 0.4) / 5.6) * (w - m.l - m.r), YM = 0.4, Y = (v) => h - m.b - (Math.min(v, YM) / YM) * (h - m.t - m.b);
        g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center'; for (let rr = 1; rr <= 6; rr++) { g.beginPath(); g.moveTo(X(rr), m.t); g.lineTo(X(rr), h - m.b); g.stroke(); g.fillText(String(rr), X(rr), h - 12); }
        g.textAlign = 'right'; for (const v of [0, 0.1, 0.2, 0.3, 0.4]) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(w - m.r, Y(v)); g.stroke(); g.fillText(f(v, 1), m.l - 6, Y(v) + 6); }
        g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
        g.strokeStyle = PU; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 300; i++) { const rr = 0.4 + (i / 300) * 5.6, v = Iof(s.P, rr); i ? g.lineTo(X(rr), Y(v)) : g.moveTo(X(rr), Y(v)); } g.stroke();
        for (const [rr, col] of [[r.r, TL], [r.r2, OR]]) { g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(rr), Y(Iof(s.P, rr)), 10, 0, 7); g.fill(); g.stroke(); }
        g.fillStyle = INK; g.font = '700 22px monospace'; g.textAlign = 'left'; g.fillText('I (W/m²) theo r (m): I = P/(4πr²)', 8, 26);
        c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); const bars = [['S₁', r.S1, TL, 'm²'], ['S₂', r.S2, OR, 'm²'], ['I₁', r.I1 * 100, TL, '×10⁻² W/m²'], ['I₂', r.I2 * 100, OR, '×10⁻² W/m²']];
        g.fillStyle = INK; g.font = '700 22px monospace'; g.textAlign = 'left'; g.fillText('CÙNG CÔNG SUẤT, DIỆN TÍCH LỚN HƠN → I NHỎ HƠN', 8, 26); bars.forEach(([k, v, col, u2], i) => { const y = 54 + i * 82, mx = i < 2 ? 120 : 6, bw = Math.min(1, v / mx) * (w - 330); g.fillStyle = INK; g.font = '700 24px monospace'; g.textAlign = 'right'; g.fillText(k, 66, y + 34); g.fillStyle = col; g.fillRect(80, y, Math.max(3, bw), 50); g.fillStyle = INK; g.font = '20px monospace'; g.textAlign = 'left'; g.fillText(f(v, 2) + ' ' + u2, 90 + bw, y + 33); });
      }
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

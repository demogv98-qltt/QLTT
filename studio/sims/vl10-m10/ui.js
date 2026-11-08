// M10 overlay: energy bars and graphs for the pendulum; work, power and efficiency for the winch.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE, G, D2R, H_MAX} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:112px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:58px 104px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M10 · CÔNG, CƠ NĂNG, CÔNG SUẤT</h1><p>CON LẮC ĐƠN · TỜI ĐIỆN · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span id="lt">NĂNG LƯỢNG</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}" id="rows"></div><div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div><div class="res" id="res" style="line-height:1.55;font-size:12.5px"></div>
    <canvas class="gr" id="g1" width="680" height="224"></canvas><canvas class="gr" id="g2" width="680" height="224"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="w-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="tabs"><button id="tabE" class="on">Con lắc · cơ năng</button><button id="tabW">Tời · công suất</button></div>
    <div id="pE">${sl('m', 'm khối lượng quả nặng (kg)', RANGE.m[0], RANGE.m[1], 0.5, TL)}${sl('L', 'ℓ chiều dài dây (m)', RANGE.L[0], RANGE.L[1], 0.1, INK)}${sl('th0', 'α₀ góc thả (độ)', RANGE.th0[0], RANGE.th0[1], 1, OR)}${sl('b', 'b lực cản không khí', RANGE.b[0], RANGE.b[1], 0.05, RD)}</div>
    <div id="pW" style="display:none">${sl('mw', 'm khối lượng tải (kg)', RANGE.mw[0], RANGE.mw[1], 2, TL)}${sl('P', 'P công suất điện (W)', RANGE.P[0], RANGE.P[1], 10, OR)}${sl('eta', 'η hiệu suất tời', RANGE.eta[0], RANGE.eta[1], 0.05, PU)}</div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-go" style="margin:0;height:42px;font-size:15px;flex:2;box-shadow:none">▶ Thả</button><button class="pre" id="b-reset" style="margin:0;width:auto;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Đặt lại</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] cổng quang · hộp số · động cơ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="side">2<br>NHÌN NGANG</button><button data-v="detail">3<br>CHI TIẾT</button><button data-v="ruler">4<br>THƯỚC</button></div>
    <div class="small">Kéo chuột để xoay · lăn chuột để zoom · [Cách] thả/chạy. Lấy mốc thế năng tại vị trí thấp nhất (con lắc) hoặc mặt đất (tời).</div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['m', 'L', 'th0', 'b', 'mw', 'P', 'eta']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-go').addEventListener('click', () => hooks.go()); $('b-reset').addEventListener('click', () => hooks.reset());
  $('tabE').addEventListener('click', () => hooks.mode('E')); $('tabW').addEventListener('click', () => hooks.mode('W'));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  function axes(g, w, h, m, x1, y0, y1, xl, yl, xs = 5) {
    const X = (x) => m.l + ((x) / x1) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    g.font = '19px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let i = 0; i <= xs; i++) { const x = (x1 * i) / xs; g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(Math.round(x * 10) / 10), X(x), h - 6); }
    g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = y0 + ((y1 - y0) * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 10) / 10), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(y0)); g.lineTo(X(x1), Y(y0)); g.moveTo(X(0), Y(y0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(y0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  const line = (g, A, xs, ys, col, w = 4) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(A.X(x), A.Y(ys[i])) : g.moveTo(A.X(x), A.Y(ys[i])))); g.stroke(); };
  return {
    root, setBottom(y) { B.bottom = y; },
    setMode(m) { $('tabE').classList.toggle('on', m === 'E'); $('tabW').classList.toggle('on', m === 'W'); $('pE').style.display = m === 'E' ? '' : 'none'; $('pW').style.display = m === 'W' ? '' : 'none'; $('lt').textContent = m === 'E' ? 'CƠ NĂNG · CON LẮC' : 'CÔNG · TỜI ĐIỆN'; $('rows').dataset.m = ''; },
    sliders(s) { for (const k of ['m', 'L', 'th0', 'b', 'mw', 'P', 'eta']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = k === 'eta' ? Math.round(s[k] * 100) + '%' : f(s[k], k === 'b' || k === 'L' || k === 'm' ? (k === 'b' ? 2 : 1) : 0) + (k === 'm' || k === 'mw' ? ' kg' : k === 'L' ? ' m' : k === 'th0' ? '°' : k === 'P' ? ' W' : ''); } },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setGo(txt) { $('b-go').textContent = txt; },
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s, hist) {
      const rows = $('rows'), set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      if (r.mode === 'E') {
        if (rows.dataset.m !== 'E') { rows.dataset.m = 'E'; rows.innerHTML = row('Wt', 't', OR) + row('Wđ', 'd', TL) + row('W', 'w', INK) + row('h', 'h', INK) + row('v', 'v', TL) + row('mất', 'l', RD); }
        const W0 = Math.max(0.01, r.W0);
        set('t', `${f(r.Wt, 2)}<small>J</small>`, r.Wt / W0); set('d', `${f(r.Wd, 2)}<small>J</small>`, r.Wd / W0); set('w', `${f(r.W, 2)}<small>J</small>`, r.W / W0); set('h', `${f(r.h, 3)}<small>m</small>`, r.h / 1.5); set('v', `${f(Math.abs(r.v), 2)}<small>m/s</small>`, Math.abs(r.v) / 6); set('l', `${f(r.lost, 2)}<small>J</small>`, r.lost / W0);
        $('tag').innerHTML = r.b === 0 ? 'Không có lực cản: <b>cơ năng bảo toàn</b>' : `Có lực cản b = ${f(r.b, 2)}: cơ năng <b>giảm dần</b>`;
        $('res').innerHTML = `W₀ = mgℓ(1 − cosα₀) = <b>${f(r.W0, 2)}</b> J<br>Wđ + Wt = <b>${f(r.W, 2)}</b> J ${r.b === 0 ? (Math.abs(r.W - r.W0) < 0.01 * r.W0 + 1e-6 ? '<span class="ok">✔ không đổi</span>' : '') : ''}<br>v tại điểm thấp nhất: lý thuyết √(2gh₀) = <b>${f(r.vIdeal, 2)}</b> m/s · đo (cổng quang) = <b>${r.vGate === null ? '—' : f(r.vGate, 2)}</b> m/s`;
        // graph 1: energy against time
        let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
        const A = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, 10, 0, Math.ceil(W0 * 1.1), 't (s)', 'năng lượng (J)'); line(g, A, hist.t, hist.Wt, OR); line(g, A, hist.t, hist.Wd, TL); line(g, A, hist.t, hist.W, INK, 5);
        g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = OR; g.fillText('Wt', 80, 28); g.fillStyle = TL; g.fillText('Wđ', 120, 28); g.fillStyle = INK; g.fillText('W', 168, 28);
        // graph 2: the energy diagram Wt(α) with the total W line
        c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
        const A2 = axes(g, w, h, {l: 62, r: 14, t: 10, b: 26}, 80, 0, Math.ceil(s.m * G * s.L * (1 - Math.cos(80 * D2R)) * 1.05), '|α| (độ)', 'J', 4);
        g.strokeStyle = OR; g.lineWidth = 4; g.beginPath(); for (let a = 0; a <= 80; a += 2) { const y = s.m * G * s.L * (1 - Math.cos(a * D2R)); a ? g.lineTo(A2.X(a), A2.Y(y)) : g.moveTo(A2.X(a), A2.Y(y)); } g.stroke();
        g.strokeStyle = INK; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(A2.X(0), A2.Y(r.W)); g.lineTo(A2.X(80), A2.Y(r.W)); g.stroke(); g.setLineDash([]);
        const ang = Math.abs(r.th) / D2R; g.fillStyle = OR; g.beginPath(); g.arc(A2.X(Math.min(80, ang)), A2.Y(r.Wt), 9, 0, 7); g.fill(); g.fillStyle = TL; g.beginPath(); g.arc(A2.X(Math.min(80, ang)), A2.Y(r.Wt + r.Wd), 7, 0, 7); g.fill();
        g.fillStyle = INK; g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillText('Wt(α) cam · W nét đứt · Wđ = W − Wt', 70, h - 36);
      } else {
        if (rows.dataset.m !== 'W') { rows.dataset.m = 'W'; rows.innerHTML = row('P', 'P', OR) + row('η', 'e', PU) + row('v', 'v', TL) + row('h', 'h', INK) + row('Aích', 'a', TL) + row('Atp', 'b', OR); }
        set('P', `${f(r.P, 0)}<small>W</small>`, r.P / 500); set('e', `${f(r.eta * 100, 0)}<small>%</small>`, r.eta); set('v', `${f(r.v, 2)}<small>m/s</small>`, r.v / 4); set('h', `${f(r.h, 2)}<small>m</small>`, r.h / H_MAX); set('a', `${f(r.Ai, 0)}<small>J</small>`, r.Ai / 600); set('b', `${f(r.Atp, 0)}<small>J</small>`, r.Atp / 600);
        $('tag').innerHTML = r.running ? `Tời đang nâng · công suất có ích <b>${f(r.Pic, 0)} W</b>` : r.done ? `Đã tới ${H_MAX} m sau <b>${f(r.t, 2)} s</b>` : 'Bấm <b>Chạy</b> để tời nâng tải';
        $('res').innerHTML = `v = η·P/(m·g) = ${f(r.eta, 2)}·${f(r.P, 0)}/(${f(r.m, 0)}·${f(G, 1)}) = <b>${f(r.v, 2)}</b> m/s<br>A_ích = m·g·h = <b>${f(r.Ai, 1)}</b> J · A_tp = P·t = <b>${f(r.Atp, 1)}</b> J<br>H = A_ích/A_tp = <b>${f(r.H * 100, 1)}</b>% · hao phí (nhiệt) = <b>${f(r.loss, 1)}</b> J`;
        let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
        const tmax = Math.max(2, r.tReach * 1.1), amax = Math.max(100, r.P * tmax), A = axes(g, w, h, {l: 66, r: 14, t: 10, b: 26}, tmax, 0, amax, 't (s)', 'công (J)');
        g.strokeStyle = OR; g.lineWidth = 3.5; g.beginPath(); g.moveTo(A.X(0), A.Y(0)); g.lineTo(A.X(tmax), A.Y(r.P * tmax)); g.stroke(); g.strokeStyle = TL; g.beginPath(); g.moveTo(A.X(0), A.Y(0)); g.lineTo(A.X(tmax), A.Y(r.eta * r.P * tmax)); g.stroke();
        g.fillStyle = OR; g.beginPath(); g.arc(A.X(Math.min(tmax, r.t)), A.Y(r.Atp), 9, 0, 7); g.fill(); g.fillStyle = TL; g.beginPath(); g.arc(A.X(Math.min(tmax, r.t)), A.Y(r.Ai), 9, 0, 7); g.fill();
        g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = OR; g.fillText('A_tp = P·t', 80, 28); g.fillStyle = TL; g.fillText('A_ích = η·P·t', 220, 28);
        c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
        const tot = Math.max(1, r.Atp), bw = 120, base = h - 30, sc2 = (h - 60) / tot; const bar = (x, v, col, lab) => { g.fillStyle = col; g.fillRect(x, base - v * sc2, bw, v * sc2); g.fillStyle = INK; g.font = '700 17px monospace'; g.textAlign = 'center'; g.fillText(lab, x + bw / 2, base + 20); g.fillText(f(v, 0), x + bw / 2, base - v * sc2 - 6); };
        bar(60, r.Atp, OR, 'A_tp'); bar(260, r.Ai, TL, 'A_ích'); bar(460, r.loss, RD, 'hao phí');
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

// W4 overlay: numbers at the probe M, the oscillation of M over time, and the amplitude along the horizontal line through M.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {A_RANGE, F_RANGE, PRESETS, TANK, V_RANGE, ampRatio, u, comp} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', BL = '#2b59c3', GR = '#2c9a4b';
export const CSS = BASE + `canvas.gr{width:100%;height:196px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W4 · GIAO THOA SÓNG</h1><p>KHAY SÓNG HAI NGUỒN KẾT HỢP · CỰC ĐẠI, CỰC TIỂU · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>ĐIỂM KHẢO SÁT M</span><span>PROBE</span></div>
    <div class="blk" style="--c:${RD}">${row('λ=v/f', 'lam', TL)}${row('a/λ', 'al', OR)}${row('d₁', 'd1', TL)}${row('d₂', 'd2', OR)}${row('Δd/λ', 'dl', PU)}${row('A(M)', 'am', GR)}</div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="392"></canvas><canvas class="gr" id="g2" width="680" height="392"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('f', 'f tần số (Hz)', F_RANGE[0], F_RANGE[1], 0.1, OR)}${sl('v', 'v tốc độ sóng (m/s)', V_RANGE[0], V_RANGE[1], 0.01, PU)}${sl('a', 'a khoảng cách hai nguồn (cm)', A_RANGE[0] * 100, A_RANGE[1] * 100, 1, TL)}${sl('xM', 'M · vị trí x (cm)', -TANK.X * 100 + 5, TANK.X * 100 - 5, 1, RD)}${sl('zM', 'M · vị trí z (cm)', -TANK.Z * 100 + 5, TANK.Z * 100 - 5, 1, RD)}
    <div class="sw" id="phs"><button data-p="0">Hai nguồn cùng pha</button><button data-p="1">Ngược pha</button></div>
    <div class="sw"><button id="b-lines">Đường cực đại – cực tiểu</button><button id="b-amp">Xem biên độ</button></div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-freeze" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">❚❚ Dừng hình</button><button class="pre" id="b-restart" style="margin:0;width:auto;flex:1;text-align:center;font:700 12.5px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] động cơ · lệch tâm · khay kính</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="probe">3<br>ĐIỂM M</button><button data-v="dippers">4<br>CẦN RUNG</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['f', 'v', 'a', 'xM', 'zM']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#phs button').forEach((b) => b.addEventListener('click', () => hooks.phase(b.dataset.p === '1')));
  $('b-lines').addEventListener('click', () => hooks.lines()); $('b-amp').addEventListener('click', () => hooks.amp());
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
      const vals = {f: s.f, v: s.v, a: s.a * 100, xM: s.xM * 100, zM: s.zM * 100}, units = {f: ' Hz', v: ' m/s', a: ' cm', xM: ' cm', zM: ' cm'}, dig = {f: 1, v: 2, a: 0, xM: 0, zM: 0};
      for (const k of Object.keys(vals)) { const e = $('s-' + k); if (document.activeElement !== e) e.value = vals[k]; $('sv-' + k).textContent = f(vals[k], dig[k]) + units[k]; }
      $('b-freeze').textContent = s.frozen ? '▶ Chạy tiếp' : '❚❚ Dừng hình'; $('b-lines').classList.toggle('on', s.lines); $('b-amp').classList.toggle('on', s.ampMode);
      root.querySelectorAll('#phs button').forEach((b) => b.classList.toggle('on', (b.dataset.p === '1') === s.opp));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('lam', `${f(r.lam * 100, 1)}<small>cm</small>`, r.lam / 0.2); set('al', `${f(r.aOverLam, 2)}`, r.aOverLam / 10); set('d1', `${f(r.r1 * 100, 1)}<small>cm</small>`, r.r1 / 1.2); set('d2', `${f(r.r2 * 100, 1)}<small>cm</small>`, r.r2 / 1.2); set('dl', `${f(r.ddLam, 2)}<small>λ</small>`, Math.abs(r.ddLam) / 6, r.kind === 'max' ? GR : r.kind === 'min' ? RD : PU); set('am', `${f(2 * r.ratio, 2)}<small>×A</small>`, r.ratio, r.kind === 'max' ? GR : r.kind === 'min' ? RD : OR);
      const kindTxt = r.kind === 'max' ? `<span class="ok">● CỰC ĐẠI</span> (Δd = ${f(r.q + (s.opp ? 0.5 : 0), 0)}λ${s.opp ? ' + λ/2' : ''}) · hai sóng cùng pha` : r.kind === 'min' ? `<span style="color:#d62839">● CỰC TIỂU</span> (Δd = (k + ½)λ${s.opp ? ' + λ/2' : ''}) · hai sóng ngược pha, triệt tiêu` : `Điểm trung gian · biên độ ${f(2 * r.ratio, 2)}A`;
      $('res').innerHTML = `Δd = d₂ − d₁ = <b>${f(r.dd * 100, 1)}</b> cm = <b>${f(r.ddLam, 2)}</b> λ<br>${kindTxt}<br>Trên đoạn nối hai nguồn: <b>${r.nMax}</b> cực đại, <b>${r.nMin}</b> cực tiểu`;
      // u(t) at M
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 84, r: 16, t: 46, b: 40}, win = 2.2 * r.T, t0 = r.t - win, TX = (t) => m.l + ((t - t0) / win) * (w - m.l - m.r), Y = (v) => m.t + (h - m.t - m.b) / 2 - (v / 2.3) * ((h - m.t - m.b) / 2);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'right'; for (const y of [-2, -1, 0, 1, 2]) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
      const trace = (fn, col, wd) => { g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); let first = true; for (let i = 0; i <= 240; i++) { const t = t0 + (i / 240) * win; if (t < 0) continue; const y = fn(t); first ? g.moveTo(TX(t), Y(y)) : g.lineTo(TX(t), Y(y)); first = false; } g.stroke(); };
      trace((t) => comp(s, s.xM, s.zM, t, 0), TL + 'aa', 2.5); trace((t) => comp(s, s.xM, s.zM, t, 1), OR + 'aa', 2.5); trace((t) => u(s, s.xM, s.zM, t), PU, 5.5);
      g.fillStyle = PU; g.beginPath(); g.arc(TX(r.t), Y(r.uM), 8, 0, 7); g.fill(); g.strokeStyle = INK; g.setLineDash([6, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(TX(r.t), m.t); g.lineTo(TX(r.t), h - m.b); g.stroke(); g.setLineDash([]);
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('DAO ĐỘNG TẠI M', 8, 26); g.font = '700 19px monospace'; g.fillStyle = TL; g.textAlign = 'right'; g.fillText('S₁', w - 250, 26); g.fillStyle = OR; g.fillText('S₂', w - 200, 26); g.fillStyle = PU; g.fillText('tổng', w - 100, 26); g.fillStyle = '#5b7080'; g.font = '21px monospace'; g.fillText('t (s) →', w - m.r, h - 12);
      // amplitude along the horizontal line through M
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); const XX = (x) => m.l + ((x + TANK.X) / (2 * TANK.X)) * (w - m.l - m.r), YA = (v) => h - m.b - v * (h - m.t - m.b);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center'; for (let x = -0.8; x <= 0.81; x += 0.4) { g.beginPath(); g.moveTo(XX(x), m.t); g.lineTo(XX(x), h - m.b); g.stroke(); g.fillText(f(x * 100, 0), XX(x), h - 12); }
      g.textAlign = 'right'; for (const v of [0, 0.5, 1]) { g.beginPath(); g.moveTo(m.l, YA(v)); g.lineTo(w - m.r, YA(v)); g.stroke(); g.fillText(f(v * 2, 0) + 'A', m.l - 6, YA(v) + 6); }
      g.strokeStyle = GR; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 400; i++) { const x = -TANK.X + (i / 400) * 2 * TANK.X, y = ampRatio(s, x, s.zM); i ? g.lineTo(XX(x), YA(y)) : g.moveTo(XX(x), YA(y)); } g.stroke();
      for (const sx of [-s.a / 2, s.a / 2]) { if (Math.abs(s.zM) < 0.02) { g.fillStyle = INK; g.fillRect(XX(sx) - 3, m.t, 6, h - m.t - m.b); } }
      g.fillStyle = RD; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(XX(s.xM), YA(r.ratio), 10, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('BIÊN ĐỘ dọc đường z = ' + f(s.zM * 100, 0) + ' cm', 8, 26); g.fillStyle = '#5b7080'; g.font = '21px monospace'; g.textAlign = 'right'; g.fillText('x (cm) →', w - m.r, h - 12);
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

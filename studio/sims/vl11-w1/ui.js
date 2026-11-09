// W1 overlay: wave numbers, the snapshot graph u(x) and the time graph u(t) of the two marked points.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {A_RANGE, F_RANGE, L, PRESETS, V_RANGE, readout, u} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', BL = '#2b59c3';
export const CSS = BASE + `canvas.gr{width:100%;height:168px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W1 · MÔ TẢ SÓNG</h1><p>SÓNG TRÊN DÂY · BIÊN ĐỘ, CHU KÌ, BƯỚC SÓNG, TỐC ĐỘ · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>ĐẠI LƯỢNG CỦA SÓNG</span><span>WAVE</span></div>
    <div class="blk" style="--c:${OR}">${row('f', 'f', OR)}${row('T=1/f', 'T', INK)}${row('λ=v/f', 'lam', TL)}${row('v sóng', 'v', PU)}${row('vmax', 'vm', RD)}${row('Δφ', 'dp', BL)}</div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="336"></canvas><canvas class="gr" id="g2" width="680" height="336"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('A', 'A biên độ (cm)', A_RANGE[0] * 100, A_RANGE[1] * 100, 1, RD)}${sl('f', 'f tần số (Hz)', F_RANGE[0], F_RANGE[1], 0.1, OR)}${sl('v', 'v tốc độ truyền (m/s)', V_RANGE[0], V_RANGE[1], 0.1, PU)}${sl('xP', 'Điểm P · vị trí x (m)', 0, L, 0.05, RD)}${sl('xQ', 'Điểm Q · vị trí x (m)', 0, L, 0.05, BL)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-freeze" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">❚❚ Dừng hình</button><button class="pre" id="b-restart" style="margin:0;width:auto;flex:1;text-align:center;font:700 12.5px Inter,sans-serif">↺ Lại</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH MÁY RUNG<small>[T] tay quay · thanh trượt · bộ giảm chấn</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="motor">2<br>MÁY RUNG</button><button data-v="ruler">3<br>ĐO λ</button><button data-v="top">4<br>TỪ TRÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['A', 'f', 'v', 'xP', 'xQ']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  $('b-freeze').addEventListener('click', () => hooks.freeze()); $('b-restart').addEventListener('click', () => hooks.restart()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH MÁY RUNG'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const vals = {A: s.A * 100, f: s.f, v: s.v, xP: s.xP, xQ: s.xQ}, units = {A: ' cm', f: ' Hz', v: ' m/s', xP: ' m', xQ: ' m'}, dig = {A: 0, f: 1, v: 1, xP: 2, xQ: 2};
      for (const k of Object.keys(vals)) { const e = $('s-' + k); if (document.activeElement !== e) e.value = vals[k]; $('sv-' + k).textContent = f(vals[k], dig[k]) + units[k]; }
      $('b-freeze').textContent = s.frozen ? '▶ Chạy tiếp' : '❚❚ Dừng hình';
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('f', `${f(r.f, 1)}<small>Hz</small>`, r.f / 2.5); set('T', `${f(r.T, 2)}<small>s</small>`, r.T / 2); set('lam', `${f(r.lam, 2)}<small>m</small>`, r.lam / 6); set('v', `${f(r.v, 1)}<small>m/s</small>`, r.v / 3); set('vm', `${f(r.vmax, 2)}<small>m/s</small>`, r.vmax / 2); set('dp', `${f(r.dphi, 2)}<small>rad</small>`, (r.dphiMod) / (2 * Math.PI));
      $('res').innerHTML = `λ = v/f = <b>${f(r.v, 1)}</b>/<b>${f(r.f, 1)}</b> = <b>${f(r.lam, 2)}</b> m<br>P, Q cách nhau <b>${f(r.dx, 2)}</b> m = <b>${f(r.nWaves, 2)}</b> λ → Δφ = 2πΔx/λ = <b>${f(r.dphi, 2)}</b> rad ${r.inPhase ? '<span class="ok">· cùng pha</span>' : r.opposite ? '<span style="color:#d62839">· ngược pha</span>' : ''}<br>sóng đã tới x = <b>${f(Math.min(L, r.front), 2)}</b> m`;
      // snapshot u(x)
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 84, r: 14, t: 46, b: 40}, X = (x) => m.l + (x / L) * (w - m.l - m.r), YM = 22, Y = (cm) => m.t + (h - m.t - m.b) / 2 - (cm / YM) * ((h - m.t - m.b) / 2);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (let x = 0; x <= L; x += 0.5) { g.beginPath(); g.moveTo(X(x), m.t); g.lineTo(X(x), h - m.b); g.stroke(); g.fillText(f(x, 1), X(x), h - 12); }
      g.textAlign = 'right'; for (const y of [-20, -10, 0, 10, 20]) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 5); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
      g.strokeStyle = OR; g.lineWidth = 4.5; g.beginPath(); for (let i = 0; i <= 300; i++) { const x = (i / 300) * L, y = u(s, x, r.t) * 100; i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.stroke();
      for (const [x, col, nm] of [[s.xP, RD, 'P'], [s.xQ, BL, 'Q']]) { g.fillStyle = col; g.beginPath(); g.arc(X(x), Y(u(s, x, r.t) * 100), 8, 0, 7); g.fill(); g.font = '700 24px monospace'; g.textAlign = 'center'; g.fillText(nm, X(x), Y(u(s, x, r.t) * 100) - 12); }
      if (r.crests.length >= 2) { const a = X(r.crests[0]), b = X(r.crests[1]), yy = Y(Math.min(YM - 2, r.A * 100 + 4)); g.strokeStyle = TL; g.lineWidth = 3; g.beginPath(); g.moveTo(a, yy); g.lineTo(b, yy); g.moveTo(a, yy - 6); g.lineTo(a, yy + 6); g.moveTo(b, yy - 6); g.lineTo(b, yy + 6); g.stroke(); g.fillStyle = TL; g.font = '700 23px monospace'; g.textAlign = 'center'; g.fillText('λ = ' + f(r.lam, 2) + ' m', (a + b) / 2, yy - 9); }
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('ẢNH CHỤP SÓNG: li độ u (cm) theo x (m)', 8, 26);
      // time graph u(t) at P and Q
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); const win = 2.2 * Math.max(r.T, 0.5) + 0.0, t0 = r.t - win, TX = (t) => m.l + ((t - t0) / win) * (w - m.l - m.r);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'right'; for (const y of [-20, -10, 0, 10, 20]) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(String(y), m.l - 6, Y(y) + 5); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
      for (const [x, col] of [[s.xP, RD], [s.xQ, BL]]) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); let first = true; for (let i = 0; i <= 220; i++) { const t = t0 + (i / 220) * win; if (t < 0) continue; const y = u(s, x, t) * 100; first ? g.moveTo(TX(t), Y(y)) : g.lineTo(TX(t), Y(y)); first = false; } g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(TX(r.t), Y(u(s, x, r.t) * 100), 8, 0, 7); g.fill(); }
      g.strokeStyle = INK; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(TX(r.t), m.t); g.lineTo(TX(r.t), h - m.b); g.stroke(); g.setLineDash([]);
      g.strokeStyle = PU; g.lineWidth = 3; const ty = Y(-YM + 3.5), ta = TX(r.t) - ((r.T / win) * (w - m.l - m.r)), tb = TX(r.t); g.beginPath(); g.moveTo(ta, ty); g.lineTo(tb, ty); g.moveTo(ta, ty - 6); g.lineTo(ta, ty + 6); g.moveTo(tb, ty - 6); g.lineTo(tb, ty + 6); g.stroke(); g.fillStyle = PU; g.font = '700 23px monospace'; g.textAlign = 'center'; g.fillText('T = ' + f(r.T, 2) + ' s', (ta + tb) / 2, ty - 8);
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('P (đỏ), Q (xanh): u (cm) theo t', 8, 26); g.fillStyle = '#5b7080'; g.font = '21px monospace'; g.textAlign = 'right'; g.fillText('t (s) →', w - m.r, h - 12);
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

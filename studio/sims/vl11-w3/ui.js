// W3 overlay: the electromagnetic spectrum (log scale) with the chosen frequency, E and B along x, and the numbers.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {C, E0_RANGE, E_RANGE, PRESETS, REGIONS, fmtHz, fmtLen, lamVis} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', BL = '#2b59c3';
export const CSS = BASE + `canvas.gr{width:100%;height:210px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.nt{font:600 11.5px/1.45 Inter,sans-serif;color:#6a8190;margin:2px 0 8px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W3 · SÓNG ĐIỆN TỪ</h1><p>ĐIỆN TRƯỜNG E · TỪ TRƯỜNG B · THANG SÓNG ĐIỆN TỪ · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SÓNG ĐIỆN TỪ</span><span>EM WAVE</span></div>
    <div class="blk" style="--c:${OR}">${row('f', 'f', OR)}${row('λ=c/f', 'lam', TL)}${row('c', 'c', PU)}${row('E₀', 'E', RD)}${row('B₀', 'B', BL)}${row('Đèn', 'lamp', '#e8a317')}</div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="420"></canvas><canvas class="gr" id="g2" width="680" height="320"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    ${sl('e', 'f tần số (lôga)', E_RANGE[0], E_RANGE[1], 0.01, OR)}${sl('E0', 'E₀ biên độ điện trường (V/m)', E0_RANGE[0], E0_RANGE[1], 0.5, RD)}${sl('theta', 'θ góc xoay anten thu (độ)', 0, 90, 1, '#e8a317')}
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-freeze" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">❚❚ Dừng hình</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="nt">Hình 3D không đúng tỉ lệ: bước sóng vẽ chỉ từ 0,3 đến 1,4 m cho mọi tần số, B vẽ phóng đại.</div>
    <div class="ptitle" style="margin-top:2px"><span>NGUỒN SÓNG THƯỜNG GẶP</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] máy phát · máy thu</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="side">3<br>TỪ BÊN</button><button data-v="rx">4<br>ANTEN THU</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['e', 'E0', 'theta']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  $('b-freeze').addEventListener('click', () => hooks.freeze()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const BANDS = [[3, 'vô tuyến', REGIONS[0].col], [-3, 'vi sóng', REGIONS[1].col], [-6.12, 'hồng ngoại', REGIONS[2].col], [-6.42, 'nhìn thấy', REGIONS[3].col], [-8, 'tử ngoại', REGIONS[4].col], [-11, 'tia X', REGIONS[5].col], [-13, 'gamma', REGIONS[6].col]];
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const [fv, fu] = fmtHz(r.f), [lv, lu] = fmtLen(r.lam);
      const vals = {e: s.e, E0: s.E0, theta: s.theta}, txt = {e: `${f(fv, fv >= 100 ? 0 : fv >= 10 ? 1 : 2)} ${fu}`, E0: f(s.E0, 1) + ' V/m', theta: f(s.theta, 0) + '°'};
      for (const k of Object.keys(vals)) { const e = $('s-' + k); if (document.activeElement !== e) e.value = vals[k]; $('sv-' + k).textContent = txt[k]; }
      $('b-freeze').textContent = s.frozen ? '▶ Chạy tiếp' : '❚❚ Dừng hình';
      const set = (id, t, bar, col) => { $('v' + id).innerHTML = t; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('f', `${f(fv, fv >= 100 ? 0 : 2)}<small>${fu}</small>`, (s.e - 4) / 18, r.reg.col); set('lam', `${f(lv, lv >= 100 ? 0 : 2)}<small>${lu}</small>`, (s.e - 4) / 18); set('c', `3,00·10⁸<small>m/s</small>`, 1); set('E', `${f(r.E0, 1)}<small>V/m</small>`, r.E0 / 10); set('B', `${f(r.nT, 1)}<small>nT</small>`, r.E0 / 10); set('lamp', `${f(r.lamp * 100, 0)}<small>%</small>`, r.lamp);
      $('res').innerHTML = `<b style="color:${r.reg.col}">${r.reg.vi.toUpperCase()}</b> · ví dụ: ${r.reg.ex}<br>Ứng dụng: ${r.reg.use}<br>c = λf = <b>${f(lv, 2)} ${lu}</b> × <b>${f(fv, 2)} ${fu}</b> = 3·10⁸ m/s`;
      // spectrum
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 14, r: 14}, LO = -13.5, HI = 4.2, X = (lg) => m.l + ((HI - lg) / (HI - LO)) * (w - m.l - m.r); // x by log10 λ, long wavelengths on the left
      const edges = [HI, 0, -3, Math.log10(760e-9), Math.log10(380e-9), -8, -11, LO];
      for (let i = 0; i < 7; i++) { const a = X(edges[i]), b = X(edges[i + 1]); g.fillStyle = REGIONS[i].col; g.globalAlpha = 0.85; g.fillRect(a, 70, b - a, 150); g.globalAlpha = 1; }
      const vx0 = X(Math.log10(760e-9)), vx1 = X(Math.log10(380e-9)); const gr = g.createLinearGradient(vx0, 0, vx1, 0); ['#ff2a00', '#ffb000', '#d9ff00', '#00e676', '#00b7ff', '#3b3bff', '#7a00ff'].forEach((c2, i) => gr.addColorStop(i / 6, c2)); g.fillStyle = gr; g.fillRect(vx0, 70, vx1 - vx0, 150);
      g.fillStyle = INK; g.font = '700 19px monospace'; g.textAlign = 'center'; const names = ['VÔ TUYẾN', 'VI SÓNG', 'HỒNG NGOẠI', '', 'TỬ NGOẠI', 'TIA X', 'GAMMA']; for (let i = 0; i < 7; i++) { if (!names[i]) continue; const a = X(edges[i]), b = X(edges[i + 1]); g.save(); g.translate((a + b) / 2, 150); g.rotate(-Math.PI / 2); g.fillStyle = '#fff'; g.fillText(names[i], 0, 6); g.restore(); }
      g.fillStyle = INK; g.font = '19px monospace'; g.textAlign = 'center'; for (const [lg, t] of [[3, '1 km'], [0, '1 m'], [-3, '1 mm'], [-6, '1 µm'], [-9, '1 nm'], [-12, '1 pm']]) { g.strokeStyle = '#7d93a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(lg), 222); g.lineTo(X(lg), 234); g.stroke(); g.fillText(t, X(lg), 256); }
      g.fillStyle = INK; g.font = '700 22px monospace'; g.textAlign = 'left'; g.fillText('THANG SÓNG ĐIỆN TỪ (λ, thang lôga)', 14, 28);
      const mx = X(Math.log10(r.lam)); g.fillStyle = INK; g.beginPath(); g.moveTo(mx, 68); g.lineTo(mx - 13, 40); g.lineTo(mx + 13, 40); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(mx, 68); g.lineTo(mx, 220); g.stroke(); g.fillStyle = INK; g.textAlign = mx > w * 0.7 ? 'right' : 'left'; g.font = '700 21px monospace'; g.fillText(`f = ${f(fv, 2)} ${fu}`, mx + (mx > w * 0.7 ? 8 : -8), 300); g.fillText(`λ = ${f(lv, 2)} ${lu}`, mx + (mx > w * 0.7 ? 8 : -8), 330); g.fillStyle = r.reg.col; g.fillText(r.reg.vi, mx + (mx > w * 0.7 ? 8 : -8), 360);
      // E and B along x
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h = c.height); const lvs = lamVis(s), PX = (x) => 70 + (x / 4) * (w - 90), PY = (v) => 160 - v * 11;
      g.strokeStyle = '#e2eaef'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(70, 160); g.lineTo(w - 20, 160); g.stroke();
      for (const [col, k, nm] of [[RD, 1, 'E'], [BL, 0.8, 'B']]) { g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 300; i++) { const x = (i / 300) * 4, v = s.E0 * Math.sin(2 * Math.PI * (x / lvs - 0.35 * r.t)) * k; i ? g.lineTo(PX(x), PY(v)) : g.moveTo(PX(x), PY(v)); } g.stroke(); g.fillStyle = col; g.font = '700 24px monospace'; g.textAlign = 'right'; g.fillText(nm, 56, nm === 'E' ? 90 : 240); }
      g.fillStyle = INK; g.font = '700 21px monospace'; g.textAlign = 'left'; g.fillText('E (đỏ) và B (xanh) cùng pha, cùng đạt cực đại', 14, 26); g.fillStyle = '#5b7080'; g.font = '19px monospace'; g.textAlign = 'right'; g.fillText('x (m) →', w - 14, 300);
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

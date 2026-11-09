// W4B overlay: the intensity profile I(x) on the screen (with the cursor), the fringe spacing against the wavelength, and the numbers at the cursor point P.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {A_RANGE, D_RANGE, HALF, PRESETS, WL, fringe, intensity, wlRGB} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', GR = '#2c9a4b';
export const CSS = BASE + `canvas.gr{width:100%;height:196px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.sw{display:flex;gap:5px;margin-bottom:8px}.sw button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.sw button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.spec{height:14px;border-radius:7px;margin:-2px 0 8px;background:linear-gradient(90deg,#7a00ff,#3b3bff,#00b7ff,#00e676,#d9ff00,#ffb000,#ff2a00)}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
const css = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W4B · GIAO THOA ÁNH SÁNG</h1><p>THÍ NGHIỆM KHE YOUNG · VÂN SÁNG, VÂN TỐI, i = λD/a · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>VÂN GIAO THOA</span><span>FRINGES</span></div>
    <div class="blk" style="--c:${RD}">${row('λ', 'lam', TL)}${row('i=λD/a', 'i', OR)}${row('Δd', 'dd', PU)}${row('Δd/λ', 'dl', PU)}${row('I(P)', 'I', GR)}${row('Số vân', 'n', RD)}</div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <canvas class="gr" id="g1" width="680" height="392"></canvas><canvas class="gr" id="g2" width="680" height="392"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="sw" id="src"><button data-w="0">Laser (đơn sắc)</button><button data-w="1">Ánh sáng trắng</button></div>
    ${sl('wl', 'λ bước sóng (nm)', WL[0], WL[1], 5, OR)}<div class="spec"></div>${sl('a', 'a khoảng cách hai khe (mm)', A_RANGE[0], A_RANGE[1], 0.05, TL)}${sl('D', 'D khoảng cách khe – màn (m)', D_RANGE[0], D_RANGE[1], 0.1, PU)}${sl('x', 'Con trỏ P · vị trí x trên màn (mm)', -HALF * 1000, HALF * 1000, 0.1, RD)}
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] laser · tấm hai khe</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>TỪ TRÊN</button><button data-v="screen">3<br>MÀN</button><button data-v="slits">4<br>HAI KHE</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['wl', 'a', 'D', 'x']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#src button').forEach((b) => b.addEventListener('click', () => hooks.white(b.dataset.w === '1')));
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
      const vals = {wl: s.wl, a: s.a, D: s.D, x: s.x}, units = {wl: ' nm', a: ' mm', D: ' m', x: ' mm'}, dig = {wl: 0, a: 2, D: 1, x: 1};
      for (const k of Object.keys(vals)) { const e = $('s-' + k); if (document.activeElement !== e) e.value = vals[k]; $('sv-' + k).textContent = f(vals[k], dig[k]) + units[k]; }
      $('s-wl').disabled = s.white; $('s-wl').style.opacity = s.white ? 0.35 : 1; root.querySelectorAll('#src button').forEach((b) => b.classList.toggle('on', (b.dataset.w === '1') === s.white));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('lam', s.white ? '<span style="font-size:12px">trắng</span>' : `${f(r.wl, 0)}<small>nm</small>`, (r.wl - 380) / 400, s.white ? '#888' : css(r.rgb)); set('i', s.white ? `<span style="font-size:12px">${f(r.iV, 1)}–${f(r.iR, 1)}</span><small>mm</small>` : `${f(r.iMm, 2)}<small>mm</small>`, r.iMm / 7); set('dd', `${f(r.dd * 1e6, 2)}<small>µm</small>`, Math.abs(r.dd) / 4e-5); set('dl', r.ddLam == null ? '—' : `${f(r.ddLam, 2)}<small>λ</small>`, r.ddLam == null ? 0 : Math.abs(r.ddLam) / 8); set('I', r.I == null ? '—' : `${f(r.I, 2)}`, r.I == null ? 0 : r.I, r.kind === 'max' ? GR : r.kind === 'min' ? RD : OR); set('n', `${r.nBright}<small>vân sáng</small>`, r.nBright / 60);
      const kindTxt = s.white ? 'Ánh sáng trắng: mỗi màu có khoảng vân riêng, chỉ tại x = 0 mọi màu cùng cực đại nên vân giữa màu trắng' : r.kind === 'max' ? `<span class="ok">● VÂN SÁNG bậc ${Math.abs(r.order)}</span> (x = k·i, k = ${r.order}) · hai sóng cùng pha` : r.kind === 'min' ? `<span style="color:#d62839">● VÂN TỐI</span> (x = (k + ½)·i) · hai sóng ngược pha` : `Điểm trung gian · I = ${f(r.I ?? 0, 2)}`;
      $('res').innerHTML = `i = λD/a = <b>${s.white ? '—' : f(r.iMm, 2)}</b> mm · Δd = a·x/D = <b>${f(r.dd * 1e6, 2)}</b> µm<br>${kindTxt}<br>Cửa sổ ±30 mm có <b>${r.nBright}</b> vân sáng (nếu laser)`;
      // intensity profile
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 78, r: 16, t: 46, b: 44}, X = (mm) => m.l + ((mm + HALF * 1e3) / (2 * HALF * 1e3)) * (w - m.l - m.r), Y = (v) => h - m.b - v * (h - m.t - m.b);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center'; for (let mm = -30; mm <= 30; mm += 10) { g.beginPath(); g.moveTo(X(mm), m.t); g.lineTo(X(mm), h - m.b); g.stroke(); g.fillText(String(mm), X(mm), h - 14); }
      g.textAlign = 'right'; for (const v of [0, 0.5, 1]) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(w - m.r, Y(v)); g.stroke(); g.fillText(f(v, 1), m.l - 6, Y(v) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
      if (s.white) { for (const [wl, col] of [[700, '#d62839'], [450, '#2b59c3']]) { g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i <= 600; i++) { const mm = -30 + (i / 600) * 60, y = intensity(s, mm * 1e-3, wl); i ? g.lineTo(X(mm), Y(y)) : g.moveTo(X(mm), Y(y)); } g.stroke(); } }
      else { g.strokeStyle = css(r.rgb.map((v) => v * 0.85)); g.lineWidth = 5.5; g.beginPath(); for (let i = 0; i <= 900; i++) { const mm = -30 + (i / 900) * 60, y = intensity(s, mm * 1e-3); i ? g.lineTo(X(mm), Y(y)) : g.moveTo(X(mm), Y(y)); } g.stroke();
        if (r.iMm < 8) { const k0 = 0; g.strokeStyle = TL; g.lineWidth = 3; const a0 = X(k0), a1 = X(r.iMm); g.beginPath(); g.moveTo(a0, Y(0.12)); g.lineTo(a1, Y(0.12)); g.moveTo(a0, Y(0.12) - 7); g.lineTo(a0, Y(0.12) + 7); g.moveTo(a1, Y(0.12) - 7); g.lineTo(a1, Y(0.12) + 7); g.stroke(); g.fillStyle = TL; g.font = '700 21px monospace'; g.textAlign = 'center'; g.fillText('i = ' + f(r.iMm, 2) + ' mm', (a0 + a1) / 2 + 30, Y(0.12) - 12); } }
      g.strokeStyle = RD; g.lineWidth = 3; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(X(s.x), m.t); g.lineTo(X(s.x), h - m.b); g.stroke(); g.setLineDash([]);
      if (r.I != null) { g.fillStyle = RD; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(s.x), Y(r.I), 10, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('ĐỘ SÁNG I theo x (mm) trên màn', 8, 26); g.fillStyle = '#5b7080'; g.font = '21px monospace'; g.textAlign = 'right'; g.fillText('x (mm) →', w - m.r, h - 14);
      // fringe spacing versus wavelength
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h); const LX = (wl) => m.l + ((wl - WL[0]) / (WL[1] - WL[0])) * (w - m.l - m.r), iMax = 7, LY = (v) => h - m.b - (v / iMax) * (h - m.t - m.b);
      for (let wl = WL[0]; wl < WL[1]; wl += 4) { g.fillStyle = css(wlRGB(wl)); g.globalAlpha = 0.28; g.fillRect(LX(wl), m.t, LX(wl + 4) - LX(wl) + 1, h - m.t - m.b); } g.globalAlpha = 1;
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center'; for (let wl = 400; wl <= 700; wl += 100) { g.beginPath(); g.moveTo(LX(wl), m.t); g.lineTo(LX(wl), h - m.b); g.stroke(); g.fillText(String(wl), LX(wl), h - 14); }
      g.textAlign = 'right'; for (let v = 0; v <= 6; v += 2) { g.beginPath(); g.moveTo(m.l, LY(v)); g.lineTo(w - m.r, LY(v)); g.stroke(); g.fillText(String(v), m.l - 6, LY(v) + 6); }
      g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); for (let wl = WL[0]; wl <= WL[1]; wl += 5) { const y = ((wl * 1e-9 * s.D) / (s.a * 1e-3)) * 1e3; wl === WL[0] ? g.moveTo(LX(wl), LY(y)) : g.lineTo(LX(wl), LY(y)); } g.stroke();
      if (!s.white) { g.fillStyle = css(r.rgb); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(LX(s.wl), LY(r.iMm), 10, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = INK; g.font = '700 23px monospace'; g.textAlign = 'left'; g.fillText('i (mm) theo λ (nm)', 8, 26); g.fillStyle = '#5b7080'; g.font = '19px monospace'; g.textAlign = 'right'; g.fillText('đỏ: i lớn nhất · tím: i nhỏ nhất', w - m.r, 26);
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

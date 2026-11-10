// B5 overlay: số liệu hạt, hình chiếu quỹ đạo, bảng đo e/m, đồ thị r²B² theo V.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {CH, PARTICLES, PRESETS, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:215px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.rw{display:flex;gap:6px;margin-bottom:6px}.md{display:flex;gap:5px;margin-bottom:8px}#left .g3 .v{font-size:12.5px;white-space:nowrap}#left .g3 .v small{font-size:9px}.md button,.tg button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.md button.on,.tg button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.tg{display:flex;gap:5px;margin-bottom:8px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
export const fT = (T) => (T >= 1e-6 ? `${f(T * 1e6, 2)} µs` : `${f(T * 1e9, 1)} ns`);

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>B5 · HẠT ĐIỆN TÍCH TRONG TỪ TRƯỜNG ĐỀU</h1><p>LỰC LORENTZ · r = mv/(|q|B) · ĐO e/m · Vật lí 12 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k" style="white-space:nowrap;font-size:11px">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU HẠT</span><span>PARTICLE</span></div>
    <div class="blk" style="--c:${OR}">${row('v', 'v', BL)}${row('r', 'r', RD)}${row('T', 'T', PU)}${row('bước ốc p', 'p', GR)}${row('q/m', 'q', TL)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <canvas class="gr" id="g0" width="680" height="430"></canvas><canvas class="gr" id="g1" width="680" height="430"></canvas>
    <table class="tb" id="tb"></table></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="md" id="pt">${PARTICLES.map((p, i) => `<button data-p="${i}">${p.vi}<br>${p.sym}</button>`).join('')}</div>
    ${sl('V', 'V hiệu điện thế tăng tốc (V)', RANGE.V[0], RANGE.V[1], 10, BL)}${sl('B', 'B cảm ứng từ (mT)', RANGE.B[0], RANGE.B[1], 0.1, RD)}${sl('alpha', 'α góc giữa v và trục z (°)', RANGE.alpha[0], RANGE.alpha[1], 1, PU)}
    <div class="tg"><button id="t-dir">B: RA phía người xem ⊙</button><button id="t-ring">Vòng đo: ẨN</button></div>
    ${sl('rt', 'r_đo bán kính vòng đo (m)', RANGE.rt[0], RANGE.rt[1], 0.001, OR)}
    <div class="rw"><button class="btn big" id="b-rec" style="margin:0;height:36px;font-size:14px;flex:2;box-shadow:none">＋ Ghi phép đo</button><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] bình · cuộn Helmholtz · súng</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="face">2<br>CHÍNH DIỆN</button><button data-v="top">3<br>TỪ TRÊN</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['V', 'B', 'alpha', 'rt']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#pt button').forEach((b) => b.addEventListener('click', () => hooks.particle(Number(b.dataset.p))));
  $('t-dir').addEventListener('click', () => hooks.dir()); $('t-ring').addEventListener('click', () => hooks.ring());
  $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear());
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    syncSliders(s) { for (const k of ['V', 'B', 'alpha', 'rt']) { const i = $('s-' + k); if (document.activeElement !== i) i.value = s[k]; $('sv-' + k).textContent = k === 'V' ? `${f(s[k], 0)} V` : k === 'B' ? `${f(s[k], 1)} mT` : k === 'alpha' ? `${f(s[k], 0)}°` : `${f(s[k] * 100, 1)} cm`; } },
    update(r, s) {
      root.querySelectorAll('#pt button').forEach((b) => b.classList.toggle('on', Number(b.dataset.p) === s.pt)); $('t-dir').classList.toggle('on', s.dirB > 0); $('t-dir').textContent = s.dirB > 0 ? 'B: RA phía người xem ⊙' : 'B: VÀO phía sau ⊗'; $('t-ring').classList.toggle('on', s.showRing); $('t-ring').textContent = s.showRing ? 'Vòng đo: HIỆN' : 'Vòng đo: ẨN';
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('v', `${f(r.v / 1e6, 2)}<small>·10⁶ m/s</small>`, Math.log10(r.v) / 8); set('r', `${f(r.r * 100, 2)}<small>cm</small>`, r.r / 0.3); set('T', fT(r.T), (Math.log10(r.T) + 9) / 4); set('p', `${f(r.pitch * 100, 2)}<small>cm</small>`, r.pitch / 0.3); set('q', `${f(r.qm / 1e11, 3)}<small>·10¹¹ C/kg</small>`, r.qm / 4e11);
      $('tag').innerHTML = `<small>Hoạt cảnh: 1 chu kỳ T thật được chiếu trong 5 s (chậm ${(5 / r.T).toExponential(1).replace('e+', '·10^')} lần).</small><br>${r.sym}: v = √(2|q|V/m); r = m·v·sinα/(|q|B) = <b>${f(r.r * 100, 2)} cm</b>${r.hitsWall ? ' · <b style="color:#8a6a1c">hạt tới nắp/thành bình (hết quỹ đạo trong bình)</b>' : ''}${r.ring ? `<br>Vòng đo r_đo = ${f(r.rt * 100, 1)} cm → q/m = 2V·sin²α/(B²r²) = <b>${f(r.emTest / 1e11, 3)}·10¹¹ C/kg</b>` : ''}`;
      // hình chiếu quỹ đạo (nhìn từ phía người xem: x sang phải, y lên)
      { const c = $('g0'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); g.fillStyle = '#f6f9fb'; g.fillRect(0, 0, w, h); const K = (h * 0.45) / CH.R, cx = w / 2 + 40, cy = h / 2; g.strokeStyle = '#d4dee5'; g.lineWidth = 1.2; for (let rr = 0.02; rr <= CH.R; rr += 0.02) { g.beginPath(); g.arc(cx, cy, rr * K, 0, 7); g.stroke(); } g.strokeStyle = '#7d93a0'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, CH.R * K, 0, 7); g.stroke();
        g.fillStyle = INK; g.font = '15px monospace'; g.fillText('NHÌN TỪ PHÍA NGƯỜI XEM (⊙ = B ra)', 8, 18); g.fillText('vòng bình R = 10 cm; vòng mờ cách 2 cm', 8, h - 8);
        g.strokeStyle = '#' + PARTICLES[s.pt].color.toString(16).padStart(6, '0'); g.lineWidth = 4; g.beginPath(); r.path.pts.forEach((p, i) => (i ? g.lineTo(cx + p[0] * K, cy - p[1] * K) : g.moveTo(cx + p[0] * K, cy - p[1] * K))); g.stroke();
        if (r.ring) { g.strokeStyle = OR; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.arc(cx + r.center[0] * K, cy - r.center[1] * K, r.rt * K, 0, 7); g.stroke(); g.setLineDash([]); }
        g.fillStyle = INK; g.beginPath(); g.arc(cx + CH.x0 * K, cy, 6, 0, 7); g.fill(); }
      // r²B² theo V
      { const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); const m = {l: 96, r: 16, t: 28, b: 38}, Vm = 1000, Ym = (2 / r.qm) * Vm * 1.1, X = (v) => m.l + (v / Vm) * (w - m.l - m.r), Y = (y) => h - m.b - (y / Ym) * (h - m.t - m.b);
        g.font = '15px monospace'; g.fillStyle = INK; g.strokeStyle = '#e2eaef'; g.lineWidth = 1.2; g.textAlign = 'center'; for (let v = 0; v <= 1000; v += 250) { g.beginPath(); g.moveTo(X(v), Y(0)); g.lineTo(X(v), Y(Ym)); g.stroke(); g.fillText(String(v), X(v), h - 14); }
        g.textAlign = 'right'; for (let k = 0; k <= 4; k++) { const y = (Ym * k) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(Vm), Y(y)); g.stroke(); g.fillText((y * 1e9).toFixed(1).replace('.', ','), m.l - 6, Y(y) + 5); }
        g.strokeStyle = TL; g.lineWidth = 3; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(Vm), Y((2 / r.qm) * Vm)); g.stroke(); g.setLineDash([]); g.fillStyle = OR; for (const q of r.rows.filter((q2) => q2.pt === s.pt)) { g.beginPath(); g.arc(X(q.V), Y(q.r * q.r * (q.B * 1e-3) ** 2), 7, 0, 7); g.fill(); }
        if (r.regress) { g.strokeStyle = RD; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(Vm), Y(r.regress.slope * Vm)); g.stroke(); }
        g.fillStyle = INK; g.font = '700 15px monospace'; g.textAlign = 'left'; g.fillText('r²B² (10⁻⁹ m²·T²) theo V (V): hệ số góc = 2/(q/m)', 6, 18); }
      $('tb').innerHTML = `<tr><th>V (V)</th><th>B (mT)</th><th>r_đo (cm)</th><th>q/m (10¹¹)</th></tr>` + (r.rows.length ? r.rows.map((q) => `<tr><td>${f(q.V, 0)}</td><td>${f(q.B, 1)}</td><td>${f(q.r * 100, 1)}</td><td>${f(q.em / 1e11, 3)}</td></tr>`).join('') + (r.rows.length > 1 ? `<tr><td colspan="3" style="text-align:right;font-weight:700">trung bình ± s</td><td style="font-weight:700">${f(r.mean / 1e11, 3)} ± ${f(r.sd / 1e11, 3)}</td></tr>` : '') : '<tr><td colspan="4" style="text-align:center;color:#6a8190">Chưa có số liệu · bật vòng đo, khớp với quỹ đạo rồi “＋ Ghi phép đo”</td></tr>');
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

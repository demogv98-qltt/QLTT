// B4 overlay: số chỉ cân, bảng đo, đồ thị F–I có thanh sai số, hồi quy và kết quả B ± δB.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {MAGNETS, P, PRESETS, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:230px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.rw{display:flex;gap:6px;margin-bottom:6px}.md{display:flex;gap:5px;margin-bottom:8px}.md button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.md button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>B4 · THỰC HÀNH ĐO CẢM ỨNG TỪ B</h1><p>CÂN DÒNG ĐIỆN · F = N·B·I·l · HỒI QUY VÀ SAI SỐ · Vật lí 12 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k" style="white-space:nowrap;font-size:11px">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ LIỆU THỰC HÀNH</span><span>LAB</span></div>
    <div class="blk" style="--c:${OR}">${row('I', 'I', GR)}${row('Δm (cân)', 'm', BL)}${row('F = Δm·g', 'F', OR)}${row('B đo', 'B', RD)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <canvas class="gr" id="g1" width="680" height="420"></canvas>
    <table class="tb" id="tb"></table></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="md" id="mg">${MAGNETS.map((m, i) => `<button data-m="${i}">Nam châm<br>${m.id}</button>`).join('')}</div>
    ${sl('I', 'I dòng điện (A)', RANGE.I[0], RANGE.I[1], 0.05, GR)}${sl('N', 'N số vòng của khung dây', RANGE.N[0], RANGE.N[1], 1, BL)}
    <div class="rw"><button class="pre" id="b-tare" style="margin:0;flex:1;text-align:center;font:700 13px Inter,sans-serif">⊘ Tare (đặt cân về 0)</button></div>
    <div class="rw"><button class="btn big" id="b-rec" style="margin:0;height:38px;font-size:14px;flex:2;box-shadow:none">＋ Ghi số liệu</button><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="rw"><button class="pre" id="b-reveal" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Kiểm tra: hiện B “thật” của nam châm</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] nam châm · khung dây · giá đỡ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="gap">2<br>KHE TỪ</button><button data-v="bal">3<br>MÀN CÂN</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['I', 'N']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#mg button').forEach((b) => b.addEventListener('click', () => hooks.magnet(Number(b.dataset.m))));
  $('b-tare').addEventListener('click', () => hooks.tare()); $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear()); $('b-reveal').addEventListener('click', () => hooks.reveal());
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
    syncSliders(s) { for (const k of ['I', 'N']) { const i = $('s-' + k), v = k === 'I' ? s.cmd.I : s.N; if (document.activeElement !== i) i.value = v; $('sv-' + k).textContent = k === 'I' ? `${f(v, 2)} A` : `${v} vòng`; } },
    update(r, s) {
      root.querySelectorAll('#mg button').forEach((b) => b.classList.toggle('on', Number(b.dataset.m) === s.mag));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('I', `${f(r.I, 2)}<small>A</small>`, Math.abs(r.I) / 3); set('m', `${f(r.disp, 2)}<small>g</small>`, Math.abs(r.disp) / (r.N * r.B * r.l * 3 / 9.8 * 1000)); set('F', `${f(r.Fm, 2)}<small>mN</small>`, Math.abs(r.Fm) / (r.N * r.B * r.l * 3 * 1000));
      set('B', r.reg ? `${f(r.reg.Bexp * 1e3, 1)}<small>mT</small>` : '—', r.reg ? r.reg.Bexp / 0.2 : 0);
      const g = r.reg;
      $('tag').innerHTML = (r.note && performance.now() / 1000 - r.note.at < 4 ? `<b style="color:#c0392b">${r.note.text}</b><br>` : '') + (g ? `Hệ số góc = <b>${f(g.slope, 2)} ± ${f(g.se, 2)} mN/A</b> → B = k/(N·l) = <b>${f(g.Bexp * 1e3, 1)} ± ${f(g.dB * 1e3, 1)} mT</b>${r.reveal ? ` · B “thật” = <b style="color:#0b8f8c">${f(r.B * 1e3, 1)} mT</b>` : ''}` : 'Ghi ít nhất 3 điểm (I khác nhau) để vẽ đường thẳng và tính B.');
      $('tb').innerHTML = `<tr><th>I (A)</th><th>N</th><th>Δm (g)</th><th>F (mN)</th></tr>` + (r.rows.length ? r.rows.map((q) => `<tr><td>${f(q.I, 2)}</td><td>${q.N}</td><td>${f(q.m, 2)}</td><td>${f(q.m * P.l * 0 + q.m / 1000 * 9.8 * 1000, 2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi số liệu”</td></tr>');
      const c = $('g1'), gx = c.getContext('2d'), w = c.width, h = c.height; gx.clearRect(0, 0, w, h); const m = {l: 84, r: 16, t: 30, b: 40}; gx.font = '16px monospace'; gx.fillStyle = INK; gx.lineWidth = 1.2; gx.strokeStyle = '#e2eaef';
      const Imax = 3, Fmax = Math.max(20, Math.ceil((r.N * r.B * r.l * 3 * 1000 * 1.05) / 20) * 20), X = (x) => m.l + ((x + Imax) / (2 * Imax)) * (w - m.l - m.r), Y = (y) => h - m.b - ((y + Fmax) / (2 * Fmax)) * (h - m.t - m.b);
      gx.textAlign = 'center'; for (let x = -3; x <= 3; x += 1) { gx.beginPath(); gx.moveTo(X(x), Y(-Fmax)); gx.lineTo(X(x), Y(Fmax)); gx.stroke(); gx.fillText(String(x).replace('-', '−'), X(x), h - 16); }
      gx.textAlign = 'right'; for (let y = -Fmax; y <= Fmax; y += Fmax / 3) { gx.beginPath(); gx.moveTo(X(-Imax), Y(y)); gx.lineTo(X(Imax), Y(y)); gx.stroke(); gx.fillText(Math.round(y).toString().replace('-', '−'), m.l - 6, Y(y) + 5); }
      gx.strokeStyle = '#7d93a0'; gx.lineWidth = 2.5; gx.beginPath(); gx.moveTo(X(-Imax), Y(0)); gx.lineTo(X(Imax), Y(0)); gx.moveTo(X(0), Y(-Fmax)); gx.lineTo(X(0), Y(Fmax)); gx.stroke();
      if (g) { gx.strokeStyle = TL; gx.lineWidth = 3; gx.beginPath(); gx.moveTo(X(-Imax), Y(g.a - Imax * g.slope)); gx.lineTo(X(Imax), Y(g.a + Imax * g.slope)); gx.stroke(); }
      if (r.reveal) { gx.strokeStyle = 'rgba(11,143,140,.5)'; gx.lineWidth = 2; gx.setLineDash([6, 6]); const k = r.N * r.B * P.l * 1000; gx.beginPath(); gx.moveTo(X(-Imax), Y(-Imax * k)); gx.lineTo(X(Imax), Y(Imax * k)); gx.stroke(); gx.setLineDash([]); }
      gx.fillStyle = OR; gx.strokeStyle = OR; gx.lineWidth = 2; for (const q of r.rows) { const y = q.m / 1000 * 9.8 * 1000, e = P.sigma * 9.8 * 2; gx.beginPath(); gx.moveTo(X(q.I), Y(y - e)); gx.lineTo(X(q.I), Y(y + e)); gx.stroke(); gx.beginPath(); gx.arc(X(q.I), Y(y), 6, 0, 7); gx.fill(); }
      gx.fillStyle = INK; gx.strokeStyle = '#fff'; gx.lineWidth = 3; gx.beginPath(); gx.arc(X(r.I), Y(r.Fm), 8, 0, 7); gx.fill(); gx.stroke();
      gx.font = '700 16px monospace'; gx.textAlign = 'left'; gx.fillText('F (mN) theo I (A) · đường xanh: hồi quy', 6, 20); gx.textAlign = 'right'; gx.fillText('I (A)', w - 6, h - 40);
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

// W6 overlay: loudness against the air-column length, the data table of the trials (l1, l2, v) and the processing.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {DL, F_RANGE, FORKS, LT, PRESETS, T_RANGE, loud, resonances} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#d62839', BL = '#2b59c3', GR = '#2c9a4b';
export const CSS = BASE + `canvas.gr{width:100%;height:210px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 118px 1fr;align-items:center;gap:6px;height:24px}.fk{display:flex;gap:4px;margin-bottom:8px}.fk button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:6px 1px;font:700 12px 'JetBrains Mono',monospace;color:#14303c;cursor:pointer}.fk button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.ld{height:16px;border-radius:8px;background:#e2eaef;overflow:hidden;margin:2px 0 8px}.ld i{display:block;height:100%;background:linear-gradient(90deg,#2c9a4b,#e8c600,#d62839)}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>W6 · ĐO TỐC ĐỘ TRUYỀN ÂM</h1><p>ỐNG CỘNG HƯỞNG · v = 2f(l₂ − l₁) · SAI SỐ · Vật lí 11 KNTT</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>THÍ NGHIỆM</span><span>RESONANCE</span></div>
    <div class="blk" style="--c:${OR}">${row('f', 'f', OR)}${row('v thật', 'v', PU)}${row('λ=v/f', 'lam', TL)}${row('l', 'l', BL)}${row('Độ to', 'I', GR)}</div>
    <div style="font:700 11px 'JetBrains Mono',monospace;color:#5b7080;margin:-2px 0 1px">ĐỘ TO CỦA ÂM Ở MIỆNG ỐNG</div><div class="ld"><i id="ldb" style="width:0%"></i></div>
    <div class="res" id="res" style="margin:0 0 6px;padding:6px 10px;line-height:1.5;font-size:12.3px"></div>
    <table class="tb" id="tb"></table><canvas class="gr" id="g1" width="680" height="420"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div style="font:700 12px Inter;margin-bottom:4px">Chọn tần số của loa (Hz)</div><div class="fk" id="fk">${FORKS.map((v) => `<button data-f="${v}">${v}</button>`).join('')}</div>
    ${sl('T', 't nhiệt độ không khí (°C)', T_RANGE[0], T_RANGE[1], 1, RD)}${sl('l', 'l chiều dài cột khí (cm) — nâng/hạ bình nước', 0, LT * 100, 0.1, BL)}
    <div style="display:flex;gap:6px;margin-bottom:6px"><button class="btn big" id="b-l1" style="margin:0;height:40px;font-size:14px;flex:1;box-shadow:none">＋ Ghi l₁</button><button class="btn big" id="b-l2" style="margin:0;height:40px;font-size:14px;flex:1;box-shadow:none;background:#e8590c;border-color:#e8590c">＋ Ghi l₂</button></div>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12.5px Inter,sans-serif">Xoá bảng số liệu</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] loa · ống · bình nước</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="mouth">2<br>MIỆNG ỐNG</button><button data-v="water">3<br>MỰC NƯỚC</button><button data-v="bottle">4<br>BÌNH NƯỚC</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  $('s-T').addEventListener('input', (e) => hooks.cmd('T', Number(e.target.value))); $('s-l').addEventListener('input', (e) => hooks.cmd('l', Number(e.target.value) / 100));
  root.querySelectorAll('#fk button').forEach((b) => b.addEventListener('click', () => hooks.fork(Number(b.dataset.f))));
  $('b-l1').addEventListener('click', () => hooks.l1()); $('b-l2').addEventListener('click', () => hooks.l2()); $('b-clear').addEventListener('click', () => hooks.clear());
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
      for (const [k, v, txt] of [['T', s.T, f(s.T, 0) + ' °C'], ['l', s.l * 100, f(s.l * 100, 1) + ' cm']]) { const e = $('s-' + k); if (document.activeElement !== e) e.value = v; $('sv-' + k).textContent = txt; }
      root.querySelectorAll('#fk button').forEach((b) => b.classList.toggle('on', Number(b.dataset.f) === s.f));
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('f', `${f(r.f, 0)}<small>Hz</small>`, r.f / 640); set('v', `${f(r.v, 1)}<small>m/s</small>`, r.v / 360); set('lam', `${f(r.lam * 100, 1)}<small>cm</small>`, r.lam / 1.4); set('l', `${f(r.lcm, 1)}<small>cm</small>`, r.l / LT, BL); set('I', `${f(r.I * 100, 0)}<small>%</small>`, r.I, r.onRes ? GR : OR); $('ldb').style.width = (r.I * 100).toFixed(0) + '%';
      const st = r.st, cur = r.cur;
      $('res').innerHTML = r.onRes ? `<span class="ok">● CỘNG HƯỞNG</span> bậc n = ${r.n}: âm to nhất khi l + e = ${2 * r.n - 1}·λ/4<br>Hãy bấm “＋ Ghi l${cur.l1 == null ? '₁' : '₂'}” khi âm to nhất` : `Chưa cộng hưởng · âm nhỏ (${f(r.I * 100, 0)}%)<br>Nâng/hạ bình nước (thanh l) tới khi nghe to nhất`;
      $('tb').innerHTML = '<tr><th>Lần</th><th>f (Hz)</th><th>l₁ (cm)</th><th>l₂ (cm)</th><th>v (m/s)</th></tr>' + (st ? st.rows.map((q, i) => `<tr><td>${i + 1}</td><td>${q.f}</td><td>${f(q.l1, 1)}</td><td>${f(q.l2, 1)}</td><td>${f(q.v, 1)} ± ${f(q.dv, 1)}</td></tr>`).join('') : '') + (cur.l1 != null ? `<tr style="color:#e8590c"><td>…</td><td>${cur.f}</td><td>${f(cur.l1, 1)}</td><td>?</td><td>?</td></tr>` : '') + (!st && cur.l1 == null ? '<tr><td colspan="5" style="text-align:center;color:#6a8190">Chưa có số liệu · tìm cực đại rồi bấm “＋ Ghi l₁”</td></tr>' : '') + (st ? `<tr><td colspan="5" style="text-align:left;background:#eef3f6"><b>v̄ = ${f(st.vm, 1)} ± ${f(st.dvm, 1)} m/s</b> · δ = ${f(st.rel * 100, 1)}% · ${st.inside ? `<span class="ok">✔ v thật ${f(r.v, 1)} nằm trong khoảng</span>` : `v thật ${f(r.v, 1)} ngoài khoảng`}</td></tr>` : '');
      const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 66, r: 16, t: 46, b: 44}, X = (l) => m.l + (l / (LT * 100)) * (w - m.l - m.r), Y = (v) => h - m.b - v * (h - m.t - m.b);
      g.font = '23px monospace'; g.lineWidth = 1.2; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center'; for (let l = 0; l <= 100; l += 20) { g.beginPath(); g.moveTo(X(l), m.t); g.lineTo(X(l), h - m.b); g.stroke(); g.fillText(String(l), X(l), h - 14); }
      g.textAlign = 'right'; for (const v of [0, 0.5, 1]) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(w - m.r, Y(v)); g.stroke(); g.fillText(f(v, 1), m.l - 6, Y(v) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
      g.strokeStyle = PU; g.lineWidth = 4.5; g.beginPath(); for (let i = 0; i <= 600; i++) { const l = (i / 600) * LT, y = loud(s, l); i ? g.lineTo(X(l * 100), Y(y)) : g.moveTo(X(l * 100), Y(y)); } g.stroke();
      for (const rr of resonances(s)) { g.strokeStyle = 'rgba(11,143,140,.45)'; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(X(rr.l * 100), m.t + 14); g.lineTo(X(rr.l * 100), h - m.b); g.stroke(); g.setLineDash([]); g.fillStyle = TL; g.font = '700 19px monospace'; g.textAlign = 'center'; g.fillText('n=' + rr.n, X(rr.l * 100), m.t + 8); }
      for (const q of s.trials) for (const l of [q.l1, q.l2]) { g.fillStyle = OR; g.beginPath(); g.arc(X(l), Y(loud(s, l / 100)), 6, 0, 7); g.fill(); }
      g.fillStyle = r.onRes ? GR : RD; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(r.lcm), Y(r.I), 10, 0, 7); g.fill(); g.stroke();
      g.fillStyle = INK; g.font = '700 22px monospace'; g.textAlign = 'left'; g.fillText('ĐỘ TO theo l (cm)', 8, 26); g.fillStyle = '#5b7080'; g.font = '20px monospace'; g.textAlign = 'right'; g.fillText('l (cm) →', w - m.r, h - 14); void DL; void F_RANGE; void GR;
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

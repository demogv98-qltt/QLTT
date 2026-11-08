// M7 overlay: numbers, the free-body diagram, the friction-versus-pull graph and the tanα–μ graph for measuring μs.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {MATERIALS, PRESETS, RANGE, D2R} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:96px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 100px 1fr;align-items:center;gap:6px;height:23px}
.mats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}.mats button{border:1px solid #b6c6d0;background:#fff;border-radius:4px;padding:5px 4px;font:700 11.5px Inter,sans-serif;cursor:pointer;color:${INK};line-height:1.2}.mats button.on{background:${INK};color:#fff;border-color:${INK}}.mats small{display:block;font:500 10px 'JetBrains Mono',monospace;opacity:.8}
svg.fbd{width:100%;height:120px;background:#fff;border:1px solid #c9d6de;border-radius:4px;display:block;margin-bottom:6px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M7 · MA SÁT &amp; MẶT PHẲNG NGHIÊNG</h1><p>VÁN NGHIÊNG · LỰC KẾ · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>LỰC TÁC DỤNG LÊN VẬT</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${TL}">${row('P=mg', 'P', RD)}${row('N', 'N', TL)}${row('Px', 'Px', RD)}${row('Fms', 'fr', OR)}${row('F kéo', 'F', PU)}${row('a', 'a', INK)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <svg class="fbd" id="fbd" viewBox="-170 -75 340 150"></svg>
    <canvas class="gr" id="g1" width="680" height="236"></canvas><canvas class="gr" id="g2" width="680" height="236"></canvas><div class="res" id="res" style="line-height:1.5;font-size:12px"></div></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="mats">${MATERIALS.map((m, i) => `<button data-m="${i}">${m.vi}<small>μs=${m.mus} · μk=${m.muk}</small></button>`).join('')}</div>
    ${sl('alpha', 'α góc nghiêng (độ)', RANGE.alpha[0], RANGE.alpha[1], 0.5, OR)}${sl('m', 'm khối lượng (kg)', RANGE.m[0], RANGE.m[1], 1, TL)}${sl('F', 'F lực kéo của lực kế (N)', RANGE.F[0], RANGE.F[1], 0.5, PU)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="pre" id="b-reset" style="margin:0;flex:1;text-align:center;font:700 13px Inter,sans-serif">↺ Đặt vật về giữa ván</button></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BỀ MẶT TIẾP XÚC<small>[T] nhấc vật · kính lúp · lò xo lực kế</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="side">2<br>NHÌN NGANG</button><button data-v="block">3<br>VẬT</button><button data-v="scale">4<br>LỰC KẾ</button></div>
    <div class="small">Kéo chuột để xoay · lăn chuột để zoom. Tăng góc nghiêng từ từ cho tới khi vật bắt đầu trượt: máy tự ghi α₀ và tính μs = tan α₀.</div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['alpha', 'm', 'F']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.mats button').forEach((b) => b.addEventListener('click', () => hooks.mat(Number(b.dataset.m))));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-reset').addEventListener('click', () => hooks.reset()); $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));

  function axes(g, w, h, m, x1, y1, xl, yl) {
    const X = (x) => m.l + (x / x1) * (w - m.l - m.r), Y = (y) => h - m.b - (y / y1) * (h - m.t - m.b);
    g.font = '19px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
    for (let i = 0; i <= 4; i++) { const x = (x1 * i) / 4; g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.fillText(String(Math.round(x * 10) / 10), X(x), h - 6); }
    g.textAlign = 'right'; for (let i = 0; i <= 4; i++) { const y = (y1 * i) / 4; g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); g.fillText(String(Math.round(y * 100) / 100), m.l - 6, Y(y) + 7); }
    g.strokeStyle = '#7d93a0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(x1), Y(0)); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(y1)); g.stroke();
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(xl, w - 6, Y(0) - 8); g.textAlign = 'left'; g.fillText(yl, m.l + 8, m.t + 14); return {X, Y};
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    sliders(s) { for (const k of ['alpha', 'm', 'F']) { const e = $('s-' + k); if (document.activeElement !== e) e.value = s[k]; $('sv-' + k).textContent = f(s[k], k === 'alpha' || k === 'F' ? 1 : 0) + (k === 'alpha' ? '°' : k === 'm' ? ' kg' : ' N'); } root.querySelectorAll('.mats button').forEach((b) => b.classList.toggle('on', Number(b.dataset.m) === s.mat)); },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · ĐẶT VẬT XUỐNG' : 'TEARDOWN · BỀ MẶT TIẾP XÚC'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('P', `${f(r.P, 1)}<small>N</small>`, r.P / 100); set('N', `${f(r.N, 1)}<small>N</small>`, r.N / 100); set('Px', `${f(r.Px, 1)}<small>N</small>`, r.Px / 100); set('fr', `${f(r.fr, 1)}<small>N</small>`, r.fr / 100); set('F', `${f(r.F, 1)}<small>N</small>`, r.F / 100); set('a', `${f(r.acc, 2)}<small>m/s²</small>`, r.acc / 10);
      $('tag').innerHTML = `Vật <b>${r.state}</b> · tan α = ${f(r.tanA, 3)} ${r.tanA <= r.mat.mus ? '≤' : '>'} μs = ${f(r.mat.mus, 2)}`;
      $('res').innerHTML = `Góc trượt lí thuyết α₀ = arctan μs = <b>${f(r.critical, 1)}°</b><br>` + (r.muMeasured !== null ? `Đã đo: vật bắt đầu trượt ở α = <b>${f(r.alphaSlide, 1)}°</b> → μs = tan α = <b>${f(r.muMeasured, 3)}</b> <span class="ok">✔ khớp bảng ${f(r.mat.mus, 2)}</span>` : 'Chưa đo: đặt F = 0 rồi tăng α từ từ cho đến khi vật trượt.') + (r.pulled !== null ? `<br>Ở mặt ngang vật nhúc nhích khi F ≈ <b>${f(r.pulled, 1)}</b> N = μs·N = ${f(r.staticMax, 1)} N` : '');
      // free-body diagram in the frame of the slope: x along the slope (up), y out of the plank
      const sc = 78 / Math.max(25, r.P), a = s.alpha * D2R, svg = $('fbd'); const Px = -r.Px, Py = -r.N; // weight components in that frame
      const arrow = (x, y, c, dash = false) => (Math.hypot(x, y) < 0.5 ? '' : `<line x1="0" y1="0" x2="${(x * sc).toFixed(1)}" y2="${(-y * sc).toFixed(1)}" stroke="${c}" stroke-width="${dash ? 2 : 3.5}" ${dash ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#m${c.slice(1)})"/>`);
      const defs = [RD, TL, OR, PU, '#8a98a3'].map((c) => `<marker id="m${c.slice(1)}" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="${c}"/></marker>`).join('');
      svg.innerHTML = `<defs>${defs}</defs><line x1="-165" y1="0" x2="165" y2="0" stroke="#d3dde3"/><line x1="0" y1="-72" x2="0" y2="72" stroke="#d3dde3"/>${arrow(Px, 0, '#8a98a3', true)}${arrow(0, Py, '#8a98a3', true)}${arrow(Px, Py, RD)}${arrow(0, r.N, TL)}${arrow(r.fr, 0, OR)}${arrow(r.F, 0, PU)}
        <rect x="-12" y="-9" width="24" height="18" fill="#1f6d78" opacity=".35"/><text x="-163" y="-60" font-size="10" fill="#6a8190" font-family="monospace">sơ đồ lực (x dọc ván, y vuông góc) · α = ${f(s.alpha, 0)}°</text>`;
      // graph 1: friction versus the force that tries to move the block
      let c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const xm = Math.max(10, r.staticMax * 1.6), A = axes(g, w, h, {l: 64, r: 14, t: 10, b: 26}, xm, xm, '|lực kéo vật| (N)', '|Fms| (N)');
      g.strokeStyle = 'rgba(20,48,60,.35)'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(A.X(0), A.Y(0)); g.lineTo(A.X(r.staticMax), A.Y(r.staticMax)); g.lineTo(A.X(r.staticMax), A.Y(r.kinetic)); g.lineTo(A.X(xm), A.Y(r.kinetic)); g.stroke();
      g.fillStyle = INK; g.font = '700 18px monospace'; g.textAlign = 'left'; g.fillText('μs·N', A.X(r.staticMax) + 6, A.Y(r.staticMax) - 6); g.fillText('μk·N', A.X(xm) - 62, A.Y(r.kinetic) - 8);
      g.fillStyle = OR; g.beginPath(); g.arc(A.X(Math.min(xm, Math.abs(r.drive))), A.Y(Math.min(xm, Math.abs(r.fr))), 9, 0, 7); g.fill();
      // graph 2: tan α against α, with the μs line: where they cross the block starts to slide
      c = $('g2'); g = c.getContext('2d'); g.clearRect(0, 0, w, h);
      const A2 = axes(g, w, h, {l: 64, r: 14, t: 10, b: 26}, 60, 1.8, 'α (độ)', 'tan α');
      g.strokeStyle = 'rgba(20,48,60,.5)'; g.lineWidth = 3.5; g.beginPath(); for (let a2 = 0; a2 <= 60; a2 += 1) { const x = A2.X(a2), y = A2.Y(Math.tan(a2 * D2R)); a2 ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.strokeStyle = OR; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(A2.X(0), A2.Y(r.mat.mus)); g.lineTo(A2.X(60), A2.Y(r.mat.mus)); g.stroke(); g.setLineDash([]);
      g.fillStyle = OR; g.font = '700 18px monospace'; g.textAlign = 'left'; g.fillText('μs = ' + f(r.mat.mus, 2), A2.X(2), A2.Y(r.mat.mus) - 8);
      g.fillStyle = INK; g.beginPath(); g.arc(A2.X(s.alpha), A2.Y(r.tanA), 9, 0, 7); g.fill();
      if (r.alphaSlide !== null) { g.strokeStyle = TL; g.lineWidth = 3; g.beginPath(); g.moveTo(A2.X(r.alphaSlide), A2.Y(0)); g.lineTo(A2.X(r.alphaSlide), A2.Y(r.muMeasured)); g.stroke(); }
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

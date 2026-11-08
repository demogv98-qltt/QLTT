// M5 overlay: the same 1600 x 900 stage and panel style as the lever, with its own panels.
import {CSS as BASE} from '../khtn8-lever/ui.js';
import {PRESETS, FMAX} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', PU = '#5b3cc4', SL = '#4d6573', INK = '#14303c';
export const CSS = BASE + `
.mini{width:100%;height:178px;background:#fff;border:1px solid #c9d6de;border-radius:4px;display:block}
.res{border:1px solid #c9d6de;border-radius:4px;background:#fff;padding:7px 10px;margin:2px 0 9px;font:600 13px 'JetBrains Mono',monospace;line-height:1.75}
.res b{font-weight:800}.res .ok{color:#2d7d3a}
.tabs{display:flex;gap:6px;margin-bottom:10px}.tabs button{flex:1;height:34px;border:1px solid #b6c6d0;background:#fff;border-radius:4px;font:800 13px 'Inter',sans-serif;cursor:pointer;color:${INK}}
.tabs button.on{background:${INK};color:#fff;border-color:${INK}}
.g2{display:grid;grid-template-columns:74px 80px 1fr;align-items:center;gap:8px;height:25px}
`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',').replace('-', '−') : '∞');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M5 · TỔNG HỢP &amp; PHÂN TÍCH LỰC</h1><p>BỘ BA LỰC KẾ · Bài thực hành · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const names = ['F₁', 'F₂', 'F₃'], cols = [OR, TL, SL], sub = ['Lực kế 1 · 20 N', 'Lực kế 2 · 20 N', 'Lực kế 3 · 50 N'];
  const blk = (i) => `<div class="blk" style="--c:${cols[i]}"><div class="bt"><span>${sub[i]}</span><span id="role${i}"></span></div>
    <div class="g2"><span class="k">${names[i]}</span><span class="v" id="F${i}"></span><div class="bg"><i id="bF${i}" style="background:${cols[i]}"></i></div></div>
    <div class="g2"><span class="k">hướng</span><span class="v" id="th${i}"></span><span></span></div>
    <div class="g2"><span class="k">Δl=F/k</span><span class="v" id="ex${i}"></span><span class="small" id="kk${i}"></span></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>SỐ ĐO CÁC LỰC KẾ</span><span>TELEMETRY</span></div>${[0, 1, 2].map(blk).join('')}
    <div class="res" id="res"></div><svg class="mini" id="mini" viewBox="-130 -90 260 180"></svg></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}–${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN THÍ NGHIỆM</span><span>CONTROLS</span></div>
    <div class="tabs"><button id="tabT" class="on">Tổng hợp lực</button><button id="tabP">Phân tích lực</button></div>
    <div id="pT">${sl('F1', 'F₁ Lực kéo của lực kế 1', 0, 20, 0.5, OR)}${sl('F2', 'F₂ Lực kéo của lực kế 2', 0, 20, 0.5, TL)}${sl('al', 'α Góc giữa F₁ và F₂ (độ)', 0, 180, 1, PU)}</div>
    <div id="pP" style="display:none">${sl('F', 'F Lực cần phân tích (N)', 0, 20, 0.5, PU)}${sl('beta', 'β Góc so với trục Ox (độ)', 0, 360, 1, PU)}</div>
    <div class="ptitle" style="margin-top:4px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${i + 1}. ${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH LỰC KẾ<small>[T] mở vỏ · lò xo · thang đo · kim chỉ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="top">2<br>NHÌN TỪ TRÊN</button><button data-v="meter">3<br>LỰC KẾ 1</button><button data-v="knot">4<br>NÚT BUỘC</button></div>
    <div class="small">Kéo chuột để xoay · lăn chuột để zoom. Nút buộc đứng yên khi tổng ba lực = 0; lực kế 3 luôn đọc đúng độ lớn hợp lực.</div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['F1', 'F2', 'al', 'F', 'beta']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('.pre').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  $('tabT').addEventListener('click', () => hooks.mode('T')); $('tabP').addEventListener('click', () => hooks.mode('P'));

  const api = {
    root,
    setBottom(y) { B.bottom = y; },
    setMode(m) { $('tabT').classList.toggle('on', m === 'T'); $('tabP').classList.toggle('on', m === 'P'); $('pT').style.display = m === 'T' ? '' : 'none'; $('pP').style.display = m === 'P' ? '' : 'none'; },
    sliders(c) { for (const k of ['F1', 'F2', 'al', 'F', 'beta']) { const s = $('s-' + k); if (document.activeElement !== s) s.value = c[k]; $('sv-' + k).textContent = k === 'al' || k === 'beta' ? Math.round(c[k]) + '°' : f(c[k]) + ' N'; } },
    setPreset: (i) => root.querySelectorAll('.pre').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP LỰC KẾ' : 'TEARDOWN · BÓC TÁCH LỰC KẾ'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r) {
      const T = r.mode === 'T';
      r.m.forEach((q, i) => {
        $('F' + i).innerHTML = `${f(q.F, 2)}<small>N</small>`; $('th' + i).innerHTML = `${f(q.th, 1)}<small>°</small>`; $('ex' + i).innerHTML = `${f(q.ext * 100, 2)}<small>cm</small>`;
        $('bF' + i).style.width = Math.min(100, (q.F / q.full) * 100) + '%'; $('kk' + i).textContent = `k = ${Math.round(q.full / 0.1)} N/m`;
        $('role' + i).textContent = T ? (i < 2 ? 'LỰC THÀNH PHẦN' : 'LỰC CÂN BẰNG') : (i === 0 ? 'LỰC F' : i === 1 ? 'ĐỌC Fx' : 'ĐỌC Fy');
      });
      $('res').innerHTML = T
        ? `α = <b>${f(r.al, 1)}°</b><br>F = √(F₁²+F₂²+2F₁F₂cosα) = <b>${f(r.Fformula, 3)}</b> N<br>|F₁ + F₂| = <b>${f(r.Rmag, 3)}</b> N · F₃ = <b>${f(r.m[2].F, 3)}</b> N<br>ΣF = ${f(r.residual, 3)} N <span class="ok">${r.residual < 0.01 ? '✔ nút buộc cân bằng' : '… đang ổn định'}</span>`
        : `F = <b>${f(r.F, 2)}</b> N · β = <b>${f(r.beta, 1)}°</b><br>Fx = F·cosβ = <b>${f(r.Fx, 3)}</b> N (lực kế 2 đọc ${f(r.m[1].F, 3)})<br>Fy = F·sinβ = <b>${f(r.Fy, 3)}</b> N (lực kế 3 đọc ${f(r.m[2].F, 3)})<br>√(Fx²+Fy²) = ${f(Math.hypot(r.Fx, r.Fy), 3)} N <span class="ok">${Math.abs(Math.hypot(r.Fx, r.Fy) - r.F) < 1e-6 ? '✔ khớp F' : ''}</span>`;
      // live vector diagram, 1 N = s px
      const vs = r.m.map((q) => q.v), mx = Math.max(8, ...vs.map((v) => Math.hypot(...v))), s = 78 / mx, P = (v) => `${(v[0] * s).toFixed(1)},${(-v[1] * s).toFixed(1)}`;
      const ar = (v, c) => (Math.hypot(...v) < 0.05 ? '' : `<line x1="0" y1="0" x2="${(v[0] * s).toFixed(1)}" y2="${(-v[1] * s).toFixed(1)}" stroke="${c}" stroke-width="3" marker-end="url(#h${c.slice(1)})"/>`);
      const heads = [OR, TL, PU, SL].map((c) => `<marker id="h${c.slice(1)}" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="${c}"/></marker>`).join('');
      let body;
      if (T) { const R = r.R; body = `<polygon points="0,0 ${P(vs[0])} ${P(R)} ${P(vs[1])}" fill="rgba(91,60,196,.07)" stroke="#9aa9b4" stroke-dasharray="4 3"/>${ar(vs[0], OR)}${ar(vs[1], TL)}${ar(R, PU)}${ar(vs[2], SL)}`; }
      else { const F = vs[0]; body = `<rect x="${Math.min(0, F[0] * s)}" y="${Math.min(0, -F[1] * s)}" width="${Math.abs(F[0] * s)}" height="${Math.abs(F[1] * s)}" fill="rgba(91,60,196,.07)" stroke="#9aa9b4" stroke-dasharray="4 3"/>${ar([F[0], 0], OR)}${ar([0, F[1]], TL)}${ar(F, PU)}`; }
      $('mini').innerHTML = `<defs>${heads}</defs><line x1="-125" y1="0" x2="125" y2="0" stroke="#c4d2da"/><line x1="0" y1="-85" x2="0" y2="85" stroke="#c4d2da"/>${body}<circle r="3.5" fill="${INK}"/><text x="-124" y="-76" font-size="10" fill="#6a8190">sơ đồ lực (tỉ lệ ${f(s / 1, 1)} px/N)</text>`;
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
      for (let k = 0; k < 24; k++) { let mv = false; for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) { const A = act[i], B = act[j], ox = (A.w + B.w) / 2 + 6 - Math.abs(A.x - B.x), oy = (A.h + B.h) / 2 + 6 - Math.abs(A.y - B.y); if (ox > 0 && oy > 0) { const d = B.y >= A.y ? 1 : -1; B.y += d * (oy / 2 + 1); A.y -= d * (oy / 2 + 1); mv = true; } } act.forEach(cl); if (!mv) break; }
      for (const {it, o, x, y} of act) { o.d.style.left = x + 'px'; o.d.style.top = y + 'px'; const far = Math.hypot(x - it.x, y - it.y) > 6; o.ln.style.display = far ? '' : 'none'; if (far) { o.ln.setAttribute('x1', it.x); o.ln.setAttribute('y1', it.y); o.ln.setAttribute('x2', x); o.ln.setAttribute('y2', y); o.ln.setAttribute('stroke', it.color); o.ln.style.opacity = it.a; } }
      for (const id of Object.keys(labs)) if (!seen.has(id)) labs[id].d.style.display = labs[id].ln.style.display = 'none';
    },
  };
  void FMAX;
  return api;
}

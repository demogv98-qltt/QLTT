// M14 overlay: telemetry for pressure and density, and the p–h graph for every liquid.
import {CSS as BASE} from '../vl10-m5/ui.js';
import {A_MAX, A_MIN, G, H_TANK, LIQUIDS, PRESETS, SOLIDS} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', RD = '#c0392b', BL = '#2a6fdb';
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const CSS = BASE + `canvas.gr{width:100%;height:200px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:62px 112px 1fr;align-items:center;gap:6px;height:24px}.sp{display:flex;gap:5px;margin-bottom:8px}.sp button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:5px 1px;font:700 11.5px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.3}.sp button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.sp small{display:block;font:600 10.5px 'JetBrains Mono',monospace;opacity:.85}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');
const fk = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>VL10-M14 · KHỐI LƯỢNG RIÊNG &amp; ÁP SUẤT</h1><p>BỂ KÍNH, ĐẦU DÒ ÁP SUẤT, KHỐI NỔI – CHÌM · Vật lí 10 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  const row = (k, id, c) => `<div class="g3"><span class="k">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span>ÁP SUẤT CHẤT LỎNG</span><span>PRESSURE</span></div>
    <div class="blk" style="--c:${BL}">${row('ρ lỏng', 'rl', '#3b9fd9')}${row('h', 'h', OR)}${row('p=ρgh', 'p', BL)}${row('p tổng', 'pa', INK)}</div>
    <div class="ptitle" style="margin-top:4px"><span>KHỐI NỔI – CHÌM</span><span>BLOCK</span></div>
    <div class="blk" style="--c:${TL}">${row('m', 'm', '#8a6a1c')}${row('ρ vật', 'rv', TL)}${row('F_A', 'fb', PU)}${row('P', 'pw', TL)}</div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px;line-height:1.45"></div>
    <canvas class="gr" id="g1" width="680" height="400"></canvas></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div style="font:700 12px Inter;margin-bottom:4px">Chất lỏng trong bể</div><div class="sp" id="spl">${LIQUIDS.map((p, i) => `<button data-l="${i}">${p.vi}<small>${p.rho} kg/m³</small></button>`).join('')}</div>
    ${sl('h', 'h độ sâu đầu dò (cm)', 5, 115, 1, OR)}
    <div style="font:700 12px Inter;margin:6px 0 4px">Khối thả vào bể</div><div class="sp" id="sps">${SOLIDS.map((p, i) => `<button data-s="${i}">${p.vi}<small>${p.rho} kg/m³</small></button>`).join('')}</div>
    ${sl('a', 'a cạnh khối (cm)', A_MIN * 100, A_MAX * 100, 1, TL)}
    <div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn big" id="b-drop" style="margin:0;height:40px;font-size:14px;flex:2;box-shadow:none">▼ Thả khối</button><button class="pre" id="b-hold" style="margin:0;width:auto;flex:1;text-align:center;font:700 12.5px Inter,sans-serif">↑ Nhấc lên</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH BỂ<small>[T] đầu dò · màng đo · thành bể</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="probe">2<br>ĐẦU DÒ</button><button data-v="block">3<br>KHỐI</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  $('s-h').addEventListener('input', (e) => hooks.cmd('h', Number(e.target.value) / 100)); $('s-a').addEventListener('input', (e) => hooks.cmd('a', Number(e.target.value) / 100));
  root.querySelectorAll('#spl button').forEach((b) => b.addEventListener('click', () => hooks.liquid(Number(b.dataset.l))));
  root.querySelectorAll('#sps button').forEach((b) => b.addEventListener('click', () => hooks.solid(Number(b.dataset.s))));
  $('b-drop').addEventListener('click', () => hooks.drop()); $('b-hold').addEventListener('click', () => hooks.hold()); $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH BỂ'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    update(r, s) {
      root.querySelectorAll('#spl button').forEach((b) => b.classList.toggle('on', Number(b.dataset.l) === s.liq)); root.querySelectorAll('#sps button').forEach((b) => b.classList.toggle('on', Number(b.dataset.s) === s.sol));
      for (const [k, v, txt] of [['h', s.h * 100, f(s.h * 100, 0) + ' cm'], ['a', s.a * 100, f(s.a * 100, 0) + ' cm']]) { const e = $('s-' + k); if (document.activeElement !== e) e.value = v; $('sv-' + k).textContent = txt; }
      $('b-drop').disabled = false; $('b-drop').textContent = s.released ? '↻ Thả lại' : '▼ Thả khối';
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      set('rl', `${fk(r.rl)}<small>kg/m³</small>`, r.rl / 13600 * 4); set('h', `${f(r.h * 100, 0)}<small>cm</small>`, r.h / H_TANK); set('p', `${f(r.pl, 0)}<small>Pa</small>`, r.pl / 15000); set('pa', `${f((r.pAbs) / 1000, 2)}<small>kPa</small>`, r.pAbs / 120000);
      set('m', `${f(r.m, 2)}<small>kg</small>`, r.m / 220); set('rv', `${fk(r.rv)}<small>kg/m³</small>`, r.rv / 8000); set('fb', `${f(r.Fb, 1)}<small>N</small>`, r.Fb / Math.max(r.P, 1)); set('pw', `${f(r.P, 1)}<small>N</small>`, 1, TL);
      $('tag').innerHTML = !s.released ? 'Khối chưa thả. Bấm <b>▼ Thả khối</b>.' : r.floats ? `<b style="color:#0b8f8c">Nổi</b>: ρ vật ${fk(r.rv)} &lt; ρ lỏng ${fk(r.rl)} · F_A = P · chìm <b>${f(r.sub * 100, 1)} cm</b> / ${f(r.a * 100, 0)} cm` : `<b style="color:#c0392b">Chìm</b>: ρ vật ${fk(r.rv)} &gt; ρ lỏng ${fk(r.rl)} · F_A = ${f(r.Fb, 1)} N &lt; P = ${f(r.P, 1)} N`;
      const c = $('g1'), g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
      const m = {l: 76, r: 16, t: 30, b: 34}, HM = 1.2, PM = 16, X = (x) => m.l + (x / HM) * (w - m.l - m.r), Y = (y) => h - m.b - (Math.min(y, PM) / PM) * (h - m.t - m.b);
      g.font = '17px monospace'; g.lineWidth = 1.4; g.strokeStyle = '#e2eaef'; g.fillStyle = INK; g.textAlign = 'center';
      for (let x = 0; x <= 120; x += 20) { g.beginPath(); g.moveTo(X(x / 100), Y(0)); g.lineTo(X(x / 100), Y(PM)); g.stroke(); g.fillText(String(x), X(x / 100), h - 10); }
      g.textAlign = 'right'; for (let y = 0; y <= PM; y += 4) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(HM), Y(y)); g.stroke(); g.fillText(String(y), m.l - 8, Y(y) + 6); }
      g.strokeStyle = '#7d93a0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(HM), Y(0)); g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(PM)); g.stroke();
      LIQUIDS.forEach((L, i) => { const cur = i === s.liq; g.strokeStyle = hex(L.col); g.globalAlpha = cur ? 1 : 0.5; g.lineWidth = cur ? 6 : 3; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(HM), Y(L.rho * G * HM / 1000)); g.stroke(); g.globalAlpha = 1; });
      g.fillStyle = INK; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(s.h), Y(r.pl / 1000), 10, 0, 7); g.fill(); g.stroke();
      g.font = '700 17px monospace'; g.textAlign = 'left'; g.fillStyle = INK; g.fillText('p (kPa)', 6, 20); g.textAlign = 'right'; g.fillText('h (cm)', w - 6, h - 36); g.fillText('đường p = ρgh: dốc hơn khi ρ lớn', w - 8, 20);
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

// B7 overlay: máy phát (Φ(t), e(t)) và máy biến áp (u₁(t), u₂(t), tỉ số, hiệu suất).
import {CSS as BASE} from '../vl10-m5/ui.js';
import {PRESETS, RANGE} from './physics.js';

const OR = '#e8590c', TL = '#0b8f8c', INK = '#14303c', PU = '#5b3cc4', BL = '#2b59c3', GR = '#2c9a4b', RD = '#c0392b';
export const CSS = BASE + `canvas.gr{width:100%;height:175px;display:block;background:#fff;border:1px solid #c9d6de;border-radius:4px;margin-bottom:6px}.g3{display:grid;grid-template-columns:70px 112px 1fr;align-items:center;gap:6px;height:24px}table.tb{width:100%;border-collapse:collapse;font:600 12px 'JetBrains Mono',monospace;margin-bottom:6px}table.tb th{background:#14303c;color:#fff;font-weight:700;padding:3px 4px;text-align:right}table.tb td{border-bottom:1px solid #dde6ec;padding:2px 4px;text-align:right}.rw{display:flex;gap:6px;margin-bottom:6px}.md{display:flex;gap:5px;margin-bottom:8px}.md button,.tg button{flex:1;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 2px;font:700 12px Inter,sans-serif;color:#14303c;cursor:pointer;line-height:1.25}.md button.on,.tg button.on{background:#0b8f8c;border-color:#0b8f8c;color:#fff}.tg{display:flex;gap:5px;margin-bottom:8px}#left .g3 .v{font-size:12.5px;white-space:nowrap}#left .g3 .v small{font-size:9px}`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const f = (v, d = 1) => (Math.abs(v) < 5 * Math.pow(10, -d - 1) ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

export function createUI(app, hooks) {
  const root = el('<div id="ui"></div>'); app.appendChild(root);
  root.appendChild(el('<div class="mhdr"><div class="bar"></div><div><h1>B7 · MÁY PHÁT ĐIỆN VÀ MÁY BIẾN ÁP</h1><p>e = NBSω·sinωt · U₂/U₁ = N₂/N₁ · HIỆU SUẤT · Vật lí 12 Kết nối tri thức</p></div></div>'));
  root.appendChild(el('<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>'));
  root.appendChild(el(`<div class="panel" id="left"><div class="ptitle"><span id="lt">SỐ LIỆU</span><span>METER</span></div>
    <div class="blk" style="--c:${OR}" id="rows"></div>
    <div class="res" id="tag" style="margin:0 0 6px;padding:5px 10px"></div>
    <canvas class="gr" id="g1" width="680" height="350"></canvas><canvas class="gr" id="g2" width="680" height="350"></canvas>
    <table class="tb" id="tb"></table></div>`));
  const sl = (id, label, a, b, step, c) => `<div class="sl" style="--c:${c}" id="sw-${id}"><div class="top"><div>${label} <span>${a}…${b}</span></div><b id="sv-${id}"></b></div><input id="s-${id}" type="range" min="${a}" max="${b}" step="${step}"></div>`;
  root.appendChild(el(`<div class="panel" id="right"><div class="ptitle"><span>BẢNG ĐIỀU KHIỂN</span><span>CONTROLS</span></div>
    <div class="md" id="md"><button data-m="gen">Máy phát<br>điện xoay chiều</button><button data-m="tr">Máy<br>biến áp</button></div>
    <div id="pg">${sl('n', 'n tốc độ quay (vòng/s)', RANGE.n[0], RANGE.n[1], 0.1, PU)}${sl('N', 'N số vòng của khung', RANGE.N[0], RANGE.N[1], 10, BL)}${sl('B', 'B cảm ứng từ (T)', RANGE.B[0], RANGE.B[1], 0.01, RD)}${sl('RL', 'R điện trở tải đèn (Ω)', RANGE.RL[0], RANGE.RL[1], 1, TL)}</div>
    <div id="pt">${sl('N1', 'N₁ số vòng sơ cấp', RANGE.N1[0], RANGE.N1[1], 10, BL)}${sl('N2', 'N₂ số vòng thứ cấp', RANGE.N2[0], RANGE.N2[1], 10, RD)}${sl('U1', 'U₁ điện áp hiệu dụng sơ cấp (V)', RANGE.U1[0], RANGE.U1[1], 0.5, PU)}${sl('RLt', 'R_tải (Ω)', RANGE.RLt[0], RANGE.RLt[1], 1, TL)}
      <div class="tg"><button id="t-load">Tải: CÓ</button><button id="t-ideal">Biến áp: THỰC</button></div></div>
    <div class="rw"><button class="btn big" id="b-rec" style="margin:0;height:36px;font-size:14px;flex:2;box-shadow:none">＋ Ghi số liệu</button><button class="pre" id="b-clear" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">Xoá bảng</button><button class="pre" id="b-run" style="margin:0;flex:1;text-align:center;font:700 12px Inter,sans-serif">❚❚ Dừng</button><select id="spd" style="flex:1;border:1px solid #b6c6d0;border-radius:4px;font:700 13px Inter"><option value="0.1">×0,1</option><option value="0.25">×0,25</option><option value="0.5">×0,5</option><option value="1" selected>×1</option></select></div>
    <div class="ptitle" style="margin-top:2px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}" style="padding:5px 10px;margin-bottom:5px"><b style="font-size:13px">${p.vi}</b><span>${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td" style="margin-top:4px">TEARDOWN · BÓC TÁCH<small>[T] nam châm/lõi thép · khung dây/cuộn dây</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="close">2<br>CẬN CẢNH</button><button data-v="top">3<br>TỪ TRÊN</button><button data-v="side">4<br>TỪ BÊN</button></div></div>`));
  const B = {top: 84, bottom: 870};
  const labels = el('<div id="labels"><svg id="leaders" viewBox="0 0 1600 900"></svg></div>'); root.insertBefore(labels, root.firstChild);
  const leaders = labels.querySelector('#leaders'), labs = {};
  const $ = (id) => root.querySelector('#' + id);
  for (const k of ['n', 'N', 'B', 'RL', 'N1', 'N2', 'U1', 'RLt']) $('s-' + k).addEventListener('input', (e) => hooks.cmd(k, Number(e.target.value)));
  root.querySelectorAll('#md button').forEach((b) => b.addEventListener('click', () => hooks.mode(b.dataset.m)));
  $('t-load').addEventListener('click', () => hooks.toggle('loaded')); $('t-ideal').addEventListener('click', () => hooks.toggle('idealT')); $('b-run').addEventListener('click', () => hooks.runToggle());
  $('b-rec').addEventListener('click', () => hooks.record()); $('b-clear').addEventListener('click', () => hooks.clear());
  root.querySelectorAll('.pre[data-i]').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  $('spd').addEventListener('change', (e) => hooks.speed(Number(e.target.value)));
  $('b-td').addEventListener('click', () => hooks.teardown()); $('b-tour').addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));
  const row = (k, id, c) => `<div class="g3"><span class="k" style="white-space:nowrap;font-size:11px">${k}</span><span class="v" id="v${id}"></span><div class="bg"><i id="b${id}" style="background:${c}"></i></div></div>`;
  let rowsMode = '';
  function plot(c, series, T, label, extra) {
    const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); const m = {l: 76, r: 12, t: 26, b: 22}; let mx = 1e-9; for (const s of series) for (const p of s.pts) mx = Math.max(mx, Math.abs(p[1])); mx = extra.fixed || mx * 1.15;
    const X = (t) => m.l + ((t) / T) * (w - m.l - m.r), Y = (v) => h / 2 - (v / mx) * (h / 2 - m.t - 2); g.font = '15px monospace'; g.fillStyle = INK; g.strokeStyle = '#e2eaef'; g.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(m.l, Y(k * mx / 1.15)); g.lineTo(w - m.r, Y(k * mx / 1.15)); g.stroke(); } g.strokeStyle = '#7d93a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(m.l, Y(0)); g.lineTo(w - m.r, Y(0)); g.stroke();
    g.textAlign = 'right'; const fm = (v) => f(v, Math.abs(v) < 10 ? 2 : 1); g.fillText(fm(mx / 1.15 * (extra.scale || 1)), m.l - 6, Y(mx / 1.15) + 5); g.fillText('0', m.l - 6, Y(0) + 5); g.fillText(fm(-mx / 1.15 * (extra.scale || 1)), m.l - 6, Y(-mx / 1.15) + 5);
    for (const s of series) { g.strokeStyle = s.col; g.lineWidth = 3; g.beginPath(); s.pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); }
    g.textAlign = 'left'; g.font = '700 15px monospace'; g.fillStyle = INK; g.fillText(label, 6, 17); if (extra.cursor !== undefined) { g.strokeStyle = 'rgba(20,48,60,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(extra.cursor), m.t); g.lineTo(X(extra.cursor), h - m.b); g.stroke(); }
  }
  return {
    root, setBottom(y) { B.bottom = y; },
    setPreset: (i) => root.querySelectorAll('.pre[data-i]').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown(on, td) { const b = $('b-td'); b.classList.toggle('on', on); b.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP VỎ' : 'TEARDOWN · BÓC TÁCH'; $('mode').classList.toggle('on', td > 0.5); $('mode').textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI'; },
    setTour(state) { const b = $('b-tour'); b.classList.toggle('on', state !== 'off'); b.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`; $('tourchip').classList.toggle('on', state === 'run'); $('tourchip').textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○'; },
    syncSliders(s) { $('pg').style.display = s.mode === 'gen' ? '' : 'none'; $('pt').style.display = s.mode === 'tr' ? '' : 'none'; for (const k of ['n', 'N', 'B', 'RL', 'N1', 'N2', 'U1', 'RLt']) { const i = $('s-' + k); if (document.activeElement !== i) i.value = s[k]; $('sv-' + k).textContent = k === 'n' ? `${f(s[k], 1)} vòng/s` : k === 'B' ? `${f(s[k], 2)} T` : k === 'U1' ? `${f(s[k], 1)} V` : (k === 'RL' || k === 'RLt') ? `${s[k]} Ω` : `${s[k]} vòng`; } },
    update(r, s) {
      root.querySelectorAll('#md button').forEach((b) => b.classList.toggle('on', b.dataset.m === s.mode)); $('t-load').classList.toggle('on', s.loaded); $('t-load').textContent = s.loaded ? 'Tải: CÓ' : 'Tải: KHÔNG (hở)'; $('t-ideal').classList.toggle('on', s.idealT); $('t-ideal').textContent = s.idealT ? 'Biến áp: LÍ TƯỞNG' : 'Biến áp: THỰC'; $('b-run').textContent = s.run ? '❚❚ Dừng' : '▶ Chạy';
      if (rowsMode !== s.mode) { rowsMode = s.mode; $('rows').innerHTML = s.mode === 'gen' ? row('E₀=NBSω', 'a', RD) + row('E hiệu dụng', 'b', OR) + row('f = n', 'c', PU) + row('I hiệu dụng', 'd', GR) + row('P tải', 'e', TL) : row('U₁', 'a', BL) + row('U₂', 'b', RD) + row('U₂/U₁', 'c', PU) + row('I₂', 'd', GR) + row('H = P₂/P₁', 'e', TL); $('lt').textContent = s.mode === 'gen' ? 'MÁY PHÁT' : 'MÁY BIẾN ÁP'; }
      const set = (id, txt, bar, col) => { $('v' + id).innerHTML = txt; const b = $('b' + id); b.style.width = Math.min(100, Math.abs(bar) * 100) + '%'; if (col) b.style.background = col; };
      if (s.mode === 'gen') { const g = r.g; set('a', `${f(g.E0, 2)}<small>V</small>`, g.E0 / 12); set('b', `${f(g.Erms, 2)}<small>V</small>`, g.Erms / 8); set('c', `${f(g.f, 1)}<small>Hz</small>`, g.f / 5); set('d', `${f(g.Irms * 1000, 0)}<small>mA</small>`, g.Irms / 0.8); set('e', `${f(g.P * 1000, 0)}<small>mW</small>`, g.P / 1);
        $('tag').innerHTML = `e = −N·dΦ/dt = N·B·S·ω·sin(ωt) với S = 80 cm², ω = 2πn = <b>${f(g.omega, 2)} rad/s</b>; r_khung = ${f(g.r, 1)} Ω; Φ cực đại = ${f(s.N * s.B * 0.008 * 1000, 0)} mWb`;
        const T = 1 / s.n, win = Math.min(2 * T, 4), pts = (key, sc) => r.hist.filter((p) => p.t >= s.t - win).map((p) => [p.t - (s.t - win), p[key] * sc]);
        plot($('g1'), [{pts: pts('phi', 1), col: BL}], win, 'Φ toàn phần = NBS·cosθ (mWb)', {scale: 1000, cursor: win, fixed: s.N * s.B * 0.008 * 1.15}); plot($('g2'), [{pts: pts('e', 1), col: OR}], win, 'e = NBSω·sinθ (V)', {scale: 1, cursor: win, fixed: g.E0 * 1.15});
        $('tb').innerHTML = `<tr><th>n</th><th>N</th><th>B (T)</th><th>E₀ (V)</th></tr>` + (r.rows.filter((q) => q.mode === 'gen').length ? r.rows.filter((q) => q.mode === 'gen').map((q) => `<tr><td>${f(q.n, 1)}</td><td>${q.N}</td><td>${f(q.B, 2)}</td><td>${f(q.E0, 2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi số liệu”</td></tr>'); }
      else { const t = r.t; set('a', `${f(t.U1, 1)}<small>V</small>`, t.U1 / 24); set('b', `${f(t.U2, 2)}<small>V</small>`, t.U2 / 150); set('c', `${f(t.ratio, 3)}`, t.ratio / 12); set('d', `${f(t.I2 * 1000, 1)}<small>mA</small>`, t.I2 / 0.8); set('e', `${s.loaded ? f(t.eff * 100, 1) : '—'}<small>%</small>`, s.loaded ? t.eff : 0);
        $('tag').innerHTML = `Lí tưởng: U₂/U₁ = N₂/N₁ = <b>${f(t.ideal, 3)}</b>; thực: <b>${f(t.ratio, 3)}</b> · I₁ = ${f(t.I1 * 1000, 1)} mA · I₁/I₂ = ${s.loaded ? f(t.Iratio, 3) : '—'} (lí tưởng ${f(s.N2 / s.N1, 3)}) · P₁ = ${f(t.P1, 3)} W, P₂ = ${f(t.P2, 3)} W, hao phí = ${f(t.P1 - t.P2, 3)} W (đồng ${f(t.Pcu1 + t.Pcu2, 3)} W, lõi sắt ${f(t.Pcore, 3)} W)`;
        const pts = (A, ph) => { const o = []; for (let k = 0; k <= 160; k++) { const x = (k / 160) * 2; o.push([x, Math.SQRT2 * A * Math.sin(2 * Math.PI * x + ph)]); } return o; };
        plot($('g1'), [{pts: pts(t.U1, 0), col: BL}], 2, 'u₁(t): biên độ √2·U₁ (2 chu kỳ)', {}); plot($('g2'), [{pts: pts(t.U2, t.phase), col: RD}], 2, 'u₂(t): biên độ √2·U₂ (2 chu kỳ)', {});
        $('tb').innerHTML = `<tr><th>N₁</th><th>N₂</th><th>U₁ (V)</th><th>U₂ (V)</th></tr>` + (r.rows.filter((q) => q.mode === 'tr').length ? r.rows.filter((q) => q.mode === 'tr').map((q) => `<tr><td>${q.N1}</td><td>${q.N2}</td><td>${f(q.U1, 1)}</td><td>${f(q.U2, 2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#6a8190">Chưa có số liệu · bấm “＋ Ghi số liệu”</td></tr>'); }
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

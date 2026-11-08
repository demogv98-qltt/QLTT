// The overlay: a fixed 1600 x 900 stage of DOM panels, SVG gauges and sparklines. update() redraws all of it from
// the physics readout and the history buffers, so no number on screen is typed in.
import {PRESETS, RANGE} from '../khtn8-lever/physics.js';

const W = 1600;
const H = 900;
const OR = '#e8590c';
const TL = '#0b8f8c';
const INK = '#14303c';

export const CSS = `
html,body{margin:0;background:#e9eff3;overflow:hidden;height:100%}
#app{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;color:${INK};font-family:'JetBrains Mono','Inter',ui-monospace,monospace;font-variant-ligatures:none;-webkit-font-smoothing:antialiased;overflow:hidden}
#gl{position:absolute;left:0;top:0;width:${W}px;height:${H}px;display:block;touch-action:none;cursor:grab}
#gl.drag{cursor:grabbing}
#ui{position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none}
#ui *{box-sizing:border-box}
.panel{position:absolute;top:78px;width:372px;bottom:22px;background:rgba(248,251,253,.93);border:1px solid #b6c6d0;border-radius:6px;padding:14px 16px;overflow:hidden;pointer-events:auto;box-shadow:0 8px 28px rgba(30,60,80,.12)}
#left{left:20px}#right{right:20px}
.mhdr{position:absolute;left:20px;top:12px;display:flex;align-items:center;gap:14px;pointer-events:none;padding:4px 18px 4px 0;background:rgba(233,239,243,.88);border-radius:6px}
.mhdr .bar{width:8px;height:44px;background:${OR}}
.mhdr h1{margin:0;font:800 26px/1.1 'Inter','JetBrains Mono',sans-serif;letter-spacing:.5px}
.mhdr p{margin:3px 0 0;font:500 12.5px 'JetBrains Mono',monospace;color:#4d6573;letter-spacing:.8px}
.chip{position:absolute;right:20px;top:24px;display:flex;gap:10px;pointer-events:none}
.chip b{font:700 12px 'JetBrains Mono',monospace;letter-spacing:1.2px;padding:7px 12px;border:1px solid #b6c6d0;background:rgba(248,251,253,.93);border-radius:4px}
.chip b.on{color:#fff;background:${TL};border-color:${TL}}
.ptitle{font:700 12.5px 'JetBrains Mono',monospace;letter-spacing:1.4px;color:#4d6573;border-bottom:1px solid #c9d6de;padding-bottom:7px;margin-bottom:9px;display:flex;justify-content:space-between}
.blk{border-left:4px solid var(--c);padding:3px 0 3px 10px;margin-bottom:9px}
.blk .bt{font:700 12px 'JetBrains Mono',monospace;color:var(--c);letter-spacing:1px;margin-bottom:3px;display:flex;justify-content:space-between}
.g{display:grid;grid-template-columns:62px 92px 1fr;align-items:center;gap:8px;height:27px}
.g .k{font:600 13px 'JetBrains Mono',monospace;color:#4d6573}
.g .v{font:700 20px 'JetBrains Mono',monospace;text-align:right;color:${INK};white-space:nowrap}
.g .v small{font:500 11px 'JetBrains Mono',monospace;color:#6a8190;margin-left:3px}
.bg{height:9px;background:#dbe5eb;border-radius:2px;position:relative;overflow:hidden}
.bg i{position:absolute;left:0;top:0;bottom:0;background:var(--c);width:0}
.bg.spark{height:22px;background:none;overflow:visible}
.bg svg{width:100%;height:22px;display:block}
.net{margin:2px 0 10px;padding:7px 10px;border:1px solid #c9d6de;border-radius:4px;background:#fff}
.net .nr{display:flex;justify-content:space-between;align-items:baseline;font:600 12.5px 'JetBrains Mono',monospace;color:#4d6573}
.net .nr b{font:800 19px 'JetBrains Mono',monospace;color:${INK}}
.dv{position:relative;height:12px;background:#dbe5eb;border-radius:2px;margin:6px 0 4px}
.dv i{position:absolute;top:0;bottom:0}
.dv u{position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:${INK}}
.net .st{font:700 12.5px 'Inter','JetBrains Mono',sans-serif;margin-top:3px}
.ma{border:1px solid #c9d6de;border-radius:4px;background:#fff;padding:7px 10px;margin-bottom:9px}
.ma .t{font:700 12px 'JetBrains Mono',monospace;color:#4d6573;letter-spacing:.8px}
.ma .n{display:flex;justify-content:space-between;font:700 18px 'JetBrains Mono',monospace;margin:3px 0}
.ma .tag{font:700 13px 'Inter',sans-serif;padding:5px 8px;border-radius:3px;background:#edf3f6;color:#4d6573}
.ma .tag.win{background:${OR};color:#fff}
.wave{display:flex;gap:10px;align-items:stretch}
.dial{width:112px;flex:none}
.wave .col{flex:1;min-width:0}
.rd{display:flex;justify-content:space-between;font:600 12px 'JetBrains Mono',monospace;color:#4d6573;margin-bottom:2px}
.rd b{font:800 17px 'JetBrains Mono',monospace}
svg text{font-family:'JetBrains Mono',monospace}
.sl{margin-bottom:9px}
.sl .top{display:flex;justify-content:space-between;align-items:baseline;font:700 13px 'JetBrains Mono',monospace}
.sl .top span{color:#4d6573;font-weight:600;font-size:12px}
.sl .top b{font:800 18px 'JetBrains Mono',monospace;color:var(--c)}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:22px;background:none;margin:0;cursor:pointer}
input[type=range]::-webkit-slider-runnable-track{height:6px;background:#cfdbe2;border-radius:3px}
input[type=range]::-moz-range-track{height:6px;background:#cfdbe2;border-radius:3px}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--c);border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);margin-top:-7px}
input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--c);border:3px solid #fff}
.pre{display:block;width:100%;text-align:left;border:1px solid #b6c6d0;background:#fff;border-radius:4px;padding:7px 10px;margin-bottom:7px;cursor:pointer;color:${INK};font-family:inherit}
.pre:hover{border-color:${TL}}
.pre.on{border-color:${TL};background:#e6f4f4;box-shadow:inset 4px 0 0 ${TL}}
.pre b{display:block;font:800 14px 'Inter',sans-serif}
.pre span{font:500 11.5px 'JetBrains Mono',monospace;color:#5a7281}
.btn{display:block;width:100%;font:800 15px 'Inter','JetBrains Mono',sans-serif;letter-spacing:.8px;border-radius:4px;cursor:pointer;margin-bottom:8px;padding:0 10px;text-align:center}
.btn.big{height:54px;border:0;background:${OR};color:#fff;font-size:17px;box-shadow:0 3px 0 #a93f08}
.btn.big small{display:block;font:600 10.5px 'JetBrains Mono',monospace;opacity:.92;letter-spacing:1.2px;margin-top:1px}
.btn.big.on{background:${TL};box-shadow:0 3px 0 #07605e}
.btn.out{height:38px;border:2px solid ${TL};background:#fff;color:${TL}}
.btn.out.on{background:${TL};color:#fff}
.btn.out i{display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor;margin-right:7px}
.btn.out.on i{animation:blink 1.2s steps(2) infinite}
@keyframes blink{50%{opacity:.2}}
.views{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}
.views button{height:34px;border:1px solid #b6c6d0;background:#fff;border-radius:4px;font:700 11px 'JetBrains Mono',monospace;color:${INK};cursor:pointer;line-height:1.1}
.views button.on{background:${INK};color:#fff;border-color:${INK}}
.small{font:500 11px 'JetBrains Mono',monospace;color:#6a8190;line-height:1.35}
#labels{position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none}
#leaders{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.lab{position:absolute;white-space:nowrap;font:700 15px 'JetBrains Mono',monospace;padding:3px 8px;border-radius:3px;background:rgba(255,255,255,.92);border:1.5px solid var(--c);color:var(--c);transform:translate(-50%,-50%)}
.lab small{display:block;font:500 11px 'Inter',sans-serif;color:#4d6573}
.lab.part{border-style:dashed;color:${INK}}
.turn{position:fixed;left:0;right:0;bottom:12px;text-align:center;font:600 12px 'JetBrains Mono',monospace;color:#6a8190;display:none}
@media (orientation:portrait) and (max-width:820px){.turn{display:block}}
`;

const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
};
const f = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '∞');
const sgn = (v, d = 1) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

export const LB = {bottom: 870};
export function createUI(app, hooks) {
  const root = el(`<div id="ui"></div>`);
  app.appendChild(root);
  root.appendChild(el(`<div class="mhdr"><div class="bar"></div><div><h1>VL10-M9 · MÔMEN LỰC &amp; CÂN BẰNG</h1><p>ĐÒN BẨY · BÀN THÍ NGHIỆM MÔMEN · Vật lí 10 Kết nối tri thức</p></div></div>`));
  const chips = el(`<div class="chip"><b id="mode">NORMAL · NGUYÊN KHỐI</b><b id="tourchip">AUTO-TOUR</b></div>`);
  root.appendChild(chips);

  const sliderRow = (key, label, unit, c) => {
    const [a, b] = RANGE[key];
    return `<div class="sl" style="--c:${c}"><div class="top"><div>${label} <span>${a}–${b} ${unit}</span></div><b id="sv-${key}">0</b></div><input id="s-${key}" type="range" min="${a}" max="${b}" step="${key[0] === 'F' ? 1 : 0.01}"></div>`;
  };
  const left = el(`<div class="panel" id="left">
    <div class="ptitle"><span>THÔNG SỐ ĐỘNG LỰC HỌC</span><span>TELEMETRY</span></div>
    <div class="blk" style="--c:${OR}"><div class="bt"><span>O₁ · LỰC TÁC DỤNG</span><span>⟲ EFFORT</span></div>
      <div class="g"><span class="k">F₁</span><span class="v" id="vF1"></span><div class="bg"><i id="bF1"></i></div></div>
      <div class="g"><span class="k">d₁</span><span class="v" id="vd1"></span><div class="bg"><i id="bd1"></i></div></div>
      <div class="g"><span class="k">τ₁=F₁d₁</span><span class="v" id="vt1"></span><div class="bg spark"><svg id="sp1" viewBox="0 0 100 22" preserveAspectRatio="none"><polyline fill="none" stroke="${OR}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div></div></div>
    <div class="blk" style="--c:${TL}"><div class="bt"><span>O₂ · TRỌNG VẬT</span><span>⟳ LOAD</span></div>
      <div class="g"><span class="k">F₂</span><span class="v" id="vF2"></span><div class="bg"><i id="bF2"></i></div></div>
      <div class="g"><span class="k">d₂</span><span class="v" id="vd2"></span><div class="bg"><i id="bd2"></i></div></div>
      <div class="g"><span class="k">τ₂=F₂d₂</span><span class="v" id="vt2"></span><div class="bg spark"><svg id="sp2" viewBox="0 0 100 22" preserveAspectRatio="none"><polyline fill="none" stroke="${TL}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div></div></div>
    <div class="net"><div class="nr"><span>τ<sub>net</sub> = τ₁ − τ₂</span><b id="vnet"></b></div>
      <div class="dv"><i id="dvb"></i><u></u></div><div class="st" id="netst"></div></div>
    <div class="ma"><div class="t">LỢI VỀ LỰC · MECHANICAL ADVANTAGE</div>
      <div class="n"><span id="kF"></span><span id="kD"></span></div>
      <div class="tag" id="matag"></div></div>
    <div class="wave"><svg class="dial" viewBox="-60 -50 120 100" id="dial"></svg>
      <div class="col"><div class="rd"><span>θ góc nghiêng</span><b id="vth" style="color:${OR}"></b></div>
        <div class="rd"><span>ω vận tốc góc</span><b id="vom" style="color:${TL}"></b></div>
        <svg id="wave" viewBox="0 0 200 70" preserveAspectRatio="none" style="width:100%;height:70px;display:block;background:#fff;border:1px solid #c9d6de">
          <line x1="0" y1="35" x2="200" y2="35" stroke="#c4d2da" stroke-width="1"/>
          <polyline id="wth" fill="none" stroke="${OR}" stroke-width="1.8" vector-effect="non-scaling-stroke"/>
          <polyline id="wom" fill="none" stroke="${TL}" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>
        <div class="small">10 s gần nhất · θ ±25° · ω ±4 rad/s</div></div></div>
  </div>`);
  root.appendChild(left);

  const right = el(`<div class="panel" id="right">
    <div class="ptitle"><span>BẢNG ĐIỀU KHIỂN THÍ NGHIỆM</span><span>CONTROLS</span></div>
    ${sliderRow('F1', 'F₁ Lực tác dụng', 'N', OR)}${sliderRow('d1', 'd₁ Cánh tay đòn', 'm', OR)}
    ${sliderRow('F2', 'F₂ Trọng lượng tải', 'N', TL)}${sliderRow('d2', 'd₂ Cánh tay đòn', 'm', TL)}
    <div class="ptitle" style="margin-top:6px"><span>THÍ NGHIỆM MẪU</span><span>PRESETS</span></div>
    ${PRESETS.map((p, i) => `<button class="pre" data-i="${i}"><b>${i + 1}. ${p.vi}</b><span>${p.en} · ${p.note}</span></button>`).join('')}
    <button class="btn big" id="b-td">TEARDOWN · BÓC TÁCH CƠ CẤU<small>[T] mở hộp trục · xe trượt · vectơ</small></button>
    <button class="btn out" id="b-tour"><i></i>AUTO-TOUR</button>
    <div class="views"><button data-v="hero">1<br>TỔNG THỂ</button><button data-v="fulcrum">2<br>ĐIỂM TỰA</button><button data-v="vectors">3<br>VECTƠ</button><button data-v="rack">4<br>XE TRƯỢT</button></div>
    <div class="small">Kéo chuột để xoay · lăn chuột để zoom · [R] thả lại thanh đòn. Thanh đòn quay theo mômen thực: α = τ<sub>net</sub>/I, giảm chấn, chốt chặn ±25°.</div>
  </div>`);
  root.appendChild(right);

  const $ = (id) => root.querySelector('#' + id);
  const ref = {};
  for (const id of ['mode', 'tourchip', 'vF1', 'bF1', 'vd1', 'bd1', 'vt1', 'sp1', 'vF2', 'bF2', 'vd2', 'bd2', 'vt2', 'sp2', 'vnet', 'dvb', 'netst', 'kF', 'kD', 'matag', 'dial', 'vth', 'vom', 'wth', 'wom'])
    ref[id] = $(id);
  const bt = $('b-td');
  const btour = $('b-tour');

  // events
  for (const key of ['F1', 'd1', 'F2', 'd2']) {
    $('s-' + key).addEventListener('input', (e) => hooks.cmd(key, Number(e.target.value)));
  }
  root.querySelectorAll('.pre').forEach((b) => b.addEventListener('click', () => hooks.preset(Number(b.dataset.i))));
  bt.addEventListener('click', () => hooks.teardown());
  btour.addEventListener('click', () => hooks.tour());
  root.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => hooks.view(b.dataset.v)));

  // dial: attitude of the beam
  const ticks = [];
  for (let a = -25; a <= 25; a += 5) {
    const r = (a * Math.PI) / 180;
    const long = a % 25 === 0;
    ticks.push(`<line x1="${Math.cos(r) * 46}" y1="${-Math.sin(r) * 46}" x2="${Math.cos(r) * (long ? 36 : 41)}" y2="${-Math.sin(r) * (long ? 36 : 41)}" stroke="${long ? '#c0392b' : '#7d93a0'}" stroke-width="${long ? 2.2 : 1.2}"/>`);
  }
  ref.dial.innerHTML = `<path d="M -46 0 A 46 46 0 0 1 46 0" fill="none" stroke="#cfdbe2" stroke-width="1"/>${ticks.join('')}
    <text x="0" y="-22" text-anchor="middle" font-size="9" fill="#6a8190">±25° STOP</text>
    <g id="beam"><line x1="-40" y1="0" x2="40" y2="0" stroke="${INK}" stroke-width="4"/><circle cx="-40" cy="0" r="6" fill="${OR}"/><circle cx="40" cy="0" r="6" fill="${TL}"/></g>
    <circle r="5" fill="${INK}"/><text x="0" y="22" text-anchor="middle" font-size="10" fill="#4d6573" id="dtxt"></text>`;
  const dbeam = ref.dial.querySelector('#beam');
  const dtxt = ref.dial.querySelector('#dtxt');

  // labels floating in the scene
  const labels = el(`<div id="labels"><svg id="leaders" viewBox="0 0 ${W} ${H}"></svg></div>`);
  root.insertBefore(labels, root.firstChild); // under the panels
  const leaders = labels.querySelector('#leaders');
  const labs = {};
  const note = el(`<div class="turn">Xoay ngang điện thoại để xem đầy đủ bảng điều khiển</div>`);
  document.body.appendChild(note);

  const pts = (arr, n, lo, hi, w, h) => {
    const out = [];
    const start = Math.max(0, arr.length - n);
    for (let i = start; i < arr.length; i++) {
      const x = ((i - start) / (n - 1)) * w;
      const y = h - ((Math.min(hi, Math.max(lo, arr[i])) - lo) / (hi - lo)) * h;
      out.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return out.join(' ');
  };
  const setVal = (id, main, unit) => (ref[id].innerHTML = `${main}<small>${unit}</small>`);
  let frameNo = 0;

  return {
    root,
    sliders: (cmd) => {
      for (const k of ['F1', 'd1', 'F2', 'd2']) {
        const s = $('s-' + k);
        if (document.activeElement !== s) s.value = cmd[k];
        $('sv-' + k).textContent = `${k[0] === 'F' ? Math.round(cmd[k]) : cmd[k].toFixed(2)} ${k[0] === 'F' ? 'N' : 'm'}`;
      }
    },
    setPreset: (i) => root.querySelectorAll('.pre').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === i)),
    setView: (v) => root.querySelectorAll('.views button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)),
    setTeardown: (on, td) => {
      bt.classList.toggle('on', on);
      bt.firstChild.textContent = on ? 'ĐÓNG LẠI · LẮP CƠ CẤU' : 'TEARDOWN · BÓC TÁCH CƠ CẤU';
      ref.mode.classList.toggle('on', td > 0.5);
      ref.mode.textContent = td > 0.5 ? 'TEARDOWN · BÓC TÁCH' : 'NORMAL · NGUYÊN KHỐI';
    },
    setTour: (state) => {
      // state: 'run' | 'wait' | 'off'
      btour.classList.toggle('on', state !== 'off');
      btour.innerHTML = `<i></i>AUTO-TOUR · ${state === 'run' ? 'ĐANG CHẠY' : state === 'wait' ? 'TẠM DỪNG' : 'TẮT'}`;
      ref.tourchip.classList.toggle('on', state === 'run');
      ref.tourchip.textContent = state === 'run' ? 'AUTO-TOUR ●' : state === 'wait' ? 'AUTO-TOUR ⏸' : 'AUTO-TOUR ○';
    },
    update(r, hist) {
      frameNo++;
      setVal('vF1', f(r.F1, 1), 'N');
      setVal('vd1', f(r.d1, 2), 'm');
      setVal('vt1', f(r.tau1, 1), 'N·m');
      setVal('vF2', f(r.F2, 1), 'N');
      setVal('vd2', f(r.d2, 2), 'm');
      setVal('vt2', f(r.tau2, 1), 'N·m');
      ref.bF1.style.width = (r.F1 / 100) * 100 + '%';
      ref.bd1.style.width = (r.d1 / 1) * 100 + '%';
      ref.bF2.style.width = (r.F2 / 100) * 100 + '%';
      ref.bd2.style.width = (r.d2 / 1) * 100 + '%';
      ref.bF1.style.setProperty('--c', OR);
      for (const id of ['bF1', 'bd1', 'bF2', 'bd2']) ref[id].style.background = id.endsWith('1') ? OR : TL;
      ref.vnet.textContent = `${sgn(r.net, 1)} N·m`;
      const half = Math.min(50, (Math.abs(r.net) / 60) * 50);
      ref.dvb.style.left = r.net >= 0 ? '50%' : 50 - half + '%';
      ref.dvb.style.width = half + '%';
      ref.dvb.style.background = r.net >= 0 ? OR : TL;
      ref.netst.textContent = r.balanced ? '● CÂN BẰNG · τ₁ = τ₂' : r.net > 0 ? '⟲ τ₁ > τ₂ · quay ngược chiều kim đồng hồ' : '⟳ τ₂ > τ₁ · quay cùng chiều kim đồng hồ';
      ref.netst.style.color = r.balanced ? '#2d7d3a' : r.net > 0 ? OR : TL;
      ref.kF.innerHTML = `k=F₂/F₁=${f(r.kForce, 2)}`;
      ref.kD.innerHTML = `d₁/d₂=${f(r.kArm, 2)}`;
      const win = r.d1 > r.d2 * 1.001;
      ref.matag.className = 'tag' + (win ? ' win' : '');
      ref.matag.textContent = win ? 'Được lợi về lực, thiệt về đường đi' : r.d1 < r.d2 * 0.999 ? 'Thiệt về lực, lợi về đường đi' : 'd₁ = d₂ · không lợi về lực';
      const deg = (r.theta * 180) / Math.PI;
      ref.vth.textContent = `${sgn(deg, 1)}°`;
      ref.vom.textContent = `${sgn(r.omega, 2)} rad/s`;
      dbeam.setAttribute('transform', `rotate(${-deg.toFixed(2)})`);
      dtxt.textContent = r.atStop ? 'CHỐT CHẶN' : `${sgn(deg, 1)}°`;
      dtxt.setAttribute('fill', r.atStop ? '#c0392b' : '#4d6573');
      if (frameNo % 2 === 0) {
        ref.sp1.firstChild.setAttribute('points', pts(hist.tau1, 100, 0, 100, 100, 22));
        ref.sp2.firstChild.setAttribute('points', pts(hist.tau2, 100, 0, 100, 100, 22));
        ref.wth.setAttribute('points', pts(hist.theta, 300, -25, 25, 200, 70));
        ref.wom.setAttribute('points', pts(hist.omega, 300, -4, 4, 200, 70));
      }
    },
    /** items: [{id, x, y, text, sub, color, dx, dy, a, part}] in stage px; a is the opacity. Labels push each other
     *  apart and stay between the two panels, so nothing sits on top of anything else. */
    labels(items) {
      const seen = new Set();
      const act = [];
      for (const it of items) {
        seen.add(it.id);
        let o = labs[it.id];
        if (!o) {
          const d = el(`<div class="lab"></div>`);
          const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          ln.setAttribute('stroke-width', '1.5');
          labels.appendChild(d);
          leaders.appendChild(ln);
          o = labs[it.id] = {d, ln, txt: ''};
        }
        const inView = it.x > 395 && it.x < 1205 && it.y > 80 && it.y < LB.bottom + 14;
        const show = it.a > 0.02 && it.visible !== false && inView;
        o.d.style.display = o.ln.style.display = show ? '' : 'none';
        if (!show) continue;
        const html = it.sub ? `${it.text}<small>${it.sub}</small>` : it.text;
        if (o.txt !== html) {
          o.d.innerHTML = html;
          o.txt = html;
        }
        o.d.className = 'lab' + (it.part ? ' part' : '');
        o.d.style.setProperty('--c', it.color);
        o.d.style.opacity = it.a;
        const w = Math.max(it.text.length * 9.4, (it.sub || '').length * 6.3) + 20;
        const h = it.sub ? 44 : 28;
        act.push({it, o, w, h, x: it.x + (it.dx || 0), y: it.y + (it.dy || 0)});
      }
      const clampXY = (a) => {
        a.x = Math.min(1200 - a.w / 2, Math.max(400 + a.w / 2, a.x));
        a.y = Math.min(LB.bottom - a.h / 2, Math.max(84 + a.h / 2, a.y));
      };
      act.forEach(clampXY);
      for (let k = 0; k < 24; k++) {
        let moved = false;
        for (let i = 0; i < act.length; i++)
          for (let j = i + 1; j < act.length; j++) {
            const A = act[i];
            const B = act[j];
            const ox = (A.w + B.w) / 2 + 6 - Math.abs(A.x - B.x);
            const oy = (A.h + B.h) / 2 + 6 - Math.abs(A.y - B.y);
            if (ox > 0 && oy > 0) {
              const dir = B.y >= A.y ? 1 : -1;
              B.y += dir * (oy / 2 + 1);
              A.y -= dir * (oy / 2 + 1);
              moved = true;
            }
          }
        act.forEach(clampXY);
        if (!moved) break;
      }
      for (const {it, o, x, y} of act) {
        o.d.style.left = x + 'px';
        o.d.style.top = y + 'px';
        const far = Math.hypot(x - it.x, y - it.y) > 6;
        o.ln.style.display = far ? '' : 'none';
        if (far) {
          o.ln.setAttribute('x1', it.x);
          o.ln.setAttribute('y1', it.y);
          o.ln.setAttribute('x2', x);
          o.ln.setAttribute('y2', y);
          o.ln.setAttribute('stroke', it.color);
          o.ln.style.opacity = it.a;
        }
      }
      for (const id of Object.keys(labs)) if (!seen.has(id)) labs[id].d.style.display = labs[id].ln.style.display = 'none';
    },
  };
}

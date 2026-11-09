// Bộ "Bài học" dùng chung cho mọi mô phỏng: mục tiêu → nhiệm vụ từng bước (tự kiểm tra từ mô hình) → đoán trước rồi quan sát
// → trắc nghiệm có giải thích lỗi sai phổ biến → ghi nhớ. Đáp án luôn tính từ chính mô hình vật lí, không gõ tay.
export const LESSON_CSS = `
#lay{position:absolute;left:50%;top:12px;transform:translateX(-50%);display:flex;gap:6px;z-index:30;pointer-events:auto}
#lay button{font:700 12.5px 'Inter',sans-serif;border:1px solid #b6c6d0;background:rgba(255,255,255,.94);color:#14303c;border-radius:999px;padding:6px 13px;cursor:pointer;box-shadow:0 2px 8px rgba(30,60,80,.12)}
#lay button:hover{background:#fff;border-color:#0b8f8c}#lay button.off{background:#14303c;color:#fff;border-color:#14303c}
#left,#right{transition:transform .38s cubic-bezier(.3,.7,.2,1),opacity .3s}
#left.hide{transform:translateX(-118%);opacity:0;pointer-events:none}#right.hide{transform:translateX(118%);opacity:0;pointer-events:none}
#labels.hide{display:none}

#lesson{position:absolute;left:410px;width:780px;bottom:18px;background:rgba(255,255,255,.97);border:1px solid #b6c6d0;border-radius:8px;box-shadow:0 8px 28px rgba(30,60,80,.18);pointer-events:auto;font-family:'Inter','JetBrains Mono',sans-serif;color:#14303c;overflow:hidden}
#lesson .lh{display:flex;align-items:center;gap:10px;padding:7px 12px;background:#14303c;color:#fff;cursor:pointer}
#lesson .lh b{font:800 13px 'JetBrains Mono',monospace;letter-spacing:1px}
#lesson .dots{display:flex;gap:5px;flex:1}
#lesson .dots i{width:20px;height:7px;border-radius:4px;background:rgba(255,255,255,.28)}
#lesson .dots i.d{background:#4cd3a3}#lesson .dots i.c{background:#fff}
#lesson .lh span{font:600 12px 'JetBrains Mono',monospace;opacity:.85}
#lesson .lb{padding:10px 14px 12px}
#lesson.min .lb{display:none}
#lesson h3{margin:0 0 3px;font:800 16px 'Inter',sans-serif}
#lesson p{margin:3px 0;font:500 14px/1.5 'Inter',sans-serif}
#lesson .row{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
#lesson button{font:700 13px 'Inter',sans-serif;border:1px solid #b6c6d0;background:#fff;border-radius:5px;padding:7px 12px;cursor:pointer;color:#14303c}
#lesson button.go{background:#0b8f8c;border-color:#0b8f8c;color:#fff}
#lesson button.opt{display:block;width:100%;text-align:left;margin:4px 0;font-weight:600}
#lesson button.opt.ok{background:#e3f6ee;border-color:#2d7d3a}#lesson button.opt.no{background:#fdeaea;border-color:#c0392b}
#lesson input{font:700 15px 'JetBrains Mono',monospace;width:110px;padding:6px 8px;border:2px solid #0b8f8c;border-radius:5px}
#lesson .fb{padding:7px 10px;border-radius:5px;margin-top:7px;font:600 13.5px/1.5 'Inter',sans-serif}
#lesson .fb.ok{background:#e3f6ee;color:#1f6a30}#lesson .fb.no{background:#fff3e0;color:#9a4a00}#lesson .fb.hint{background:#eef3f6;color:#14303c}
#lesson .wait{font:600 13px 'JetBrains Mono',monospace;color:#e8590c}
#lesson ul{margin:4px 0 0 18px;padding:0;font:500 14px/1.55 'Inter',sans-serif}
`;
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
const num = (s) => parseFloat(String(s).replace(',', '.').replace('−', '-'));
const fv = (v, d = 2) => Number(v).toFixed(d).replace('.', ',');

/**
 * cfg = {code, title, objectives: [..], steps: [..], quiz: [..], summary: [..]}
 *  step 'do':      {type, title, text, hints[], setup?(), check(ctx), explain}
 *  step 'predict': {type, title, text, unit, setup?(), answer(ctx), tol, hints[], explain}
 *  quiz item:      {q, options[], answer: index, explain}
 * h = {ctx(): any, onSize(px)}   ctx() returns the model readout the checks read from.
 */
/** layout buttons shared by every simulation: collapse the left / right panel, hide the name tags; remembered between visits */
function installLayout(root) {
  if (root.querySelector('#lay')) return;
  const bar = el('<div id="lay"><button data-k="L"></button><button data-k="N"></button><button data-k="R"></button></div>'); root.appendChild(bar);
  const st = {L: false, N: false, R: false}; try { Object.assign(st, JSON.parse(localStorage.getItem('layout:v1') || '{}')); } catch (e) { /* ignore */ }
  const apply = () => {
    const $ = (q) => root.querySelector(q), L = $('#left'), R = $('#right'), lab = $('#labels');
    L?.classList.toggle('hide', st.L); R?.classList.toggle('hide', st.R); lab?.classList.toggle('hide', st.N);
    const b = (k) => bar.querySelector(`[data-k="${k}"]`);
    b('L').textContent = st.L ? '▶ Mở số liệu' : '◀ Thu gọn số liệu'; b('R').textContent = st.R ? '◀ Mở điều khiển' : 'Thu gọn điều khiển ▶'; b('N').textContent = st.N ? '🏷 Hiện thẻ tên' : '🏷 Ẩn thẻ tên';
    for (const k of ['L', 'R', 'N']) b(k).classList.toggle('off', st[k]);
    window.__viewZoom = st.L && st.R ? 0.78 : st.L || st.R ? 0.9 : 1;
    try { localStorage.setItem('layout:v1', JSON.stringify(st)); } catch (e) { /* ignore */ }
  };
  const flip = (k) => { st[k] = !st[k]; apply(); };
  bar.addEventListener('click', (e) => { const k = e.target.closest('button')?.dataset.k; if (k) flip(k); });
  addEventListener('keydown', (e) => { if (e.altKey || e.ctrlKey || e.metaKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return; if (e.key === '[') flip('L'); else if (e.key === ']') flip('R'); else if (e.key.toLowerCase() === 'n') flip('N'); });
  apply();
}
export function createLesson(root, cfg, h) {
  installLayout(root);
  const box = el('<div id="lesson"></div>'); root.appendChild(box);
  const S = {phase: 'intro', i: 0, done: new Set(), state: 'wait', hintN: 0, q: 0, score: 0, picked: null, min: false, fb: null};
  const key = 'lesson:' + cfg.code;
  try { const s = JSON.parse(localStorage.getItem(key) || 'null'); if (s?.done) S.done = new Set(s.done); } catch (e) { /* no storage: fine */ }
  const save = () => { try { localStorage.setItem(key, JSON.stringify({done: [...S.done]})); } catch (e) { /* ignore */ } };
  const nSteps = cfg.steps.length;
  const dots = () => cfg.steps.map((_, k) => `<i class="${S.done.has(k) ? 'd' : S.phase === 'steps' && k === S.i ? 'c' : ''}"></i>`).join('');
  const head = (label) => `<div class="lh" id="lh"><b>📘 BÀI HỌC</b><div class="dots">${dots()}</div><span>${label}</span></div>`;
  function enterStep() { S.state = 'wait'; S.hintN = 0; S.fb = null; const st = cfg.steps[S.i]; st.setup?.(); }
  function render() {
    let body = '', label = '';
    if (S.phase === 'intro') {
      label = 'Mục tiêu';
      body = `<h3>${cfg.title}</h3><p>Sau bài này em làm được:</p><ul>${cfg.objectives.map((o) => `<li>${o}</li>`).join('')}</ul>
        <div class="row"><button class="go" id="start">Bắt đầu ${nSteps} nhiệm vụ →</button><span class="small" style="font:12px sans-serif;color:#6a8190">Em có thể thu nhỏ khung này bất cứ lúc nào để xem mô phỏng.</span></div>`;
    } else if (S.phase === 'steps') {
      const st = cfg.steps[S.i]; label = `Nhiệm vụ ${S.i + 1}/${nSteps}`;
      body = `<h3>${S.i + 1}. ${st.title}</h3><p>${st.text}</p>`;
      if (st.type === 'choice') body += `<div>${st.options.map((o, k) => `<button class="opt sopt ${S.state === 'done' && k === st.answer ? 'ok' : ''}" data-k="${k}" ${S.state === 'done' ? 'disabled' : ''}>${String.fromCharCode(65 + k)}. ${o}</button>`).join('')}</div>`;
      else if (st.type === 'predict') body += `<div class="row"><span style="font:700 13px sans-serif">Em dự đoán:</span><input id="ans" inputmode="decimal" autocomplete="off" ${S.state === 'done' ? 'disabled' : ''} value="${S.last ?? ''}"><b>${st.unit}</b>${S.state === 'done' ? '' : '<button class="go" id="chk">Kiểm tra</button>'}</div>`;
      else if (S.state !== 'done' && st.type !== 'choice') body += `<div class="wait">▸ Đang chờ em thực hiện trên mô hình…</div>`;
      if (S.fb) body += `<div class="fb ${S.fb.k}">${S.fb.t}</div>`;
      if (S.state === 'done') body += `<div class="fb ok">✔ ${st.explain}</div>`;
      body += `<div class="row">${S.state === 'done' ? `<button class="go" id="next">${S.i + 1 < nSteps ? 'Nhiệm vụ tiếp →' : 'Làm trắc nghiệm →'}</button>` : `<button id="hint">💡 Gợi ý</button><button id="skip">Bỏ qua</button>`}${S.i > 0 ? '<button id="prev">← Quay lại</button>' : ''}</div>`;
    } else if (S.phase === 'quiz') {
      const q = cfg.quiz[S.q]; label = `Trắc nghiệm ${S.q + 1}/${cfg.quiz.length}`;
      body = `<h3>Câu ${S.q + 1}. ${q.q}</h3>${q.options.map((o, k) => `<button class="opt ${S.picked === null ? '' : k === q.answer ? 'ok' : k === S.picked ? 'no' : ''}" data-k="${k}" ${S.picked === null ? '' : 'disabled'}>${String.fromCharCode(65 + k)}. ${o}</button>`).join('')}`;
      if (S.picked !== null) body += `<div class="fb ${S.picked === q.answer ? 'ok' : 'no'}">${S.picked === q.answer ? '✔ Chính xác. ' : '✘ Chưa đúng. '}${q.explain}</div><div class="row"><button class="go" id="qnext">${S.q + 1 < cfg.quiz.length ? 'Câu tiếp →' : 'Xem kết quả →'}</button></div>`;
    } else {
      label = 'Tổng kết';
      const pct = Math.round((S.score / cfg.quiz.length) * 100);
      body = `<h3>Hoàn thành! Trắc nghiệm: ${S.score}/${cfg.quiz.length} (${pct}%)</h3><p><b>Ghi nhớ:</b></p><ul>${cfg.summary.map((o) => `<li>${o}</li>`).join('')}</ul>
        <div class="row"><button class="go" id="again">↺ Học lại từ đầu</button><button id="stepsb">Xem lại nhiệm vụ</button></div>`;
    }
    box.className = S.min ? 'min' : '';
    box.innerHTML = head(label) + `<div class="lb">${body}</div>`;
    bind(); h.onSize?.(box.offsetHeight);
  }
  function bind() {
    const $ = (id) => box.querySelector('#' + id);
    $('lh').onclick = () => { S.min = !S.min; render(); };
    if ($('start')) $('start').onclick = () => { S.phase = 'steps'; S.i = Math.max(0, [...Array(nSteps).keys()].find((k) => !S.done.has(k)) ?? 0); enterStep(); render(); };
    if ($('hint')) $('hint').onclick = () => { const hs = cfg.steps[S.i].hints; S.fb = {k: 'hint', t: '💡 ' + hs[Math.min(S.hintN, hs.length - 1)]}; S.hintN++; render(); };
    if ($('skip')) $('skip').onclick = () => { if (S.i + 1 < nSteps) { S.i++; enterStep(); } else { S.phase = 'quiz'; S.q = 0; S.picked = null; S.score = 0; } render(); };
    if ($('prev')) $('prev').onclick = () => { S.i--; enterStep(); render(); };
    if ($('next')) $('next').onclick = () => { if (S.i + 1 < nSteps) { S.i++; enterStep(); } else { S.phase = 'quiz'; S.q = 0; S.picked = null; S.score = 0; } S.last = ''; render(); };
    if ($('chk')) $('chk').onclick = () => {
      const st = cfg.steps[S.i], v = num($('ans').value); S.last = $('ans').value;
      if (!Number.isFinite(v)) { S.fb = {k: 'no', t: 'Hãy nhập một số (ví dụ 5 hoặc 5,0).'}; render(); return; }
      const truth = st.answer(h.ctx());
      if (Math.abs(v - truth) <= st.tol) { S.done.add(S.i); save(); S.state = 'done'; S.fb = {k: 'ok', t: `Đúng rồi! Mô hình cho kết quả ${fv(truth)} ${st.unit}. Em hãy quan sát trên mô phỏng để thấy đúng như vậy.`}; }
      else S.fb = {k: 'no', t: `Chưa khớp (em nhập ${fv(v)} ${st.unit}). Hãy xem lại gợi ý rồi thử lại. Muốn biết đáp án, bấm “Bỏ qua” hoặc làm theo gợi ý.`};
      render();
    };
    box.querySelectorAll('.sopt').forEach((b) => (b.onclick = () => { const st = cfg.steps[S.i], k = Number(b.dataset.k); if (k === st.answer) { S.done.add(S.i); save(); S.state = 'done'; S.fb = null; } else S.fb = {k: 'no', t: '✘ Chưa đúng. ' + (st.wrong?.[k] ?? 'Hãy xem lại gợi ý rồi chọn lại.')}; render(); }));
    box.querySelectorAll('.opt:not(.sopt)').forEach((b) => (b.onclick = () => { S.picked = Number(b.dataset.k); if (S.picked === cfg.quiz[S.q].answer) S.score++; render(); }));
    if ($('qnext')) $('qnext').onclick = () => { if (S.q + 1 < cfg.quiz.length) { S.q++; S.picked = null; } else S.phase = 'end'; render(); };
    if ($('again')) $('again').onclick = () => { S.done.clear(); save(); S.phase = 'intro'; S.i = 0; render(); };
    if ($('stepsb')) $('stepsb').onclick = () => { S.phase = 'steps'; S.i = 0; enterStep(); render(); };
  }
  render();
  return {
    /** call every frame: watches 'do' steps and marks them done when the model reaches the state asked for */
    tick() {
      if (S.phase !== 'steps' || S.state === 'done') return;
      const st = cfg.steps[S.i];
      if (st.type === 'do' && st.check(h.ctx())) { S.done.add(S.i); save(); S.state = 'done'; S.fb = null; render(); }
    },
    get height() { return box.offsetHeight; },
    box,
  };
}

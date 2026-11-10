// Nội dung bài học B7: máy phát điện xoay chiều và máy biến áp (Vật lí 12 KNTT; ◻ thầy đối chiếu tên/số bài).
// ctx = {s: mô hình, r: readout, td}. act = {set({mode, n, N, B, RL, N1, N2, U1, RLt, loaded, idealT, reset})}.
import {createModel, E0, Prms, transformer} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const M = (o) => ({...createModel(), ...o});
  const G0 = {mode: 'gen', n: 2, N: 200, B: 0.2, RL: 20};
  const T0 = {mode: 'tr', N1: 500, N2: 100, U1: 20, RLt: 20, loaded: true, idealT: false};
  return {
    code: 'vl12-b7',
    title: 'Máy phát điện xoay chiều và máy biến áp',
    objectives: [
      'Giải thích nguyên tắc máy phát điện: khung dây quay trong từ trường đều, từ thông Φ = NBS·cosωt biến thiên làm xuất hiện suất điện động e = NBSω·sinωt.',
      'Nêu và dùng: E₀ = NBSω, tần số f = n (số vòng quay trong 1 s), giá trị hiệu dụng E = E₀/√2.',
      'Giải thích máy biến áp (cảm ứng điện từ trong lõi thép chung): U₂/U₁ = N₂/N₁, I₁/I₂ ≈ N₂/N₁ khi tải nặng; hiệu suất và hao phí.',
      'Hiểu vì sao truyền tải điện đi xa phải dùng điện áp cao.',
    ],
    steps: [
      {type: 'do', title: 'Quay khung dây trong từ trường', text: 'Máy phát: N = 200 vòng, B = 0,2 T, diện tích khung S = 80 cm², quay đều n = 2 vòng/s. Quan sát đồ thị Φ(t) và e(t) trong vài giây.', hints: ['Chỉ cần chờ vài giây; khung quay tự động.'], setup: () => act.set({...G0, reset: true}), check: (c) => c.s.mode === 'gen' && c.s.t > 2.5, explain: 'Φ(t) và e(t) đều hình sin, cùng chu kỳ nhưng lệch pha: khi Φ cực đại thì e = 0 và ngược lại.'},
      {type: 'choice', title: 'Khi nào e cực đại?', text: 'Suất điện động cảm ứng trong khung có độ lớn cực đại khi mặt phẳng khung:', options: ['Vuông góc với đường sức từ (Φ cực đại)', 'Song song với đường sức từ (Φ = 0)', 'Hợp với đường sức góc 45°'], answer: 1, wrong: ['Lúc này Φ cực đại nhưng đang ở đỉnh (tốc độ biến thiên bằng 0) nên e = 0.', '', 'Chỉ lúc song song e mới đạt cực đại.'], hints: ['e = −dΦ/dt: e cực đại khi Φ biến thiên nhanh nhất.'], explain: 'e = NBSω·sinθ cực đại khi θ = 90° (khung song song với B, Φ = 0 và đang đổi dấu nhanh nhất). Khi khung vuông góc với B (Φ cực đại) thì e = 0.'},
      {type: 'predict', title: 'Suất điện động cực đại', text: 'Tính E₀ = N·B·S·ω với N = 200, B = 0,2 T, S = 8·10⁻³ m², ω = 2πn = 4π rad/s.', unit: 'V', hints: ['ω = 12,57 rad/s.'], answer: () => E0(M(G0)), tol: 0.1, explain: 'E₀ = 200·0,2·0,008·12,57 ≈ 4,02 V.'},
      {type: 'predict', title: 'Tần số của dòng điện', text: 'Khung quay n = 2 vòng/s. Tần số f của suất điện động (Hz) là bao nhiêu?', unit: 'Hz', hints: ['Mỗi vòng quay ứng với một chu kỳ của e.'], answer: () => 2, tol: 0.01, explain: 'f = n = 2 Hz (chu kỳ T = 0,5 s). Máy phát ở nhà máy quay 50 vòng/s (hoặc có nhiều cặp cực) để có f = 50 Hz.'},
      {type: 'predict', title: 'Suất điện động hiệu dụng', text: 'Giá trị hiệu dụng E = E₀/√2. Tính E (V).', unit: 'V', hints: ['E = 4,02/1,414.'], answer: () => E0(M(G0)) / Math.SQRT2, tol: 0.06, explain: 'E ≈ 2,84 V. Giá trị hiệu dụng là giá trị của dòng điện không đổi toả cùng nhiệt lượng trên điện trở.'},
      {type: 'choice', title: 'Quay nhanh gấp đôi', text: 'Giữ N, B, S, tăng tốc độ quay gấp đôi (n = 4 vòng/s). Khi đó:', options: ['E₀ gấp đôi và f gấp đôi', 'E₀ không đổi, f gấp đôi', 'E₀ gấp đôi, f không đổi'], answer: 0, wrong: ['', 'E₀ = NBSω tỉ lệ với ω.', 'f = n tăng theo tốc độ quay.'], hints: ['E₀ ∝ ω, f = n.'], explain: 'E₀ = NBSω và f = n đều tỉ lệ với tốc độ quay. Hãy kéo thanh trượt n để kiểm tra trên đồ thị.'},
      {type: 'predict', title: 'Công suất toả nhiệt trên đèn', text: 'Khung (điện trở r = 0,01 Ω mỗi vòng = 2 Ω) nối với đèn R = 20 Ω. Tính công suất trung bình P = I²R với I = E/(r + R) (mW).', unit: 'mW', setup: () => act.set({...G0}), hints: ['I = 2,84/22 = 0,129 A.'], answer: () => Prms(M(G0)) * 1000, tol: 15, explain: 'P ≈ 334 mW. Điện năng này lấy từ công của người quay: máy phát biến cơ năng thành điện năng.'},
      {type: 'do', title: 'Máy biến áp hạ áp', text: 'Chuyển sang “Máy biến áp”. Thí nghiệm mẫu 2: N₁ = 500, N₂ = 100, U₁ = 20 V. Bấm “Tải: CÓ” để cắt tải (mạch thứ cấp hở).', hints: ['Nút “Máy biến áp”, rồi nút “Tải”.'], setup: () => act.set({...T0, loaded: true}), check: (c) => c.s.mode === 'tr' && !c.s.loaded && c.s.N1 === 500 && c.s.N2 === 100, explain: 'Biến áp gồm hai cuộn dây quấn trên lõi thép: từ thông biến thiên trong lõi cảm ứng suất điện động trong cuộn thứ cấp.'},
      {type: 'predict', title: 'Điện áp thứ cấp khi hở', text: 'Khi mạch thứ cấp hở: U₂/U₁ = N₂/N₁. Tính U₂ (V).', unit: 'V', hints: ['U₂ = 20·100/500.'], answer: () => transformer(M({...T0, loaded: false})).U2, tol: 0.15, explain: 'U₂ ≈ 4,00 V: khi mạch thứ cấp hở, dòng sơ cấp rất nhỏ nên U₂ gần đúng bằng U₁·N₂/N₁. N₂ < N₁ nên U₂ < U₁: biến áp hạ áp.'},
      {type: 'do', title: 'Đổi sang biến áp tăng áp', text: 'Tăng N₂ lên 1000 vòng (giữ N₁ = 500, tải vẫn hở).', hints: ['Thanh trượt N₂.'], check: (c) => c.s.mode === 'tr' && c.s.N2 === 1000 && c.s.N1 === 500 && !c.s.loaded, explain: 'Cuộn thứ cấp có nhiều vòng hơn: U₂ lớn hơn U₁.'},
      {type: 'predict', title: 'U₂ của biến áp tăng áp', text: 'Tính U₂ (V) khi N₂ = 1000, N₁ = 500, U₁ = 20 V (tải hở).', unit: 'V', hints: ['U₂ = 20·1000/500.'], answer: () => transformer(M({...T0, N2: 1000, loaded: false})).U2, tol: 0.6, explain: 'U₂ ≈ 40 V.'},
      {type: 'do', title: 'Đóng tải và đo dòng điện', text: 'Trở lại N₂ = 100, đóng tải R = 20 Ω. Đọc I₁/I₂ trong khung bên trái.', hints: ['Nút “Tải: KHÔNG”, N₂ về 100.'], setup: () => act.set({...T0}), check: (c) => c.s.mode === 'tr' && c.s.loaded && c.s.N2 === 100 && c.s.N1 === 500, explain: 'Có dòng điện chạy qua tải; đèn sáng.'},
      {type: 'predict', title: 'Tỉ số cường độ dòng điện', text: 'Với biến áp lí tưởng I₁/I₂ = N₂/N₁ (= 0,2 ở đây). Mô hình thực cho I₁/I₂ bằng bao nhiêu? (đọc trong khung bên trái)', unit: '', hints: ['Dòng sơ cấp lớn hơn một chút vì còn dòng từ hoá.'], answer: () => transformer(M(T0)).Iratio, tol: 0.03, explain: 'I₁/I₂ ≈ 0,21–0,22 gần bằng 0,2 (N₂/N₁): dòng ở cuộn có ít vòng dây hơn thì lớn hơn. Chênh lệch nhỏ do dòng từ hoá ở lõi sắt.'},
      {type: 'choice', title: 'Công suất hai phía', text: 'Biến áp thực có điện trở cuộn dây và tổn hao trong lõi sắt. So sánh công suất P₁ (lấy từ nguồn) và P₂ (cấp cho tải):', options: ['P₁ > P₂, phần chênh lệch là hao phí', 'P₁ = P₂ luôn luôn', 'P₁ < P₂'], answer: 0, wrong: ['', 'Chỉ đúng với biến áp lí tưởng (bấm “Biến áp: LÍ TƯỞNG” để thử).', 'Không thể tạo ra năng lượng: P₂ không thể lớn hơn P₁.'], hints: ['Xem P₁, P₂ trong khung bên trái.'], explain: 'P₁ = P₂ + P_hao phí (toả nhiệt trên cuộn dây và lõi sắt). Biến áp không tạo ra năng lượng.'},
      {type: 'predict', title: 'Hiệu suất máy biến áp', text: 'Hiệu suất H = P₂/P₁ (%). Đọc trong bảng bên trái.', unit: '%', hints: ['Dòng “H = P₂/P₁”.'], answer: () => transformer(M(T0)).eff * 100, tol: 2.5, explain: 'H ≈ 94 % (R = 20 Ω): hao phí chủ yếu do điện trở cuộn dây (hiệu ứng Joule) và dòng từ hoá; tải càng nhẹ thì hiệu suất càng thấp. Máy biến áp lớn có hiệu suất trên 98 %.'},
      {type: 'choice', title: 'Truyền tải điện năng đi xa', text: 'Để truyền công suất P đi xa qua dây có điện trở R mà hao phí nhiệt nhỏ, nên:', options: ['Tăng điện áp truyền tải (dùng biến áp tăng áp ở nhà máy)', 'Giảm điện áp truyền tải', 'Tăng cường độ dòng điện'], answer: 0, wrong: ['', 'Hao phí P_hp = I²R = (P/U)²R sẽ tăng.', 'Dòng lớn thì hao phí I²R lớn.'], hints: ['P_hp = (P/U)²·R.'], explain: 'P_hp = I²R = (P/U)²R: tăng U lên 10 lần thì hao phí giảm 100 lần. Tại nơi tiêu thụ dùng biến áp hạ áp.'},
      {type: 'do', title: 'Biến áp lí tưởng', text: 'Bấm “Biến áp: THỰC” để chuyển thành lí tưởng (bỏ qua điện trở cuộn dây và tổn hao lõi) và quan sát hiệu suất.', hints: ['Nút “Biến áp” ở bảng điều khiển.'], check: (c) => c.s.idealT && c.s.loaded, explain: 'Biến áp lí tưởng: U₂/U₁ = N₂/N₁ chính xác, P₁ = P₂, hiệu suất 100 %.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): lõi thép, hai cuộn dây, từ thông (chấm xanh) chạy quanh lõi.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Chấm xanh cho thấy từ thông xoay chiều chạy quanh lõi thép, xuyên qua cả hai cuộn dây: đó là cầu nối năng lượng từ cuộn sơ cấp sang thứ cấp.'},
    ],
    quiz: [
      {q: 'Khung dây N vòng, diện tích S quay đều với tốc độ góc ω trong từ trường đều B (trục quay vuông góc với B). Suất điện động cực đại là:', options: ['NBS', 'NBSω', 'BSω/N', 'NBS/ω'], answer: 1, explain: 'e = NBSω·sinωt nên E₀ = NBSω.'},
      {q: 'Khung dây quay 25 vòng/s. Tần số của suất điện động xoay chiều là:', options: ['12,5 Hz', '25 Hz', '50 Hz', '100 Hz'], answer: 1, explain: 'Mỗi vòng quay ứng với một chu kỳ: f = n = 25 Hz.'},
      {q: 'Máy biến áp có N₁ = 1000 vòng, N₂ = 50 vòng, U₁ = 220 V. Điện áp thứ cấp (coi lí tưởng) là:', options: ['4,4 V', '11 V', '22 V', '4400 V'], answer: 1, explain: 'U₂ = U₁·N₂/N₁ = 220·50/1000 = 11 V.'},
      {q: 'Máy biến áp lí tưởng có N₂ = 10N₁. Nếu cuộn thứ cấp cấp dòng I₂ = 0,5 A thì dòng sơ cấp là:', options: ['0,05 A', '0,5 A', '5 A', '50 A'], answer: 2, explain: 'I₁/I₂ = N₂/N₁ = 10 nên I₁ = 5 A (P₁ = P₂).'},
      {q: 'Người ta dùng điện áp cao khi truyền tải điện đi xa chủ yếu để:', options: ['Tăng công suất của nhà máy', 'Giảm hao phí toả nhiệt trên đường dây', 'Tăng tần số của dòng điện', 'Giảm điện trở của dây'], answer: 1, explain: 'P_hp = (P/U)²R giảm khi tăng U.'},
      {q: 'Lõi của máy biến áp thường làm bằng thép lá mỏng ghép cách điện nhằm:', options: ['Giảm dòng điện xoáy và hao phí', 'Tăng điện trở của cuộn dây', 'Tăng điện áp thứ cấp', 'Làm nhẹ máy'], answer: 0, explain: 'Lõi nhiều lá mỏng cách điện làm giảm dòng Fu-cô (dòng điện xoáy), giảm hao phí nhiệt trong lõi.'},
    ],
    summary: [
      'Máy phát điện xoay chiều: Φ = NBS·cosωt, e = NBSω·sinωt; f = n; giá trị hiệu dụng E = E₀/√2.',
      'Máy biến áp: U₂/U₁ = N₂/N₁; với tải nặng I₁/I₂ ≈ N₂/N₁; N₂ > N₁ là tăng áp, N₂ < N₁ là hạ áp.',
      'Biến áp thực có hao phí (nhiệt ở cuộn dây và lõi): P₁ = P₂ + P_hp, hiệu suất H = P₂/P₁ < 100 %.',
      'Truyền tải điện xa: P_hp = (P/U)²R nên dùng điện áp cao.',
    ],
  };
}

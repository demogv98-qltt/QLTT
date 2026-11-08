// Nội dung bài học M4 (Vật lí 10 KNTT: chuyển động ném). ctx = {s: mô hình, r: readout, td}. act = {set({alpha, v0, h0, D}), reset()}.
import {ideal, G, D2R} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m4',
    title: 'Chuyển động ném: súng bắn bi',
    objectives: [
      'Phân tích chuyển động ném thành hai chuyển động độc lập: thẳng đều theo phương ngang và rơi tự do theo phương thẳng đứng.',
      'Tính thời gian bay, tầm xa của vật ném ngang: t = √(2h/g), L = v₀·t.',
      'Tính tầm xa L = v₀²·sin2α/g và độ cao cực đại H = v₀²·sin²α/(2g) của vật ném xiên.',
      'Giải thích vì sao α = 45° cho tầm xa lớn nhất và hai góc phụ nhau cho cùng tầm xa.',
    ],
    steps: [
      {type: 'do', title: 'Ném ngang', text: 'Đặt α = 0° (bắn ngang), độ cao súng h₀ = 2 m và v₀ = 6 m/s.', hints: ['Kéo α về 0, h₀ lên 2,0 và v₀ về 6,0.'], setup: () => act.set({alpha: 30, v0: 10, h0: 0.5, D: 5}),
        check: (c) => c.s.alpha === 0 && near(c.s.h0, 2, 0.05) && near(c.s.v0, 6, 0.05), explain: 'Bi rời súng theo phương ngang với vận tốc 6 m/s ở độ cao 2 m.'},
      {type: 'predict', title: 'Đoán trước: thời gian bay', text: 'Theo phương thẳng đứng bi rơi tự do từ độ cao 2 m. Thời gian bay là bao nhiêu? (g = 9,8 m/s²)', unit: 's', hints: ['h = ½·g·t² → t = √(2h/g).', 't = √(4/9,8).'], answer: (c) => ideal.t(c.s.h0), tol: 0.01,
        explain: 't = √(2·2/9,8) ≈ 0,639 s. Thời gian bay chỉ phụ thuộc độ cao, không phụ thuộc v₀.'},
      {type: 'predict', title: 'Đoán trước: tầm xa', text: 'Theo phương ngang bi chuyển động đều với 6 m/s trong thời gian đó. Tầm xa L là bao nhiêu mét?', unit: 'm', hints: ['L = v₀·t', 'L = 6·0,639.'], answer: (c) => ideal.L(c.s.v0, c.s.h0), tol: 0.05, explain: 'L = v₀·t ≈ 6·0,639 ≈ 3,83 m.'},
      {type: 'do', title: 'Bắn thử', text: 'Bấm “Bắn” và quan sát các “ảnh bi” cách nhau 0,1 s: khoảng cách ngang giữa chúng bằng nhau, khoảng cách đứng tăng dần.', hints: ['Bấm 🎯 Bắn (có thể chọn ×0,25 để xem chậm).'], setup: () => act.reset(), check: (c) => c.s.landed,
        explain: 'Đúng như em tính: tầm xa ≈ 3,83 m. Hai chuyển động ngang (đều) và đứng (rơi tự do) xảy ra độc lập.'},
      {type: 'choice', title: 'Thay đổi tốc độ bắn', text: 'Nếu bắn mạnh gấp đôi (v₀ = 12 m/s) từ cùng độ cao 2 m thì thời gian bay:', options: ['Tăng gấp đôi', 'Không đổi', 'Giảm một nửa'], answer: 1, wrong: ['Thời gian chỉ phụ thuộc độ cao h, vì theo phương đứng bi vẫn rơi tự do từ 2 m.', '', 'Bắn mạnh hơn không làm bi rơi nhanh hơn.'], hints: ['Thời gian bay do chuyển động theo phương nào quyết định?'],
        explain: 'Thời gian bay không đổi (0,639 s), còn tầm xa tăng gấp đôi vì L = v₀·t.'},
      {type: 'do', title: 'Ném xiên 45°', text: 'Đặt h₀ = 0, α = 45°, v₀ = 10 m/s.', hints: ['Kéo α về 45, v₀ về 10 và h₀ về 0.'], setup: () => act.set({alpha: 20, v0: 8, h0: 1, D: 8}), check: (c) => near(c.s.alpha, 45, 0.5) && near(c.s.v0, 10, 0.05) && c.s.h0 === 0, explain: 'v₀ phân tích thành vₓ = v₀cosα ≈ 7,07 m/s và v_y₀ = v₀sinα ≈ 7,07 m/s.'},
      {type: 'predict', title: 'Đoán trước: tầm xa', text: 'Tầm xa của vật ném xiên từ mặt đất: L = v₀²·sin2α/g. Với v₀ = 10 m/s, α = 45° thì L bằng bao nhiêu?', unit: 'm', hints: ['sin90° = 1.', 'L = 100/9,8.'], answer: (c) => ideal.Lxien(c.s.v0, c.s.alpha), tol: 0.1, explain: 'L = 100·1/9,8 ≈ 10,2 m.'},
      {type: 'predict', title: 'Đoán trước: độ cao cực đại', text: 'Độ cao cực đại H = v₀²·sin²α/(2g) bằng bao nhiêu mét?', unit: 'm', hints: ['sin²45° = 0,5.', 'H = 100·0,5/19,6.'], answer: (c) => ideal.Hmax(c.s.v0, c.s.alpha) + c.s.h0, tol: 0.05, explain: 'H = 50/19,6 ≈ 2,55 m. Ở điểm cao nhất vận tốc thẳng đứng bằng 0 nhưng vận tốc ngang vẫn là 7,07 m/s.'},
      {type: 'choice', title: 'Góc cho tầm xa lớn nhất', text: 'Với cùng v₀, bắn từ mặt đất, góc nào cho tầm xa lớn nhất?', options: ['30°', '45°', '60°'], answer: 1, wrong: ['Thử so sánh L(30°), L(45°), L(60°) bằng công thức sin2α.', '', 'Thử so sánh L(30°), L(45°), L(60°) bằng công thức sin2α.'], hints: ['L ∝ sin2α, lớn nhất khi sin2α = 1.'], explain: 'sin2α = 1 khi α = 45°. Em có thể bật “So sánh góc phụ” để thấy 30° và 60° cho cùng một tầm xa, thấp hơn 45°.'},
      {type: 'do', title: 'Bắn trúng bia', text: 'Bia đặt ở D = 8 m. Giữ v₀ = 10 m/s, h₀ = 0; chọn góc α rồi bấm Bắn để bi rơi vào bia (sai số 0,3 m). Gợi ý: sin2α = g·D/v₀².', hints: ['sin2α = 9,8·8/100 = 0,784 → 2α ≈ 51,6° → α ≈ 26°.', 'Còn một đáp án khác ở góc phụ: 90° − 26° ≈ 64°.'], setup: () => act.set({alpha: 40, v0: 10, h0: 0, D: 8}),
        check: (c) => c.s.landed && c.s.hit, explain: 'Hai góc α ≈ 25,8° và 64,2° (phụ nhau) đều trúng bia, vì sin2α có cùng giá trị.'},
      {type: 'do', title: 'Bóc tách súng', text: 'Bấm TEARDOWN (phím T): thấy lò xo và pít-tông trong nòng. Lò xo càng nén thì v₀ càng lớn.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Thế năng đàn hồi ½kx² biến thành động năng ½mv₀² của bi: v₀ = x·√(k/m).'},
    ],
    quiz: [
      {q: 'Một vật được ném ngang. Thời gian bay phụ thuộc vào:', options: ['Chỉ độ cao ném', 'Chỉ tốc độ ném', 'Cả độ cao và tốc độ ném', 'Khối lượng vật'], answer: 0, explain: 't = √(2h/g): chỉ phụ thuộc độ cao h.'},
      {q: 'Bỏ qua lực cản, trong chuyển động ném thành phần vận tốc theo phương ngang:', options: ['Tăng dần', 'Giảm dần', 'Không đổi', 'Bằng 0 ở điểm cao nhất'], answer: 2, explain: 'Theo phương ngang không có lực nên vₓ = v₀cosα không đổi.'},
      {q: 'Ở điểm cao nhất của quỹ đạo ném xiên:', options: ['Vận tốc bằng 0', 'Vận tốc thẳng đứng bằng 0, vận tốc ngang khác 0', 'Gia tốc bằng 0', 'Vận tốc ngang bằng 0'], answer: 1, explain: 'v_y = 0 nhưng vₓ vẫn khác 0, và gia tốc vẫn là g hướng xuống.'},
      {q: 'Vật ném ngang từ độ cao 20 m (g = 9,8 m/s²). Thời gian bay gần bằng:', options: ['1,0 s', '2,0 s', '4,0 s', '0,5 s'], answer: 1, explain: 't = √(2·20/9,8) ≈ 2,02 s.'},
      {q: 'Cùng tốc độ ném, từ mặt đất, tầm xa lớn nhất khi góc ném bằng:', options: ['30°', '45°', '60°', '90°'], answer: 1, explain: 'L = v₀²sin2α/g đạt cực đại khi α = 45°.'},
    ],
    summary: [
      'Chuyển động ném = chuyển động đều theo phương ngang + rơi tự do (hoặc ném lên) theo phương đứng.',
      'Ném ngang: t = √(2h/g) ; L = v₀·t. Thời gian bay không phụ thuộc v₀.',
      'Ném xiên: L = v₀²sin2α/g ; H = v₀²sin²α/(2g). α = 45° cho tầm xa lớn nhất; α và 90° − α cho cùng tầm xa.',
      'vₓ = v₀cosα không đổi; v_y = v₀sinα − g·t.',
    ],
  };
}
void D2R; void G;

// Nội dung bài học M7 (Vật lí 10 KNTT: trọng lực, lực căng, lực ma sát). ctx = {s: mô hình, r: readout, td}.
// act = {set({mat, alpha, m, F}), reset()}.
import {ideal, G} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m7',
    title: 'Ma sát và mặt phẳng nghiêng: ván nghiêng và lực kế',
    objectives: [
      'Phân tích trọng lực trên mặt phẳng nghiêng: Px = mg·sinα (dọc ván), N = mg·cosα (vuông góc ván).',
      'Phân biệt ma sát nghỉ (cân bằng với lực kéo, tối đa μs·N) và ma sát trượt (μk·N).',
      'Tự đo hệ số ma sát nghỉ: vật bắt đầu trượt khi tan α = μs.',
      'Giải thích vì sao có ma sát (bề mặt mấp mô) và vì sao lực căng dây bằng số chỉ của lực kế.',
    ],
    steps: [
      {type: 'do', title: 'Chuẩn bị thí nghiệm', text: 'Chọn “Gỗ trên gỗ”, đặt m = 5 kg, góc nghiêng α = 0° (ván nằm ngang), lực kéo F = 0.', hints: ['Bấm nút “Gỗ trên gỗ”, kéo m về 5 và α về 0.'],
        setup: () => act.set({mat: 1, alpha: 10, m: 3, F: 0}), check: (c) => c.s.mat === 0 && near(c.s.m, 5, 0.05) && c.s.alpha < 0.3 && c.s.F === 0,
        explain: 'Vật nằm yên trên mặt ngang. Hai lực tác dụng: trọng lực P hướng xuống và phản lực N của ván hướng lên.'},
      {type: 'predict', title: 'Đoán trước: phản lực N', text: 'Ván nằm ngang, vật nặng 5 kg (lấy g = 9,8 m/s²). Phản lực N của ván bằng bao nhiêu?', unit: 'N',
        hints: ['Vật đứng yên theo phương thẳng đứng: N = P.', 'P = m·g = 5·9,8.'], answer: (c) => ideal.N(c.s.m, c.s.alpha), tol: 0.5, explain: 'N = P = mg = 5·9,8 = 49 N.'},
      {type: 'do', title: 'Nghiêng ván 20°', text: 'Nâng ván lên α = 20° và đợi vật nằm yên. Quan sát sơ đồ lực ở bảng bên trái.', hints: ['Kéo thanh α tới 20°.'], setup: () => act.reset(),
        check: (c) => near(c.s.alpha, 20, 1) && c.r.v === 0 && !c.r.moving, explain: 'Vật vẫn đứng yên vì ma sát nghỉ giữ nó. Trọng lực P được phân tích thành Px (dọc ván, kéo vật xuống) và Py (ép vào ván).'},
      {type: 'predict', title: 'Đoán trước: phản lực N ở 20°', text: 'Khi ván nghiêng 20°, phản lực N bằng bao nhiêu?', unit: 'N',
        hints: ['N cân bằng với thành phần Py của trọng lực.', 'N = m·g·cosα = 49·cos20°.'], answer: (c) => ideal.N(c.s.m, c.s.alpha), tol: 0.5,
        explain: 'N = mg·cosα = 49·0,94 ≈ 46,0 N, nhỏ hơn P vì ván chỉ đỡ một phần trọng lực.'},
      {type: 'predict', title: 'Đoán trước: ma sát nghỉ', text: 'Vật đứng yên ở 20°. Lực ma sát nghỉ tác dụng lên vật bằng bao nhiêu?', unit: 'N',
        hints: ['Vật đứng yên nên các lực dọc ván cân bằng.', 'Fms = Px = m·g·sinα. (Không phải μs·N!)'], answer: (c) => ideal.Px(c.s.m, c.s.alpha), tol: 0.3,
        explain: 'Fms = Px = mg·sinα ≈ 16,8 N. Ma sát nghỉ chỉ lớn đúng bằng lực cần để giữ vật, và nhỏ hơn mức tối đa μs·N ≈ 23 N.'},
      {type: 'do', title: 'Tự đo hệ số ma sát nghỉ', text: 'Giữ F = 0, tăng góc α thật chậm cho đến khi vật bắt đầu trượt. Máy sẽ ghi lại góc đó.', hints: ['Kéo thanh α dần dần: 21°, 22°, … cho tới khi vật trượt.'],
        check: (c) => c.s.slid, explain: 'Vật bắt đầu trượt khi tan α = μs. Em đo được α₀ ≈ 26,6° → μs = tan 26,6° ≈ 0,50, đúng với bảng. Đây là cách đo hệ số ma sát nghỉ bằng ván nghiêng.'},
      {type: 'predict', title: 'Đoán trước: gia tốc khi trượt', text: 'Ván nghiêng 40°, gỗ trên gỗ (μk = 0,4). Vật trượt xuống với gia tốc bao nhiêu?', unit: 'm/s²',
        hints: ['Dọc ván: m·a = Px − μk·N.', 'a = g(sinα − μk·cosα).'], setup: () => { act.set({alpha: 40, F: 0}); act.reset(); }, answer: (c) => ideal.slideAcc(c.s.alpha, 0.4), tol: 0.1,
        explain: 'a = 9,8·(sin40° − 0,4·cos40°) ≈ 3,30 m/s². Khối lượng m triệt tiêu nên vật nhẹ hay nặng đều trượt cùng gia tốc.'},
      {type: 'choice', title: 'Đổi vật liệu', text: 'Thay đế bằng cao su (μs = 0,9) vẫn ở 40°. Vật sẽ thế nào? (gợi ý: so tan 40° ≈ 0,84 với μs)', options: ['Vẫn trượt xuống', 'Đứng yên'], answer: 1,
        wrong: ['Hãy so sánh: tan 40° ≈ 0,84 nhỏ hơn μs = 0,9.'], hints: ['Vật trượt khi tan α > μs.'], explain: 'tan 40° = 0,84 < 0,9 nên ma sát nghỉ của cao su giữ được vật. Hãy kiểm tra bằng cách chọn “Cao su”.'},
      {type: 'do', title: 'Kiểm tra bằng thí nghiệm', text: 'Chọn “Cao su trên gỗ” và bấm “Đặt vật về giữa ván”. Vật có đứng yên không?', hints: ['Bấm nút “Cao su trên gỗ”, rồi “↺ Đặt vật về giữa ván”.'],
        check: (c) => c.s.mat === 1 && near(c.s.alpha, 40, 1) && !c.r.moving && c.s.t > 0, explain: 'Đúng: với cao su vật đứng yên ở 40° (ma sát nghỉ cực đại lớn hơn Px).'},
      {type: 'predict', title: 'Đoán trước: kéo vật trên mặt ngang', text: 'Gỗ trên gỗ, ván nằm ngang, m = 5 kg. Lực kéo F tối thiểu bằng bao nhiêu để vật bắt đầu nhúc nhích?', unit: 'N',
        hints: ['Ma sát nghỉ cực đại = μs·N.', 'N = 49 N, μs = 0,5.'], setup: () => { act.set({mat: 0, alpha: 0, m: 5, F: 0}); act.reset(); }, answer: (c) => ideal.staticMax(c.s.m, c.s.alpha, c.r.mat.mus), tol: 0.6,
        explain: 'F ≥ μs·N = 0,5·49 = 24,5 N. Dưới giá trị này vật vẫn đứng yên và ma sát nghỉ đúng bằng F.'},
      {type: 'do', title: 'Kéo từ từ bằng lực kế', text: 'Tăng F từ 0 lên từ từ cho đến khi vật bắt đầu chuyển động. Lực kế đang chỉ lực căng của dây.', hints: ['Kéo thanh F dần: 5, 10, 20, 25 N…'], check: (c) => c.s.pulled !== null,
        explain: 'Vật nhúc nhích khi F ≈ 24,5 N = μs·N. Khi đã trượt, chỉ cần F ≈ μk·N = 19,6 N để vật chuyển động đều. Lực căng dây = số chỉ lực kế = F.'},
      {type: 'do', title: 'Bóc tách: bề mặt tiếp xúc', text: 'Bấm TEARDOWN (phím T): vật được nhấc lên và kính lúp phóng to hai bề mặt.', hints: ['Nút cam “TEARDOWN” ở bảng bên phải.'], check: (c) => c.td > 0.85,
        explain: 'Hai bề mặt đều mấp mô; các chỗ lồi lõm “cài” vào nhau nên cản trở chuyển động. Bề mặt càng nhám (μ càng lớn) thì răng cưa càng sâu.'},
    ],
    quiz: [
      {q: 'Vật 2 kg nằm yên trên mặt ngang (g = 9,8 m/s²). Phản lực N của mặt bằng:', options: ['2 N', '19,6 N', '9,8 N', '0 N'], answer: 1, explain: 'N = P = mg = 2·9,8 = 19,6 N.'},
      {q: 'Độ lớn lực ma sát trượt phụ thuộc vào:', options: ['Diện tích mặt tiếp xúc', 'Tốc độ của vật', 'Áp lực N và vật liệu, tình trạng bề mặt', 'Thời gian chuyển động'], answer: 2, explain: 'Fms = μk·N: chỉ phụ thuộc áp lực N và hệ số ma sát (vật liệu, độ nhám), không phụ thuộc diện tích tiếp xúc.'},
      {q: 'Vật nằm yên trên mặt phẳng nghiêng. Lực ma sát nghỉ có độ lớn bằng:', options: ['μs·N', 'Thành phần trọng lực dọc mặt phẳng nghiêng (mg·sinα)', 'Trọng lượng của vật', 'Phản lực N'], answer: 1, explain: 'Vật đứng yên nên Fms cân bằng với Px = mg·sinα; μs·N chỉ là giá trị cực đại có thể đạt.'},
      {q: 'Vật bắt đầu trượt xuống trên ván nghiêng khi:', options: ['sin α = μs', 'tan α > μs', 'cos α = μs', 'α > 45° với mọi vật'], answer: 1, explain: 'Px > μs·N ⟺ mg·sinα > μs·mg·cosα ⟺ tan α > μs.'},
      {q: 'So với ma sát trượt, lực ma sát nghỉ cực đại thường:', options: ['Nhỏ hơn', 'Bằng', 'Lớn hơn một chút', 'Luôn bằng 0'], answer: 2, explain: 'μs thường lớn hơn μk: kéo vật “bắt đầu” khó hơn giữ cho vật chuyển động.'},
    ],
    summary: [
      'Trên mặt phẳng nghiêng: N = mg·cosα ; Px = mg·sinα.',
      'Ma sát nghỉ cân bằng lực kéo vật, tối đa μs·N. Ma sát trượt Fms = μk·N, ngược chiều chuyển động.',
      'Vật bắt đầu trượt khi tan α > μs → đo μs = tan α₀. Gia tốc trượt: a = g(sinα − μk·cosα).',
      'Lực căng dây = số chỉ của lực kế; ma sát do bề mặt mấp mô cài vào nhau.',
    ],
  };
}
void 0;

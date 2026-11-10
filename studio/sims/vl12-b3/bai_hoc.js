// Nội dung bài học B3 (Vật lí 12 KNTT: lực từ tác dụng lên đoạn dây dẫn mang dòng điện — ◻ thầy đối chiếu tên/số bài trong sách).
// ctx = {s: mô hình, r: readout, td}. act = {set({I, B, l, th})}.
import {P} from './physics.js';
export function makeLesson(act) {
  const ok = (c) => c.r.settled;
  const near = (a, b, t = 0.06) => Math.abs(a - b) <= t;
  return {
    code: 'vl12-b3',
    title: 'Lực từ lên dây dẫn mang dòng điện: F = B·I·l·sinθ',
    objectives: [
      'Nhận biết lực từ tác dụng lên đoạn dây có dòng điện đặt trong từ trường đều, và xác định chiều bằng quy tắc bàn tay trái.',
      'Phát biểu và vận dụng F = B·I·l·sinθ; hiểu vai trò của góc θ giữa dây và đường sức từ.',
      'Đo F bằng độ dịch của lò xo, vẽ đồ thị F theo I và rút ra B từ hệ số góc.',
      'Hiểu mô hình: từ trường đều chỉ có trong khoảng giữa hai cực, bỏ qua từ trường của chính dây và từ trường rìa.',
    ],
    steps: [
      {type: 'do', title: 'Đóng mạch', text: 'B = 0,20 T, l = 0,20 m, θ = 90°. Kéo thanh trượt I tới 3 A (hoặc bấm thí nghiệm mẫu 1) và quan sát thanh đồng.', hints: ['Thanh trượt I ở bảng bên phải; đặt 3,0.'], setup: () => act.set({I: 0, B: 0.2, l: 0.2, th: 90}), check: (c) => near(c.r.Icmd, 3, 0.15) && ok(c), explain: 'Thanh nhích lên: có lực từ hướng lên. Mũi tên cam là vectơ lực, mũi tên xanh lá là chiều dòng điện.'},
      {type: 'predict', title: 'Đoán trước: độ lớn lực từ', text: 'Tính F = B·I·l·sinθ (đơn vị N) với B = 0,20 T, I = 3 A, l = 0,20 m, θ = 90°.', unit: 'N', hints: ['sin90° = 1.'], answer: () => 0.2 * 3 * 0.2, tol: 0.004, explain: 'F = 0,20·3·0,20·1 = 0,12 N. “F đo” trong bảng số liệu lấy từ độ dịch của hai lò xo nên cũng 0,12 N.'},
      {type: 'predict', title: 'Đoán trước: độ dịch của thanh', text: 'Hai lò xo giống nhau, mỗi cái k = 4 N/m, cùng nâng thanh. Độ nâng của thanh Δy = F/(2k) bằng bao nhiêu cm?', unit: 'cm', hints: ['2k = 8 N/m; Δy = 0,12/8 (m).'], answer: () => (0.12 / (2 * P.k)) * 100, tol: 0.15, explain: 'Δy = 0,12/8 = 0,015 m = 1,5 cm. Mũi chỉ cam trên thước đã dịch 1,5 cm so với vạch 0.'},
      {type: 'choice', title: 'Đổi chiều dòng điện', text: 'Giữ nguyên nam châm, đổi chiều dòng điện (I = −3 A). Thanh sẽ:', options: ['Vẫn đi lên', 'Đi xuống', 'Đứng yên'], answer: 1, wrong: ['Lực từ phụ thuộc chiều dòng điện: đổi chiều I thì đổi chiều lực.', '', 'Vẫn có dòng điện 3 A nên vẫn có lực.'], hints: ['F⃗ = I·l⃗ × B⃗: đổi dấu I thì F⃗ đổi dấu.'], explain: 'Đổi chiều I thì lực từ đổi chiều (độ lớn không đổi).'},
      {type: 'do', title: 'Thử đổi chiều I', text: 'Kéo I về −3 A (hoặc thí nghiệm mẫu 2).', hints: ['Kéo thanh trượt I sang trái, về −3,0.'], check: (c) => near(c.r.Icmd, -3, 0.15) && c.r.dir < 0 && ok(c), explain: 'Thanh đi xuống 1,5 cm. Trên hình nhìn từ trên xuống, F là ⊗ (vào trang).'},
      {type: 'choice', title: 'Quy tắc bàn tay trái', text: 'Đặt bàn tay trái sao cho đường sức từ xuyên vào lòng bàn tay, chiều từ cổ tay đến ngón tay giữa là chiều dòng điện. Ngón cái choãi ra 90° chỉ:', options: ['Chiều của từ trường', 'Chiều của lực từ', 'Chiều của lực hấp dẫn'], answer: 1, wrong: ['Đường sức đã xuyên vào lòng bàn tay, ngón cái không chỉ chiều B.', '', 'Quy tắc này nói về lực từ.'], hints: ['Ngón cái choãi ra chỉ “lực”.'], explain: 'Ngón cái choãi ra chỉ chiều lực từ F⃗. Chiều này khớp với tích có hướng F⃗ = I·l⃗ × B⃗.'},
      {type: 'do', title: 'Thu thập số liệu F theo I', text: 'Đặt I lần lượt là 1, 2, 3, 4, 5 A (mỗi lần chờ thanh đứng yên) rồi bấm “＋ Ghi số liệu”. B, l, θ giữ nguyên.', hints: ['Kéo I về 1,0 → đợi → Ghi; rồi 2,0 → …'], setup: () => act.set({I: 1, B: 0.2, l: 0.2, th: 90, clear: true}), check: (c) => new Set(c.s.rows.filter((q) => q.I > 0).map((q) => Math.round(q.I))).size >= 5, explain: 'Bảng có 5 dòng: F tăng đều theo I; các điểm cam nằm trên đường nét đứt.'},
      {type: 'choice', title: 'Dạng đồ thị F theo I', text: 'Với B, l, θ không đổi, đồ thị F theo I là:', options: ['Đường thẳng qua gốc toạ độ', 'Đường cong parabol', 'Đường thẳng nằm ngang'], answer: 0, wrong: ['', 'Parabol là khi F tỉ lệ với I².', 'Đường ngang nghĩa là F không phụ thuộc I.'], hints: ['F = (B·l·sinθ)·I.'], explain: 'F tỉ lệ thuận với I: đồ thị là đường thẳng qua gốc.'},
      {type: 'predict', title: 'Hệ số góc → B', text: 'Hệ số góc đường thẳng F–I là F/I = B·l·sinθ. Từ đó em tính B (T). (l = 0,20 m, θ = 90°, F/I đọc từ bảng.)', unit: 'T', hints: ['F/I = 0,04 N/A; B = (F/I)/l.'], setup: () => act.set({B: 0.2, l: 0.2, th: 90}), answer: () => 0.2, tol: 0.01, explain: 'F/I = 0,04 N/A nên B = 0,04/0,20 = 0,20 T. Đây chính là cách đo cảm ứng từ B bằng “cân dòng điện”.'},
      {type: 'do', title: 'Tăng B gấp 1,5', text: 'Đặt I = 3 A, kéo B từ 0,20 lên 0,30 T. Quan sát F và độ dịch.', hints: ['Thanh trượt B ở bảng điều khiển.'], setup: () => act.set({I: 3, B: 0.2, l: 0.2, th: 90}), check: (c) => near(c.r.B, 0.3, 0.015) && near(c.r.Icmd, 3, 0.15) && ok(c), explain: 'F tăng từ 0,12 lên 0,18 N: F tỉ lệ thuận với B.'},
      {type: 'choice', title: 'F theo l', text: 'Giữ B, I, θ; rút ngắn đoạn dây trong từ trường (thu hẹp cực từ) còn một nửa. F sẽ:', options: ['Giảm một nửa', 'Không đổi', 'Tăng gấp đôi'], answer: 0, wrong: ['', 'Chỉ đoạn dây nằm trong từ trường chịu lực: l nhỏ đi thì F nhỏ đi.', 'Ngược lại.'], hints: ['F tỉ lệ thuận với l.'], explain: 'F = B·I·l·sinθ ∝ l. Thử bằng thanh trượt l (0,10 m).'},
      {type: 'predict', title: 'Đoán trước: nghiêng góc θ', text: 'B = 0,20 T, I = 3 A, l = 0,20 m, xoay nam châm cho θ = 45°. Tính F (N).', unit: 'N', setup: () => act.set({I: 3, B: 0.2, l: 0.2, th: 45}), hints: ['sin45° ≈ 0,707.'], answer: () => 0.2 * 3 * 0.2 * Math.sin(Math.PI / 4), tol: 0.004, explain: 'F = 0,12·0,707 ≈ 0,085 N. Chỉ thành phần B·sinθ vuông góc với dây gây ra lực.'},
      {type: 'choice', title: 'Khi dây song song đường sức', text: 'Khi θ = 0° (dây song song với đường sức từ), lực từ lên dây là bao nhiêu? (Trên thiết bị này không đặt dây song song với đường sức được vì dây chạm cực từ; kết quả suy từ công thức.)', options: ['F = 0', 'F cực đại', 'F = B·I·l/2'], answer: 0, wrong: ['', 'F cực đại khi θ = 90°.', 'Không có cơ sở này.'], hints: ['sin0° = 0.'], explain: 'F = B·I·l·sin0° = 0. Lực cực đại khi dây vuông góc với đường sức (θ = 90°).'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): xem hai cực nam châm, đường sức đều, hai lò xo và thanh ngang cách điện (gỗ).', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Dòng điện đi từ cực + của nguồn qua trụ, dây nối, lò xo rồi vào thanh đồng (thanh ngang bằng gỗ nên không dẫn điện), ra theo lò xo kia về cực −. Đường sức từ đi từ cực N sang cực S.'},
    ],
    quiz: [
      {q: 'Dây dẫn dài 0,5 m đặt vuông góc với từ trường đều B = 0,4 T, I = 2 A. Lực từ là:', options: ['0,1 N', '0,2 N', '0,4 N', '1,6 N'], answer: 2, explain: 'F = B·I·l·sin90° = 0,4·2·0,5 = 0,4 N.'},
      {q: 'Dây thẳng dài 20 cm, I = 5 A, đặt trong từ trường đều B = 0,1 T hợp với dây góc 30°. F bằng:', options: ['0,05 N', '0,087 N', '0,1 N', '0,5 N'], answer: 0, explain: 'F = 0,1·5·0,2·sin30° = 0,05 N.'},
      {q: 'Lực từ tác dụng lên dây dẫn mang dòng điện đạt giá trị cực đại khi:', options: ['Dây song song với đường sức từ', 'Dây vuông góc với đường sức từ', 'Dây hợp với đường sức 45°', 'Dòng điện bằng 0'], answer: 1, explain: 'F ∝ sinθ, cực đại khi θ = 90°.'},
      {q: 'Khi đổi chiều dòng điện, giữ nguyên từ trường, lực từ:', options: ['Không đổi', 'Đổi chiều, độ lớn không đổi', 'Giảm một nửa', 'Bằng 0'], answer: 1, explain: 'F⃗ = I·l⃗ × B⃗ đổi dấu theo I.'},
      {q: 'Đồ thị lực từ F theo cường độ dòng điện I (B, l, θ không đổi) là đường thẳng qua gốc với hệ số góc bằng:', options: ['B', 'B·l·sinθ', 'B/l', 'I·l'], answer: 1, explain: 'F = (B·l·sinθ)·I nên hệ số góc là B·l·sinθ.'},
    ],
    summary: [
      'Lực từ lên đoạn dây dẫn mang dòng điện trong từ trường đều: F⃗ = I·l⃗ × B⃗, độ lớn F = B·I·l·sinθ.',
      'Chiều lực theo quy tắc bàn tay trái: đường sức xuyên vào lòng bàn tay, ngón giữa theo chiều dòng điện, ngón cái choãi ra chỉ chiều lực.',
      'F cực đại khi θ = 90°, bằng 0 khi θ = 0°; đổi chiều I (hoặc B) thì đổi chiều F.',
      'Có thể đo B bằng cân dòng điện: B = F/(I·l) khi dây vuông góc với đường sức.',
    ],
  };
}

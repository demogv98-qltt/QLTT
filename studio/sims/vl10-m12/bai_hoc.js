// Nội dung bài học M12 (Vật lí 10 KNTT: chuyển động tròn đều, gia tốc hướng tâm, lực hướng tâm). ctx = {s: mô hình, r: readout, td}.
// act = {set({m, r, w}), reset()}.
import {FMAX} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const is = (c, m, r, w) => near(c.s.m, m, 0.03) && near(c.s.r, r, 0.03) && near(c.s.w, w, 0.06);
  return {
    code: 'vl10-m12',
    title: 'Chuyển động tròn đều: bi quay trên mâm, dây nối cảm biến lực',
    objectives: [
      'Nêu được tốc độ dài v = ω·r, chu kì T = 2π/ω và tần số f = 1/T của chuyển động tròn đều.',
      'Biết gia tốc hướng tâm a = ω²r = v²/r luôn hướng vào tâm quỹ đạo.',
      'Tính lực hướng tâm F = m·ω²·r và nhận ra đó là lực căng của dây, không phải một “lực ly tâm” hướng ra ngoài.',
      'Giải thích vì sao khi dây đứt, vật bay thẳng theo phương tiếp tuyến (định luật 1 Newton).',
    ],
    steps: [
      {type: 'do', title: 'Dựng thí nghiệm', text: 'Đặt m = 0,5 kg, r = 1 m, ω = 4 rad/s. Hoặc bấm thí nghiệm mẫu 1 ở bảng bên phải.', hints: ['Bấm “Quay đều ω = 4 rad/s”.'], setup: () => act.set({m: 0.5, r: 1, w: 4}), check: (c) => is(c, 0.5, 1, 4), explain: 'Bi 0,5 kg quay đều trên đường tròn bán kính 1 m, mỗi giây quay được 4 rad.'},
      {type: 'predict', title: 'Đoán trước: tốc độ dài', text: 'Tốc độ dài của bi là v = ω·r bằng bao nhiêu?', unit: 'm/s', hints: ['v = 4·1.'], answer: (c) => c.s.w * c.s.r, tol: 0.05, explain: 'v = ω·r = 4·1 = 4 m/s. Tốc độ không đổi nhưng hướng của vận tốc luôn đổi, nên chuyển động có gia tốc.'},
      {type: 'predict', title: 'Đoán trước: chu kì', text: 'Chu kì T = 2π/ω (thời gian quay một vòng) bằng bao nhiêu giây?', unit: 's', hints: ['T = 6,283/4.'], answer: (c) => (2 * Math.PI) / c.s.w, tol: 0.03, explain: 'T = 2π/4 ≈ 1,57 s, tức tần số f = 1/T ≈ 0,64 vòng mỗi giây.'},
      {type: 'predict', title: 'Đoán trước: gia tốc hướng tâm', text: 'Gia tốc hướng tâm a = ω²·r bằng bao nhiêu?', unit: 'm/s²', hints: ['ω² = 16.', 'Cũng bằng v²/r = 16/1.'], answer: (c) => c.s.w ** 2 * c.s.r, tol: 0.1, explain: 'a = ω²r = 16 m/s². Hai cách tính ω²r và v²/r cho cùng kết quả (xem bảng bên trái).'},
      {type: 'choice', title: 'Gia tốc hướng về đâu?', text: 'Nhìn sơ đồ “nhìn từ trên xuống”: mũi tên cam (gia tốc, lực căng dây) chỉ về phía nào?', options: ['Về tâm quỹ đạo', 'Theo phương tiếp tuyến, cùng chiều vận tốc', 'Ra xa tâm quỹ đạo'], answer: 0, wrong: ['', 'Vận tốc mới ở phương tiếp tuyến (mũi tên xanh). Gia tốc vuông góc với nó vì tốc độ không đổi.', 'Không có lực nào kéo bi ra ngoài: dây chỉ có thể kéo bi vào tâm.'], hints: ['Dây chỉ kéo, không đẩy. Dây nối bi với tâm.'], explain: 'Gia tốc hướng tâm luôn hướng vào tâm, vuông góc với vận tốc.'},
      {type: 'predict', title: 'Đoán trước: lực hướng tâm', text: 'Lực hướng tâm F = m·a bằng bao nhiêu? Cảm biến lực ở tâm sẽ đọc giá trị này.', unit: 'N', hints: ['F = 0,5·16.'], answer: (c) => c.s.m * c.s.w ** 2 * c.s.r, tol: 0.1, explain: 'F = m·ω²·r = 0,5·16·1 = 8 N. Bảng số liệu hiện F_ht = 8,0 N: cảm biến lực đọc đúng giá trị đã tính.'},
      {type: 'do', title: 'Gấp đôi tốc độ góc', text: 'Kéo ω lên 8 rad/s (giữ m = 0,5 kg, r = 1 m). Quan sát F_ht và điểm đen trên đồ thị.', hints: ['Thanh trượt ω hoặc thí nghiệm mẫu 2.'], check: (c) => is(c, 0.5, 1, 8), explain: 'ω tăng gấp 2 thì F_ht tăng gấp 4 vì F tỉ lệ với ω².'},
      {type: 'choice', title: 'Lực tăng bao nhiêu lần?', text: 'ω tăng gấp đôi (m, r giữ nguyên). Lực căng dây F_ht tăng:', options: ['Gấp 2 lần', 'Gấp 4 lần', 'Không đổi'], answer: 1, wrong: ['Nhầm F tỉ lệ với ω. F = mω²r tỉ lệ với ω², nên gấp 2² = 4 lần.', '', 'Quay nhanh hơn thì dây phải kéo mạnh hơn; xem F_ht trên bảng.'], hints: ['F = m·ω²·r = 0,5·64·1.'], explain: 'F = 32 N, gấp 4 lần 8 N.'},
      {type: 'predict', title: 'Đoán trước: dây đứt khi nào', text: `Đặt r = 1,5 m (m = 0,5 kg). Dây chịu được tối đa ${FMAX} N. Tốc độ góc lớn nhất để dây không đứt là bao nhiêu? (ω = √(F/(m·r)))`, unit: 'rad/s', setup: () => act.set({m: 0.5, r: 1.5, w: 4}), hints: ['ω² = 40/(0,5·1,5) ≈ 53,3.'], answer: (c) => Math.sqrt(FMAX / (c.s.m * c.s.r)), tol: 0.1, explain: 'ω tối đa ≈ 7,30 rad/s. Vượt quá mức này lực hướng tâm cần thiết lớn hơn 40 N và dây đứt.'},
      {type: 'do', title: 'Làm đứt dây', text: 'Kéo ω lên cao hơn 7,3 rad/s để làm đứt dây. Quan sát đường đi của bi.', hints: ['Kéo thanh ω sang phải quá 7,3.'], check: (c) => c.r.broken, explain: 'Dây đứt, bi bay đi thẳng theo hướng của vận tốc tại thời điểm đứt: phương tiếp tuyến.'},
      {type: 'choice', title: 'Bi bay theo hướng nào?', text: 'Sau khi dây đứt (không còn lực nào kéo bi vào tâm), bi chuyển động như thế nào?', options: ['Bay ra xa tâm theo bán kính', 'Tiếp tục bay vòng tròn', 'Bay thẳng đều theo phương tiếp tuyến'], answer: 2, wrong: ['Nhiều người nghĩ có “lực ly tâm” văng bi ra. Thực ra không có lực nào đẩy bi ra xa tâm.', 'Muốn đi vòng tròn thì phải có lực hướng tâm, mà dây đã đứt.', ''], hints: ['Định luật 1 Newton: không có lực thì vật giữ nguyên vận tốc.'], explain: 'Không còn lực hướng tâm, bi chuyển động thẳng đều theo vận tốc ngay lúc đứt. Đây là định luật 1 Newton.'},
      {type: 'do', title: 'Cắt dây bằng tay', text: 'Đặt lại m = 0,5 kg, r = 1 m, ω = 4 rad/s rồi bấm “✂ Cắt dây” để tự kiểm chứng.', hints: ['Bấm thí nghiệm mẫu 1, rồi nút đỏ “Cắt dây” (phím C).'], setup: () => act.set({m: 0.5, r: 1, w: 4}), check: (c) => c.r.cut && !c.r.broken && is(c, 0.5, 1, 4), explain: 'Bi bay thẳng theo tiếp tuyến với tốc độ v = 4 m/s, không đổi.'},
      {type: 'do', title: 'Bóc tách bàn quay', text: 'Bấm TEARDOWN (phím T): xem động cơ, cảm biến lực và mâm quay.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Cảm biến lực ở tâm đo lực căng của dây (lực hướng tâm); động cơ dưới bàn quay mâm với tốc độ góc ω không đổi.'},
    ],
    quiz: [
      {q: 'Vật quay đều với ω = 5 rad/s trên đường tròn bán kính 2 m. Tốc độ dài là:', options: ['2,5 m/s', '7 m/s', '10 m/s', '25 m/s'], answer: 2, explain: 'v = ω·r = 5·2 = 10 m/s.'},
      {q: 'Chu kì của chuyển động tròn đều với ω = π rad/s là:', options: ['0,5 s', '1 s', '2 s', '2π s'], answer: 2, explain: 'T = 2π/ω = 2π/π = 2 s.'},
      {q: 'Trong chuyển động tròn đều, gia tốc của vật:', options: ['Bằng 0 vì tốc độ không đổi', 'Hướng theo vận tốc', 'Hướng vào tâm quỹ đạo', 'Hướng ra xa tâm'], answer: 2, explain: 'Vận tốc đổi hướng liên tục nên có gia tốc hướng tâm a = v²/r.'},
      {q: 'Bi 0,2 kg quay đều với v = 3 m/s trên đường tròn bán kính 0,9 m. Lực hướng tâm là:', options: ['0,6 N', '1 N', '2 N', '6 N'], answer: 2, explain: 'F = m·v²/r = 0,2·9/0,9 = 2 N.'},
      {q: 'Dây đang giữ vật chuyển động tròn thì đứt. Vật sẽ:', options: ['Bay ra theo bán kính', 'Bay thẳng theo tiếp tuyến', 'Rơi thẳng xuống', 'Dừng lại ngay'], answer: 1, explain: 'Không còn lực hướng tâm nên vật chuyển động thẳng đều theo vận tốc tại lúc đứt (tiếp tuyến).'},
    ],
    summary: [
      'v = ω·r; T = 2π/ω; f = 1/T.',
      'Gia tốc hướng tâm a = v²/r = ω²r, hướng vào tâm.',
      'Lực hướng tâm F = m·ω²·r = m·v²/r (ở đây là lực căng của dây). Không có “lực ly tâm” kéo vật ra ngoài.',
      'Dây đứt hoặc bị cắt: vật bay thẳng đều theo phương tiếp tuyến.',
    ],
  };
}

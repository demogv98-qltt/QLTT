// Nội dung bài học W6 (Vật lí 11 KNTT, chương 2 Sóng — Thực hành đo tốc độ truyền âm bằng ống cộng hưởng). ctx = {s, r, td, view}.
// act = {set(o) (đặt thông số, xoá bảng), keep(o), clear()}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const trials = (c) => c.s.trials.length;
  return {
    code: 'vl11-w6',
    title: 'Thực hành đo tốc độ truyền âm bằng ống cộng hưởng',
    objectives: [
      'Giải thích sự cộng hưởng âm trong cột khí: âm to nhất khi mực nước là nút, miệng ống là bụng của sóng dừng.',
      'Xác định hai vị trí cộng hưởng liên tiếp l₁ và l₂, biết l₂ − l₁ = λ/2.',
      'Tính tốc độ truyền âm v = 2f(l₂ − l₁) và biết vì sao dùng hiệu l₂ − l₁ (loại bỏ độ hiệu chỉnh đầu ống).',
      'Xử lí số liệu nhiều lần đo: giá trị trung bình, sai số; nhận biết v tăng theo nhiệt độ.',
    ],
    steps: [
      {type: 'do', title: 'Chọn âm thoa 512 Hz', text: 'Nhiệt độ 20 °C. Bấm âm thoa 512 Hz ở đầu bảng bên phải. Loa phát âm đơn tần f = 512 Hz.', hints: ['Nút “512”.'], setup: () => act.set({f: 256, T: 20, l: 0.3}), check: (c) => c.s.f === 512 && c.s.T === 20, explain: 'Âm thoa cho tần số biết chính xác nên chỉ cần đo chiều dài sóng.'},
      {type: 'predict', title: 'Tính bước sóng dự kiến', text: 'Tốc độ âm trong không khí ở 20 °C xấp xỉ v = 331 + 0,6·t. Tính bước sóng λ = v/f.', unit: 'cm', hints: ['v = 343 m/s; λ = 343/512 m.'], answer: (c) => c.r.lam * 100, tol: 1, explain: 'λ ≈ 67 cm. Vì cột khí tối đa 100 cm nên ta sẽ gặp 3 vị trí cộng hưởng (cách nhau λ/2 ≈ 33,5 cm).'},
      {type: 'do', title: 'Tìm cộng hưởng đầu tiên', text: 'Kéo thanh l (nâng/hạ bình nước) từ từ từ 0 trở lên và nghe âm: dừng khi âm to nhất lần đầu. Chú ý mức “Âm to” và đường cong ở bảng bên trái.', hints: ['Cộng hưởng đầu tiên ở khoảng 15–16 cm.', 'Nhìn thanh độ to: đầy gần 100% là cộng hưởng.'], check: (c) => c.r.onRes && c.r.n === 1, explain: 'Âm to nhất: cột khí cộng hưởng với loa. Mực nước là nút sóng, miệng ống gần như là bụng.'},
      {type: 'choice', title: 'Vị trí nút, bụng', text: 'Khi cộng hưởng, ở mực nước (đáy cột khí) và ở miệng ống có:', options: ['Nút sóng ở mực nước, bụng sóng ở miệng ống', 'Bụng sóng ở mực nước, nút sóng ở miệng ống', 'Nút sóng ở cả hai đầu'], answer: 0, wrong: ['', 'Nước giữ cho các phân tử khí sát mặt nước đứng yên (nút); miệng ống để thoáng nên dao động mạnh nhất (bụng).', 'Miệng ống hở không phải nút. Hạt khí ở đó dao động tự do nhất.'], hints: ['Xem các hạt khí trong ống: hạt nào gần như đứng yên?'], explain: 'Đầu kín (mặt nước) là nút, đầu hở (miệng ống) là bụng: l ≈ λ/4 ở cộng hưởng thứ nhất.'},
      {type: 'do', title: 'Ghi l₁', text: 'Giữ ở vị trí âm to nhất và bấm “＋ Ghi l₁”.', hints: ['Nút ở bảng bên phải.'], check: (c) => c.r.cur.l1 != null && near(c.r.cur.l1, 15.5, 1.5), explain: 'l₁ ≈ 15,5 cm. Lưu ý l₁ + e = λ/4 = 16,7 cm, nên l₁ nhỏ hơn λ/4 một chút (e ≈ 1,2 cm là độ hiệu chỉnh đầu ống).'},
      {type: 'do', title: 'Tìm cộng hưởng thứ hai', text: 'Tiếp tục hạ bình nước (tăng l) tới khi âm to nhất lần thứ hai rồi bấm “＋ Ghi l₂”.', hints: ['Khoảng 49 cm.'], check: (c) => trials(c) >= 1, explain: 'Số liệu lần 1 đã vào bảng cùng v tính được.'},
      {type: 'predict', title: 'Hiệu hai vị trí', text: 'Tính l₂ − l₁ từ bảng số liệu (cm). Nó bằng bao nhiêu phần của bước sóng?', unit: 'cm', hints: ['Lấy l₂ trừ l₁.'], answer: (c) => c.s.trials[0].l2 - c.s.trials[0].l1, tol: 0.5, explain: 'l₂ − l₁ ≈ 33,5 cm = λ/2.'},
      {type: 'predict', title: 'Tốc độ âm', text: 'Tính v = 2f(l₂ − l₁) từ số liệu (m/s). Đối chiếu với cột v trong bảng.', unit: 'm/s', hints: ['v = 2·512·0,335.'], answer: (c) => 2 * c.s.trials[0].f * ((c.s.trials[0].l2 - c.s.trials[0].l1) / 100), tol: 3, explain: 'v ≈ 343 m/s, đúng với giá trị lí thuyết ở 20 °C.'},
      {type: 'choice', title: 'Vì sao dùng hiệu?', text: 'Vì sao nên tính v từ l₂ − l₁ chứ không từ l₁ (v = 4f·l₁)?', options: ['Vì hiệu l₂ − l₁ = λ/2 không phụ thuộc độ hiệu chỉnh đầu ống e', 'Vì l₁ khó đo hơn l₂', 'Vì l₂ lớn hơn nên sai số tương đối nhỏ'], answer: 0, wrong: ['', 'Hai vị trí đều đo như nhau; vấn đề là l₁ + e mới bằng λ/4, còn ta chỉ đo được l₁.', 'Có thể đúng một phần, nhưng lí do chính là loại bỏ e.'], hints: ['l₁ + e = λ/4 và l₂ + e = 3λ/4.'], explain: 'Trừ hai vế: l₂ − l₁ = λ/2, e bị khử. Đó là mẹo của phép đo.'},
      {type: 'do', title: 'Lần đo thứ hai với tần số khác', text: 'Chọn âm thoa 384 Hz; tìm và ghi l₁, l₂ (hai cực đại ở khoảng 21 cm và 66 cm).', hints: ['Nút “384”, rồi lặp lại: tìm cực đại, ghi l₁; tìm cực đại sau, ghi l₂.'], setup: () => act.keep({f: 384, l: 0.3}), check: (c) => c.s.f === 384 && trials(c) >= 2, explain: 'Hai lần đo ở hai tần số khác nhau cho phép tính giá trị trung bình.'},
      {type: 'predict', title: 'Giá trị trung bình', text: 'Đọc v̄ ở dòng cuối của bảng (m/s) rồi nhập vào đây.', unit: 'm/s', hints: ['Dòng “v̄ = … ± …” dưới bảng.'], answer: (c) => c.r.st.vm, tol: 1, explain: 'v̄ trong khoảng sai số của giá trị thật 343 m/s. Sai số δv/v ≈ 3% chủ yếu do khó xác định chính xác chỗ âm to nhất (Δl ≈ 0,5 cm).'},
      {type: 'choice', title: 'Độ chính xác', text: 'Cách nào làm giảm sai số tỉ đối của v?', options: ['Đo nhiều lần ở nhiều tần số rồi lấy trung bình', 'Chọn tần số thấp nhất có thể', 'Chỉ đo một lần nhưng cẩn thận'], answer: 0, wrong: ['', 'Tần số thấp làm λ lớn, nhưng không giảm sai số do định vị cực đại.', 'Đo một lần không cho biết độ phân tán của kết quả.'], hints: ['Nhớ lại bài sai số ở lớp 10: nhiều lần đo, lấy trung bình.'], explain: 'Lấy trung bình nhiều lần đo giảm sai số ngẫu nhiên.'},
      {type: 'do', title: 'Nóng hơn thì sao?', text: 'Đặt nhiệt độ 35 °C bằng thanh trượt t (âm thoa 384 Hz). Quan sát vị trí các cực đại trên đồ thị.', hints: ['Thanh “t nhiệt độ không khí”.'], check: (c) => near(c.s.T, 35, 0.6), explain: 'v lớn hơn nên λ dài hơn, các cực đại dịch xuống phía dưới.'},
      {type: 'predict', title: 'Tốc độ âm ở 35 °C', text: 'Tính v = 331 + 0,6·t với t = 35 °C.', unit: 'm/s', hints: ['331 + 21.'], answer: (c) => 331 + 0.6 * c.s.T, tol: 0.5, explain: 'v = 352 m/s: không khí nóng hơn làm âm truyền nhanh hơn.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): xem ống, loa, ống dẫn nước.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Ống dẫn nối bình với ống làm hai mực nước luôn ngang nhau (bình thông nhau). Nâng bình lên thì mực nước trong ống dâng lên và cột khí ngắn đi.'},
    ],
    quiz: [
      {q: 'Âm thoa 440 Hz, hai cực đại liên tiếp cách nhau 39 cm. Tốc độ âm là:', options: ['171,6 m/s', '343,2 m/s', '171 m/s', '686 m/s'], answer: 1, explain: 'v = 2f(l₂ − l₁) = 2·440·0,39 = 343,2 m/s.'},
      {q: 'Hai vị trí cộng hưởng liên tiếp trong ống cách nhau:', options: ['λ/4', 'λ/2', 'λ', '2λ'], answer: 1, explain: 'l₂ − l₁ = λ/2.'},
      {q: 'Ở đầu hở của ống cột khí (miệng ống) khi cộng hưởng là:', options: ['Nút sóng', 'Bụng sóng', 'Không dao động', 'Điểm có áp suất cực đại'], answer: 1, explain: 'Đầu hở là bụng dao động của phần tử khí; mặt nước là nút.'},
      {q: 'Khi nhiệt độ không khí tăng thì tốc độ truyền âm:', options: ['Tăng', 'Giảm', 'Không đổi', 'Bằng 0'], answer: 0, explain: 'v ≈ 331 + 0,6t tăng theo t.'},
      {q: 'Vì sao thí nghiệm dùng hiệu l₂ − l₁?', options: ['Để khử độ hiệu chỉnh đầu ống', 'Để đo f', 'Vì loa chỉ có hai cực đại', 'Để tăng biên độ'], answer: 0, explain: 'l₁ + e = λ/4 và l₂ + e = 3λ/4; hiệu hai vế là λ/2.'},
    ],
    summary: [
      'Cột khí cộng hưởng khi l + e = (2n − 1)λ/4: mặt nước là nút, miệng ống là bụng sóng dừng.',
      'Hai vị trí cộng hưởng liên tiếp cách nhau λ/2; v = λf = 2f(l₂ − l₁), e bị khử.',
      'Đo nhiều lần, lấy trung bình và ghi kết quả v̄ ± Δv. Tốc độ âm trong không khí tăng theo nhiệt độ: v ≈ 331 + 0,6t.',
    ],
  };
}

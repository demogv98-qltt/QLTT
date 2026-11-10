// Nội dung bài học B4: thực hành đo cảm ứng từ B bằng cân dòng điện (Vật lí 12 KNTT; ◻ thầy đối chiếu tên/số bài).
// ctx = {s: mô hình, r: readout, td}. act = {set({mag, N, I, clear, tareReset})}.

export function makeLesson(act) {
  const ok = (c) => c.r.settled;
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl12-b4',
    title: 'Thực hành: đo cảm ứng từ B bằng cân dòng điện',
    objectives: [
      'Hiểu nguyên lí: lực từ lên đoạn dây F = N·B·I·l; phản lực lên nam châm làm số chỉ cân thay đổi Δm = F/g.',
      'Thực hiện phép đo: đặt cân về 0 (tare), đo Δm với nhiều giá trị I, vẽ đồ thị F theo I, tìm hệ số góc k = N·B·l.',
      'Tính B = k/(N·l) và đánh giá sai số (độ lệch của điểm đo, sai số của l, độ phân giải của cân).',
      'Biết các nguồn sai số hệ thống và cách giảm sai số bằng đo lặp và đồ thị.',
    ],
    steps: [
      {type: 'do', title: 'Đặt cân về 0', text: 'Nam châm A, khung dây N = 3 vòng, I = 0. Cân đang chỉ 0,00 g sau khi bì nam châm. Bấm “⊘ Tare” để đặt cân về 0 khi chưa có dòng điện.', hints: ['Nút Tare ở bảng điều khiển.'], setup: () => act.set({mag: 0, N: 3, I: 0, clear: true}), check: (c) => c.s.tared && near(c.r.Icmd, 0, 0.01) && Math.abs(c.r.disp) < 0.015, explain: 'Tare trừ khối lượng nam châm (≈215 g) để chỉ còn đọc thay đổi Δm do lực từ.'},
      {type: 'do', title: 'Cho dòng điện I = 1,0 A', text: 'Kéo I tới 1,0 A và chờ số chỉ ổn định (nhiễu nhỏ ở chữ số cuối là bình thường).', hints: ['Thanh trượt I; đặt 1,00.'], check: (c) => near(c.r.Icmd, 1, 0.03) && ok(c), explain: 'Cân tăng khoảng 1 g: lực từ lên dây hướng lên nên phản lực lên nam châm hướng xuống.'},
      {type: 'predict', title: 'Từ số chỉ cân suy ra lực', text: 'Số chỉ cân tăng Δm ≈ 1,0 g. Lực từ lên dây là F = Δm·g (g = 9,8 m/s²). Tính F (mN).', unit: 'mN', hints: ['1 g = 0,001 kg; F = 0,001·9,8 N = 9,8 mN.'], answer: () => 9.8, tol: 0.7, explain: 'F ≈ 9,8 mN (Δm ≈ 1,0 g). Số chỉ có nhiễu cỡ 0,01 g tương ứng 0,1 mN.'},
      {type: 'do', title: 'Thu thập số liệu', text: 'Đặt I = 0,5; 1,0; 1,5; 2,0; 2,5 A (mỗi lần chờ ổn định) và bấm “＋ Ghi số liệu”. Nút Ghi chỉ nhận khi cân đã ổn định.', hints: ['Mỗi lần: chỉnh I → chờ → Ghi.'], check: (c) => new Set(c.s.rows.filter((q) => q.I > 0.3).map((q) => Math.round(q.I * 2))).size >= 5, explain: 'Đồ thị F theo I có 5 điểm nằm trên một đường thẳng đi qua gốc (trong phạm vi sai số).'},
      {type: 'predict', title: 'Hệ số góc của đồ thị', text: 'Đường hồi quy (xanh) có hệ số góc k = F/I (mN/A). Đọc giá trị k trong khung bên trái.', unit: 'mN/A', hints: ['Đọc “Hệ số góc” ở hộp kết quả.'], answer: (c) => (c.r.reg ? c.r.reg.slope : 9.8), tol: 0.4, explain: 'k ≈ 9,7–9,8 mN/A với sai số tiêu chuẩn cỡ 0,03–0,04 mN/A.'},
      {type: 'predict', title: 'Tính cảm ứng từ B', text: 'Từ k = N·B·l, với N = 3 vòng, l = 4,0 cm = 0,040 m: B = k/(N·l). Tính B (mT).', unit: 'mT', hints: ['B = 9,8·10⁻³ N/A ÷ (3·0,040 m).'], answer: (c) => (c.r.reg ? c.r.reg.Bexp * 1e3 : 81.7), tol: 2, explain: 'B ≈ 81 mT. Sai số tương đối δB/B cỡ 1,3 % (độ lệch của các điểm đo và việc l chỉ đo được ±0,5 mm); sai số này là sai số ngẫu nhiên/dụng cụ, chưa gồm sai số hệ thống.'},
      {type: 'choice', title: 'Nguồn sai số', text: 'Nguồn nào sau đây có thể làm kết quả B lệch hệ thống (không giảm khi đo lặp)?', options: ['Nhiễu ngẫu nhiên của cân (±0,005 g)', 'Từ trường không đều, đoạn dây ngoài vùng từ trường làm chiều dài hiệu dụng khác l = 4,0 cm', 'Chọn I khác nhau ở mỗi lần đo'], answer: 1, wrong: ['Nhiễu ngẫu nhiên là sai số ngẫu nhiên: lấy nhiều điểm, đồ thị và trung bình sẽ giảm nó.', '', 'Thay đổi I là cần thiết để vẽ đồ thị; không gây sai số hệ thống.'], hints: ['Sai số hệ thống không biến mất khi đo lặp.'], explain: 'Sai số hệ thống (chiều dài hiệu dụng l, từ trường rìa, hiệu chuẩn cân) ảnh hưởng mọi điểm như nhau. Nhiễu ngẫu nhiên giảm khi dùng nhiều điểm và hồi quy.'},
      {type: 'do', title: 'Kiểm tra với B “thật”', text: 'Bấm “Kiểm tra: hiện B thật của nam châm” và so với kết quả đo.', hints: ['Nút ở bảng điều khiển.'], check: (c) => c.s.reveal, explain: 'B thật = 82 mT; B đo ≈ 81 mT thấp hơn khoảng 1 %: đây là dấu hiệu của SAI SỐ HỆ THỐNG (trong mô phỏng, chiều dài hiệu dụng của đoạn dây trong từ trường nhỏ hơn l = 4,0 cm một chút do từ trường rìa). Đo lặp không loại bỏ được sai số này. Trong thí nghiệm thật ta không biết B thật.'},
      {type: 'choice', title: 'Đổi chiều dòng điện', text: 'Kéo I về giá trị âm (đảo chiều). Số chỉ cân Δm sẽ:', options: ['Giảm xuống (âm)', 'Vẫn tăng', 'Không đổi'], answer: 0, wrong: ['', 'Đổi chiều I đổi chiều lực từ lên dây, nên phản lực lên nam châm hướng lên.', 'Lực từ đổi chiều khi đổi chiều dòng điện.'], hints: ['F⃗ = I·l⃗×B⃗.'], explain: 'Lực từ lên dây hướng xuống, phản lực lên nam châm hướng lên: cân giảm.'},
      {type: 'choice', title: 'Tăng số vòng dây', text: 'Tăng N từ 3 lên 5 (giữ nguyên nam châm). Hệ số góc k của đồ thị F–I sẽ:', options: ['Tăng 5/3 lần', 'Không đổi', 'Giảm'], answer: 0, wrong: ['', 'k = N·B·l phụ thuộc N.', 'Nhiều vòng dây cho lực lớn hơn.'], hints: ['k = N·B·l.'], explain: 'k tăng tỉ lệ với N (5/3 lần). Dùng nhiều vòng dây làm tín hiệu lớn hơn nhiễu nên giảm sai số tương đối.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): nam châm chữ U, khung dây và giá đỡ.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Đoạn dây ngang dài l = 4,0 cm nằm trọn trong khe giữa hai cực (từ trường đều, vuông góc dây). Hai cạnh đứng của khung có dòng ngược chiều nhau nên lực từ (theo phương nằm ngang) triệt tiêu và không làm đổi số chỉ cân. Dòng điện vào từ cực + (dây đỏ) ở phía xa người xem, đi xuống, qua đoạn ngang theo chiều +z (về phía người xem) rồi đi lên về cực −. Các vòng dây nối tiếp nhau ở mép trên.'},
    ],
    quiz: [
      {q: 'Số chỉ cân tăng thêm Δm = 2,50 g khi cho dòng điện qua khung dây. Lực từ lên dây là (g = 9,8 m/s²):', options: ['2,45 mN', '24,5 mN', '0,245 N', '2,5 N'], answer: 1, explain: 'F = Δm·g = 2,5·10⁻³·9,8 = 24,5 mN.'},
      {q: 'Khung dây 5 vòng, đoạn dây ngang dài l = 4 cm trong từ trường vuông góc, I = 2 A, F = 16 mN. Cảm ứng từ B là:', options: ['0,02 T', '0,04 T', '0,08 T', '0,16 T'], answer: 1, explain: 'B = F/(N·I·l) = 0,016/(5·2·0,04) = 0,04 T.'},
      {q: 'Đồ thị F theo I là đường thẳng qua gốc; hệ số góc bằng:', options: ['B', 'N·B·l', 'B·l/N', 'g'], answer: 1, explain: 'F = (N·B·l)·I.'},
      {q: 'Để giảm sai số ngẫu nhiên khi đo B, nên:', options: ['Chỉ đo một lần với I lớn nhất', 'Đo nhiều giá trị I và dùng hồi quy tuyến tính', 'Giảm số vòng dây', 'Bỏ qua việc tare'], answer: 1, explain: 'Nhiều điểm và hồi quy làm trung bình nhiễu; tare loại khối lượng nam châm; tăng N tăng tín hiệu.'},
      {q: 'Khi đổi chiều dòng điện trong khung, số chỉ cân:', options: ['Tăng thêm', 'Giảm xuống (Δm âm)', 'Không đổi', 'Bằng 0'], answer: 1, explain: 'Lực từ đổi chiều nên phản lực lên nam châm đổi chiều.'},
    ],
    summary: [
      'Cân dòng điện: Δm·g = N·B·I·l; hệ số góc của đồ thị F–I là k = N·B·l, từ đó B = k/(N·l).',
      'Tare trước khi đo; đo nhiều giá trị I; dùng hồi quy tuyến tính và nêu sai số (σ của hệ số góc, sai số của l).',
      'Sai số ngẫu nhiên giảm khi tăng số điểm đo; sai số hệ thống (chiều dài hiệu dụng, từ trường không đều) phải đánh giá riêng.',
      'Đổi chiều I thì lực từ và số chỉ cân đổi chiều.',
    ],
  };
}

// Nội dung bài học W2 (Vật lí 11 KNTT, chương 2 Sóng — Sóng ngang, sóng dọc, cường độ sóng). ctx = {s, r, td, view}.
// act = {set(o) (chạy lại từ đầu), keep(o)}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl11-w2',
    title: 'Sóng ngang, sóng dọc và cường độ sóng',
    objectives: [
      'Phân biệt sóng ngang và sóng dọc dựa vào phương dao động của phần tử so với phương truyền sóng.',
      'Nhận ra vùng nén, vùng dãn của sóng dọc; bước sóng của sóng dọc là khoảng cách hai vùng nén liên tiếp.',
      'Hiểu sóng truyền năng lượng chứ không truyền các phần tử; vận dụng v = λf cho cả hai loại sóng.',
      'Tính cường độ sóng I = P/S, với nguồn điểm I = P/(4πr²), và hiểu vì sao I giảm khi r tăng.',
    ],
    steps: [
      {type: 'do', title: 'Tạo sóng ngang', text: 'Tay kéo ở đầu lò xo đưa sang trái – phải (vuông góc với lò xo). Chờ sóng lan tới đệm hấp thụ ở cuối lò xo (khoảng 2,3 giây).', hints: ['Nếu sóng chưa chạy, bấm “↺ Lại”.'], setup: () => act.set({mode: 'T', A: 0.06, f: 1, v: 2, xP: 1.5}), check: (c) => c.s.mode === 'T' && c.r.front >= 4.5, explain: 'Sóng lan dọc theo lò xo nhưng các vòng chỉ dịch sang hai bên.'},
      {type: 'choice', title: 'Phương dao động', text: 'Nhìn vòng màu cam (vòng đang xét): nó dao động theo phương nào so với phương truyền sóng dọc theo lò xo?', options: ['Vuông góc với phương truyền sóng', 'Cùng phương với phương truyền sóng', 'Nó chạy theo sóng'], answer: 0, wrong: ['', 'Cùng phương là của sóng dọc (em sẽ thấy sau).', 'Không: vòng chỉ dịch sang hai bên quanh vị trí cân bằng, không chạy theo sóng.'], hints: ['Xem đồ thị “MỘT VÒNG”: li độ đổi dấu quanh 0.'], explain: 'Sóng có phương dao động vuông góc với phương truyền là sóng ngang.'},
      {type: 'do', title: 'Chuyển sang sóng dọc', text: 'Bấm nút “Sóng dọc”: tay kéo bây giờ đẩy – kéo dọc theo lò xo. Chờ sóng tới cuối lò xo.', hints: ['Nút “Sóng dọc” đầu bảng bên phải.'], check: (c) => c.s.mode === 'L' && c.r.front >= 4.5, explain: 'Các vòng khi thì sát nhau (vùng nén), khi thì thưa (vùng dãn).'},
      {type: 'choice', title: 'Sóng dọc', text: 'Trong sóng dọc, các vòng dao động theo phương:', options: ['Trùng với phương truyền sóng', 'Vuông góc với phương truyền sóng', 'Theo đường tròn'], answer: 0, wrong: ['', 'Đó là sóng ngang.', 'Các vòng chỉ tiến – lùi dọc theo lò xo.'], hints: ['Nhìn tay kéo: nó đẩy tới và kéo lui dọc lò xo.'], explain: 'Sóng dọc: phương dao động trùng với phương truyền sóng. Âm thanh trong không khí là sóng dọc.'},
      {type: 'do', title: 'Dừng hình để đếm vùng nén', text: 'Bấm “❚❚ Dừng hình”. Vùng nén tô đỏ trên đồ thị, vùng dãn tô xanh.', hints: ['Nút ở bảng bên phải (hoặc phím cách).'], check: (c) => c.s.frozen, explain: 'Hai vùng nén liên tiếp cách nhau đúng một bước sóng.'},
      {type: 'predict', title: 'Bước sóng', text: 'Đo khoảng cách giữa hai vùng nén liên tiếp (nhãn xanh lục trên lò xo và đồ thị). Đó là bước sóng λ.', unit: 'm', hints: ['λ = v/f = 2/1.'], answer: (c) => c.r.lam, tol: 0.1, explain: 'λ = 2 m. Khác với sóng ngang, ở sóng dọc người ta đo λ giữa hai tâm vùng nén (hoặc hai tâm vùng dãn).'},
      {type: 'do', title: 'Tăng tần số', text: 'Bấm “Chạy tiếp”, rồi kéo f lên 1,5 Hz (v = 2 m/s).', hints: ['Nút chạy tiếp và thanh f.'], check: (c) => !c.s.frozen && near(c.s.f, 1.5, 0.06), explain: 'Tay kéo nhanh hơn nên các vùng nén sát nhau hơn.'},
      {type: 'predict', title: 'Bước sóng mới', text: 'Với f = 1,5 Hz và v = 2 m/s, tính λ = v/f.', unit: 'm', hints: ['2/1,5.'], answer: (c) => c.s.v / c.s.f, tol: 0.03, explain: 'λ ≈ 1,33 m: giống như sóng ngang, v = λf.'},
      {type: 'do', title: 'Chọn vòng khảo sát', text: 'Dùng thanh “Vòng khảo sát · vị trí x” đặt vòng cam ở x = 2,25 m. Nhìn đồ thị “MỘT VÒNG”.', hints: ['Thanh x thứ tư, bước 0,075 m.'], check: (c) => near(c.r.xP, 2.25, 0.04), explain: 'Vòng này chỉ dao động tiến – lùi quanh một vị trí cố định, không bị cuốn theo sóng.'},
      {type: 'choice', title: 'Sóng truyền cái gì?', text: 'Sóng truyền trên lò xo mang đi:', options: ['Năng lượng và dạng dao động, không mang theo các vòng', 'Các vòng của lò xo từ đầu này sang đầu kia', 'Khối lượng của lò xo'], answer: 0, wrong: ['', 'Các vòng chỉ dao động tại chỗ, không chạy sang đầu kia.', 'Khối lượng lò xo không bị dịch chuyển đi.'], hints: ['Nhớ lại vòng cam chỉ dao động quanh vị trí cân bằng.'], explain: 'Sóng truyền năng lượng (tay kéo làm việc, đệm hấp thụ năng lượng) nhưng không truyền chất.'},
      {type: 'do', title: 'Cường độ sóng', text: 'Bấm nút “Cường độ”: nguồn âm điểm (loa) công suất 0,5 W phát sóng đều ra mọi phía; hai máy đo đặt cách loa r và 2r.', hints: ['Nút “Cường độ” hoặc thí nghiệm mẫu 3.'], setup: () => act.set({mode: 'T'}), check: (c) => c.s.mode === 'I', explain: 'Năng lượng của loa lan ra các mặt cầu ngày càng rộng.'},
      {type: 'do', title: 'Đặt thông số', text: 'Đặt P = 0,5 W và r₁ = 1 m bằng hai thanh trượt.', hints: ['Thanh P và thanh r₁.'], setup: () => act.keep({P: 1, r: 1.8}), check: (c) => c.s.mode === 'I' && near(c.s.P, 0.5, 0.03) && near(c.s.r, 1, 0.03), explain: 'Máy đo 1 cách loa 1 m, máy đo 2 cách loa 2 m.'},
      {type: 'predict', title: 'Diện tích mặt cầu', text: 'Mặt cầu bán kính r có diện tích S = 4πr². Tính S₁ với r₁ = 1 m.', unit: 'm²', hints: ['4π·1² ≈ 12,57.'], answer: (c) => c.r.S1, tol: 0.1, explain: 'S₁ ≈ 12,57 m².'},
      {type: 'predict', title: 'Cường độ tại máy đo 1', text: 'Cường độ sóng I = P/S. Tính I₁ theo mW/m² (1 W = 1000 mW).', unit: 'mW/m²', hints: ['0,5/12,57 W/m² = 0,0398 W/m².'], answer: (c) => c.r.I1 * 1000, tol: 0.5, explain: 'I₁ ≈ 39,8 mW/m².'},
      {type: 'predict', title: 'Cường độ tại máy đo 2', text: 'Máy đo 2 cách loa r₂ = 2 m. Tính I₂ theo mW/m².', unit: 'mW/m²', hints: ['S₂ = 4π·2² = 50,27 m²; I₂ = 0,5/50,27.'], answer: (c) => c.r.I2 * 1000, tol: 0.3, explain: 'I₂ ≈ 9,95 mW/m².'},
      {type: 'choice', title: 'r gấp đôi', text: 'Khoảng cách tới nguồn gấp đôi thì cường độ sóng của nguồn điểm:', options: ['Giảm 4 lần', 'Giảm 2 lần', 'Không đổi'], answer: 0, wrong: ['', 'I tỉ lệ nghịch với r², không phải r.', 'Cùng một công suất phải trải ra diện tích lớn hơn, nên I phải nhỏ hơn.'], hints: ['So I₁/I₂ ở bảng bên trái.'], explain: 'I = P/(4πr²): r gấp đôi thì S gấp 4 nên I giảm 4 lần.'},
      {type: 'choice', title: 'Công suất qua mặt cầu', text: 'Công suất sóng truyền qua toàn bộ mặt cầu bán kính 1 m so với mặt cầu bán kính 2 m:', options: ['Bằng nhau (đều bằng P)', 'Mặt cầu nhỏ lớn hơn', 'Mặt cầu lớn lớn hơn'], answer: 0, wrong: ['', 'Năng lượng không mất đi, nên cả hai mặt cầu nhận cùng một công suất.', 'Mặt cầu lớn có diện tích lớn hơn nhưng cường độ nhỏ hơn đúng tỉ lệ.'], hints: ['I·S = P ở cả hai mặt cầu, xem dòng cuối ở bảng bên trái.'], explain: 'Bỏ qua hấp thụ: I·S = P không đổi. Cường độ giảm vì cùng năng lượng trải ra diện tích lớn hơn.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T).', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Loa có màng rung tạo sóng âm; tay kéo của lò xo gắn trên thanh trượt dẫn hướng; đệm xốp hấp thụ năng lượng sóng để không có sóng phản xạ.'},
    ],
    quiz: [
      {q: 'Sóng trên mặt nước khi lá cây dập dềnh lên xuống tại chỗ là:', options: ['Sóng ngang (xấp xỉ), phần tử dao động vuông góc phương truyền', 'Sóng dọc hoàn toàn', 'Không phải sóng', 'Sóng điện từ'], answer: 0, explain: 'Các phần tử nước dao động lên – xuống, vuông góc với phương lan truyền của sóng.'},
      {q: 'Sóng âm truyền trong không khí là:', options: ['Sóng dọc', 'Sóng ngang', 'Sóng điện từ', 'Vừa ngang vừa dọc'], answer: 0, explain: 'Âm thanh trong chất khí là sóng dọc (vùng nén và vùng dãn của không khí).'},
      {q: 'Sóng dọc có f = 2 Hz và v = 3 m/s. Khoảng cách hai vùng nén liên tiếp là:', options: ['0,67 m', '1,5 m', '6 m', '1 m'], answer: 1, explain: 'λ = v/f = 3/2 = 1,5 m.'},
      {q: 'Một nguồn điểm công suất 2 W. Cường độ sóng tại điểm cách nguồn 2 m (bỏ qua hấp thụ) xấp xỉ:', options: ['0,04 W/m²', '0,16 W/m²', '0,08 W/m²', '0,32 W/m²'], answer: 0, explain: 'I = P/(4πr²) = 2/(4π·4) ≈ 0,0398 W/m².'},
      {q: 'Khi khoảng cách tới nguồn điểm tăng gấp 3 lần thì cường độ sóng:', options: ['Giảm 3 lần', 'Giảm 9 lần', 'Giảm 6 lần', 'Không đổi'], answer: 1, explain: 'I ∝ 1/r² nên giảm 3² = 9 lần.'},
    ],
    summary: [
      'Sóng ngang: phương dao động vuông góc phương truyền. Sóng dọc: phương dao động trùng phương truyền (có vùng nén, vùng dãn).',
      'Sóng chỉ truyền năng lượng và dạng dao động, các phần tử dao động quanh vị trí cân bằng; v = λf cho mọi sóng.',
      'Cường độ sóng I = P/S (W/m²). Nguồn điểm: I = P/(4πr²), giảm theo bình phương khoảng cách.',
    ],
  };
}

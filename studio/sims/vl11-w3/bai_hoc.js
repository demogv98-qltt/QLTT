// Nội dung bài học W3 (Vật lí 11 KNTT, chương 2 Sóng — Sóng điện từ). ctx = {s, r, td, view}.
// act = {set(o), keep(o)}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const reg = (c, id) => c.r.reg.id === id;
  return {
    code: 'vl11-w3',
    title: 'Sóng điện từ: điện trường, từ trường và thang sóng',
    objectives: [
      'Mô tả sóng điện từ: điện trường E và từ trường B dao động cùng pha, vuông góc nhau và vuông góc với phương truyền (sóng ngang).',
      'Nêu được sóng điện từ truyền trong chân không với tốc độ c = 3·10⁸ m/s; vận dụng c = λf.',
      'Kể tên và sắp xếp các vùng của thang sóng điện từ, nêu ứng dụng đặc trưng.',
      'Dùng anten thu quay được để thấy sóng điện từ là sóng ngang (phân cực).',
    ],
    steps: [
      {type: 'do', title: 'Cho sóng chạy', text: 'Anten phát tạo sóng điện từ lan về phía anten thu. Chờ khoảng 3 giây và quan sát các mũi tên đỏ (E) và xanh (B).', hints: ['Nếu hình đang dừng, bấm “Chạy tiếp”.'], setup: () => act.set({e: 8, E0: 3, theta: 0}), check: (c) => c.r.t >= 3 && !c.s.frozen, explain: 'Hai loại mũi tên dao động cùng lúc và đi cùng tốc độ về bên phải: đó là sóng điện từ.'},
      {type: 'choice', title: 'Phương của E và B', text: 'Nhìn kĩ các mũi tên: so với phương truyền sóng (trục ngang), điện trường E (đỏ) và từ trường B (xanh) có phương:', options: ['Đều vuông góc với phương truyền, và vuông góc với nhau', 'Đều trùng với phương truyền', 'E vuông góc, B trùng với phương truyền'], answer: 0, wrong: ['', 'Nếu trùng phương truyền thì đó là sóng dọc. Sóng điện từ là sóng ngang.', 'Cả hai đều vuông góc với phương truyền; E thẳng đứng, B nằm ngang.'], hints: ['E thẳng đứng, B nằm ngang, sóng đi sang phải: ba phương đôi một vuông góc.'], explain: 'E ⟂ B ⟂ phương truyền: sóng điện từ là sóng ngang.'},
      {type: 'choice', title: 'Pha của E và B', text: 'Tại cùng một điểm, E và B dao động:', options: ['Cùng pha: cùng đạt cực đại, cùng bằng 0 một lúc', 'Ngược pha', 'Lệch pha 90°'], answer: 0, wrong: ['', 'Đồ thị ở bảng bên trái cho thấy hai đường đạt đỉnh ở cùng một chỗ.', 'Hai đường cùng lên cùng xuống, nên cùng pha.'], hints: ['Nhìn đồ thị “E và B cùng pha”.'], explain: 'Trong sóng điện từ E và B luôn cùng pha.'},
      {type: 'do', title: 'Chọn sóng FM', text: 'Bấm nguồn sóng “Sóng FM 100 MHz” ở bảng bên phải.', hints: ['Nút đầu tiên trong “Nguồn sóng thường gặp”.'], check: (c) => near(c.r.e, 8, 0.03), explain: 'Đài FM phát ở tần số khoảng 100 MHz.'},
      {type: 'predict', title: 'Bước sóng FM', text: 'Sóng điện từ truyền với tốc độ c = 3·10⁸ m/s. Tính bước sóng λ = c/f ứng với f = 100 MHz = 10⁸ Hz.', unit: 'm', hints: ['3·10⁸/10⁸.'], answer: (c) => c.r.lam, tol: 0.05, explain: 'λ = 3 m: dài như một người nằm ngang, nên anten đài FM cỡ mét.'},
      {type: 'do', title: 'Chọn ánh sáng vàng', text: 'Bấm nguồn “Ánh sáng vàng 600 nm”.', hints: ['Nút thứ ba.'], check: (c) => reg(c, 'vis'), explain: 'Ánh sáng nhìn thấy cũng là sóng điện từ, chỉ khác tần số rất cao.'},
      {type: 'predict', title: 'Tần số của ánh sáng', text: 'Ánh sáng vàng có bước sóng λ = 600 nm = 6·10⁻⁷ m. Tính tần số f = c/λ (theo 10¹⁴ Hz).', unit: '×10¹⁴ Hz', hints: ['3·10⁸/(6·10⁻⁷) = 5·10¹⁴.'], answer: (c) => c.r.f / 1e14, tol: 0.1, explain: 'f = 5·10¹⁴ Hz, cao gấp năm triệu lần sóng FM.'},
      {type: 'choice', title: 'Thứ tự các vùng', text: 'Sắp xếp theo tần số TĂNG dần:', options: ['Sóng vô tuyến < hồng ngoại < ánh sáng nhìn thấy < tử ngoại < tia X', 'Tia X < tử ngoại < nhìn thấy < hồng ngoại < sóng vô tuyến', 'Hồng ngoại < sóng vô tuyến < tử ngoại < nhìn thấy < tia X'], answer: 0, wrong: ['', 'Đó là thứ tự tần số GIẢM dần (bước sóng tăng dần).', 'Sóng vô tuyến có tần số thấp nhất, phải đứng đầu.'], hints: ['Tần số càng cao thì bước sóng càng ngắn: nhìn thang phổ từ trái sang phải.'], explain: 'Vô tuyến → vi sóng → hồng ngoại → nhìn thấy → tử ngoại → tia X → gamma: tần số tăng, bước sóng giảm.'},
      {type: 'do', title: 'Chọn tia X', text: 'Bấm nguồn “Tia X trong y tế” và đọc ứng dụng.', hints: ['Nút thứ tư.'], check: (c) => reg(c, 'xray'), explain: 'Tia X có bước sóng cỡ 0,1 nm, xuyên qua cơ thể nên dùng chụp X-quang.'},
      {type: 'choice', title: 'Ứng dụng', text: 'Vùng sóng điện từ nào dùng để chụp ảnh xương trong y tế?', options: ['Tia X', 'Hồng ngoại', 'Sóng vô tuyến'], answer: 0, wrong: ['', 'Hồng ngoại dùng cho camera nhiệt, điều khiển từ xa.', 'Sóng vô tuyến dùng truyền thông (đài, điện thoại, Wi-Fi).'], hints: ['Xem dòng “Ứng dụng” ở bảng bên trái.'], explain: 'Tia X xuyên qua mô mềm nhưng bị xương hấp thụ nhiều hơn, tạo ảnh X-quang.'},
      {type: 'predict', title: 'Từ trường', text: 'Trong sóng điện từ, độ lớn B và E liên hệ B₀ = E₀/c. Với E₀ = 3 V/m, tính B₀ theo nT (1 nT = 10⁻⁹ T).', unit: 'nT', setup: () => act.keep({E0: 3}), hints: ['3/(3·10⁸) = 10⁻⁸ T.'], answer: (c) => c.r.nT, tol: 0.3, explain: 'B₀ = 10⁻⁸ T = 10 nT: từ trường của sóng rất nhỏ so với từ trường Trái Đất (khoảng 50 000 nT).'},
      {type: 'do', title: 'Xoay anten thu 90°', text: 'Kéo thanh θ tới 90° để anten thu nằm ngang. Nhìn bóng đèn.', hints: ['Thanh “θ góc xoay anten thu”.'], setup: () => act.keep({theta: 0}), check: (c) => c.s.theta >= 88, explain: 'Đèn tắt: anten nằm ngang, vuông góc với E (thẳng đứng), nên E không làm electron trong anten dao động.'},
      {type: 'choice', title: 'Vì sao đèn tắt?', text: 'Điều này chứng tỏ gì về sóng điện từ?', options: ['Sóng điện từ là sóng ngang, E có phương xác định (sóng phân cực)', 'Sóng điện từ không truyền được trong không khí', 'Sóng điện từ là sóng dọc'], answer: 0, wrong: ['', 'Sóng vẫn tới anten, đèn tắt chỉ vì phương anten.', 'Sóng dọc có dao động theo phương truyền nên không có hiện tượng này.'], hints: ['Anten chỉ thu được thành phần của E dọc theo anten.'], explain: 'Độ sáng ∝ cos²θ: θ = 0 sáng nhất, θ = 90° tắt. Đây là bằng chứng sóng điện từ là sóng ngang.'},
      {type: 'do', title: 'Xoay lại 0°', text: 'Kéo θ về 0°: đèn sáng trở lại.', hints: ['Thanh θ về 0.'], check: (c) => c.s.theta <= 2 && c.r.lamp > 0.97, explain: 'Anten song song với E: thu tối đa.'},
      {type: 'choice', title: 'Môi trường truyền', text: 'Khác với sóng cơ, sóng điện từ:', options: ['Truyền được cả trong chân không', 'Chỉ truyền trong chất khí', 'Chỉ truyền trong chất rắn'], answer: 0, wrong: ['', 'Sóng điện từ truyền cả trong khí, lỏng, rắn.', 'Ánh sáng Mặt Trời đến Trái Đất qua chân không là sóng điện từ.'], hints: ['Ánh sáng Mặt Trời đi qua khoảng không vũ trụ tới ta.'], explain: 'Sóng điện từ không cần môi trường vật chất, truyền trong chân không với tốc độ c = 3·10⁸ m/s.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): xem mạch dao động và mạch thu.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Mạch dao động tạo dòng điện biến thiên làm các electron trong anten dao động, bức xạ sóng điện từ; anten thu làm ngược lại.'},
    ],
    quiz: [
      {q: 'Sóng điện từ có tần số 6·10¹⁴ Hz. Bước sóng của nó là:', options: ['500 nm', '5 nm', '2·10⁻⁶ m', '1800 m'], answer: 0, explain: 'λ = c/f = 3·10⁸/(6·10¹⁴) = 5·10⁻⁷ m = 500 nm.'},
      {q: 'Sóng điện từ là sóng:', options: ['Ngang', 'Dọc', 'Vừa ngang vừa dọc', 'Cơ học'], answer: 0, explain: 'E và B vuông góc với phương truyền: sóng ngang.'},
      {q: 'Thứ tự đúng theo bước sóng GIẢM dần là:', options: ['Vô tuyến, hồng ngoại, tử ngoại, tia X', 'Tia X, tử ngoại, hồng ngoại, vô tuyến', 'Hồng ngoại, vô tuyến, tia X, tử ngoại', 'Tử ngoại, tia X, vô tuyến, hồng ngoại'], answer: 0, explain: 'Vô tuyến có λ dài nhất, tia X ngắn hơn rất nhiều.'},
      {q: 'Trong sóng điện từ, E₀ = 6 V/m thì B₀ bằng:', options: ['2·10⁻⁸ T', '1,8·10⁹ T', '2·10⁻⁹ T', '6 T'], answer: 0, explain: 'B₀ = E₀/c = 6/(3·10⁸) = 2·10⁻⁸ T.'},
      {q: 'Sóng điện từ khác sóng âm ở chỗ nó:', options: ['Truyền được trong chân không', 'Là sóng dọc', 'Có tốc độ nhỏ hơn trong không khí', 'Cần môi trường đàn hồi'], answer: 0, explain: 'Sóng điện từ không cần môi trường; sóng âm cần môi trường vật chất.'},
    ],
    summary: [
      'Sóng điện từ: E và B cùng pha, vuông góc nhau và vuông góc với phương truyền (sóng ngang); B₀ = E₀/c.',
      'Truyền được trong chân không với c = 3·10⁸ m/s; c = λf.',
      'Thang sóng điện từ theo tần số tăng: vô tuyến, vi sóng, hồng ngoại, ánh sáng nhìn thấy, tử ngoại, tia X, tia gamma; mỗi vùng có ứng dụng riêng.',
      'Anten thu chỉ thu mạnh khi song song với E (cường độ ∝ cos²θ): bằng chứng sóng điện từ là sóng ngang.',
    ],
  };
}

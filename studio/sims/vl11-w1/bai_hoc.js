// Nội dung bài học W1 (Vật lí 11 KNTT, chương 2 Sóng — Mô tả sóng). ctx = {s: mô hình, r: readout, td}.
// act = {set({A, f, v, xP, xQ}) (chạy lại từ đầu), keep(o) (đổi thông số, sóng vẫn chạy)}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl11-w1',
    title: 'Mô tả sóng: sóng truyền trên dây',
    objectives: [
      'Nêu được sóng cơ là dao động lan truyền trong môi trường; phân tích được sóng ngang trên dây.',
      'Hiểu biên độ A, chu kì T, tần số f, bước sóng λ, tốc độ truyền sóng v và mối liên hệ v = λf.',
      'Nhận ra các hạt môi trường chỉ dao động tại chỗ, không chạy theo sóng; phân biệt vận tốc dao động của hạt với tốc độ truyền sóng.',
      'Tính độ lệch pha giữa hai điểm Δφ = 2πΔx/λ; đọc đồ thị li độ theo toạ độ và theo thời gian.',
    ],
    steps: [
      {type: 'do', title: 'Cho sóng chạy trên dây', text: 'Máy rung đang dao động lên xuống ở đầu dây. Chờ cho sóng lan tới bộ giảm chấn ở cuối dây (khoảng 2,3 giây).', hints: ['Nếu sóng chưa chạy, bấm “↺ Lại”.'], setup: () => act.set({A: 0.1, f: 1, v: 2, xP: 1, xQ: 2}), check: (c) => c.r.front >= 4.5 && !c.s.frozen, explain: 'Sóng truyền từ máy rung sang bên phải với tốc độ v = 2 m/s.'},
      {type: 'choice', title: 'Các chấm trắng chuyển động thế nào?', text: 'Các chấm trắng đánh dấu những đoạn dây. Khi sóng truyền qua, mỗi chấm trắng:', options: ['Dao động lên xuống tại chỗ', 'Chạy theo sóng sang bên phải', 'Đứng yên không chuyển động'], answer: 0, wrong: ['', 'Sóng truyền đi nhưng các đoạn dây không chạy theo. Hãy nhìn chấm đỏ P: nó chỉ lên và xuống.', 'Chấm trắng dao động liên tục khi sóng đi qua nó.'], hints: ['Nhìn chấm đỏ P trên đồ thị theo thời gian.'], explain: 'Sóng truyền năng lượng và dạng dao động, còn môi trường chỉ dao động quanh vị trí cân bằng.'},
      {type: 'choice', title: 'Sóng ngang hay sóng dọc?', text: 'Phương dao động của dây (lên – xuống) vuông góc với phương truyền sóng (sang phải). Đây là:', options: ['Sóng ngang', 'Sóng dọc'], answer: 0, wrong: ['', 'Sóng dọc có phương dao động trùng với phương truyền sóng (như lò xo nén – dãn). Ở đây dây dao động vuông góc.'], hints: ['So sánh hai phương: lên – xuống và sang phải.'], explain: 'Sóng truyền trên dây căng là sóng ngang.'},
      {type: 'predict', title: 'Chu kì dao động', text: 'Máy rung có tần số f = 1 Hz. Mỗi điểm trên dây thực hiện một dao động đầy đủ trong thời gian T = 1/f bằng bao nhiêu?', unit: 's', hints: ['T = 1/1.'], answer: (c) => 1 / c.s.f, tol: 0.02, explain: 'T = 1/f = 1 s. Trên đồ thị theo thời gian, đoạn T là khoảng giữa hai đỉnh liên tiếp.'},
      {type: 'do', title: 'Dừng hình để đo', text: 'Bấm “❚❚ Dừng hình” để làm sóng đứng lại như một bức ảnh, rồi đo trên thước.', hints: ['Nút ở bảng bên phải (hoặc phím cách).'], check: (c) => c.s.frozen, explain: 'Bây giờ em đọc được khoảng cách giữa hai đỉnh sóng liên tiếp trên thước (đoạn màu xanh lục).'},
      {type: 'predict', title: 'Đo bước sóng', text: 'Đo khoảng cách giữa hai đỉnh sóng liên tiếp bằng thước mét (hoặc nhìn nhãn xanh lục). Đó là bước sóng λ.', unit: 'm', hints: ['Hai đỉnh cách nhau 2 vạch lớn (mỗi vạch lớn 0,5 m) hoặc 4 vạch.'], answer: (c) => c.r.lam, tol: 0.1, explain: 'λ = 2 m. Bước sóng là quãng đường sóng truyền đi trong một chu kì.'},
      {type: 'predict', title: 'Tốc độ truyền sóng', text: 'Tính tốc độ truyền sóng v = λ·f từ số liệu em vừa đo.', unit: 'm/s', hints: ['v = 2 · 1.'], answer: (c) => c.r.lam * c.s.f, tol: 0.1, explain: 'v = λf = 2 m/s, đúng bằng tốc độ mà máy đặt (hãy nhìn thanh trượt v).'},
      {type: 'do', title: 'Tăng tần số', text: 'Kéo thanh “f tần số” lên 2 Hz, giữ nguyên v = 2 m/s. Sóng sẽ chạy lại.', hints: ['Thanh trượt f; hoặc bấm thí nghiệm mẫu 2.'], setup: () => act.keep({A: 0.1, f: 1, v: 2, frozen: false}), check: (c) => near(c.s.f, 2, 0.06) && near(c.s.v, 2, 0.06), explain: 'Máy rung nhanh gấp đôi, các đỉnh sóng sát nhau hơn.'},
      {type: 'predict', title: 'Bước sóng mới', text: 'Với f = 2 Hz và v = 2 m/s, bước sóng λ = v/f bằng bao nhiêu?', unit: 'm', hints: ['λ = 2/2.'], answer: (c) => c.s.v / c.s.f, tol: 0.05, explain: 'λ = 1 m: giảm một nửa.'},
      {type: 'choice', title: 'Tần số tăng thì bước sóng...', text: 'Khi tăng tần số của máy rung mà tốc độ truyền sóng không đổi, bước sóng sẽ:', options: ['Giảm', 'Tăng', 'Không đổi'], answer: 0, wrong: ['', 'λ = v/f: f tăng, v không đổi thì λ giảm.', 'Các đỉnh sóng trên dây đã sát nhau hơn; λ không thể không đổi.'], hints: ['λ = v/f.'], explain: 'λ tỉ lệ nghịch với f khi v không đổi.'},
      {type: 'choice', title: 'Tốc độ truyền sóng phụ thuộc vào gì?', text: 'Tốc độ truyền sóng trên dây phụ thuộc chủ yếu vào:', options: ['Môi trường (dây): độ căng, khối lượng mỗi mét dây', 'Tần số của máy rung', 'Biên độ của máy rung'], answer: 0, wrong: ['', 'Em vừa thấy: tăng f nhưng v vẫn là 2 m/s (thanh trượt v không đổi).', 'Thử kéo thanh biên độ A: v không thay đổi.'], hints: ['Thử đổi A và f, xem v có đổi không.'], explain: 'v do môi trường quyết định. Khi f đổi thì λ đổi để giữ v = λf không đổi.'},
      {type: 'do', title: 'Hai điểm ngược pha', text: 'Đặt hai điểm P và Q cách nhau đúng nửa bước sóng (0,5 m khi λ = 1 m) bằng hai thanh trượt vị trí.', hints: ['Ví dụ P = 1,00 m, Q = 1,50 m.'], check: (c) => near(c.r.dx, c.r.lam / 2, 0.04), explain: 'Khi cách nhau nửa bước sóng, P lên thì Q xuống: hai đường đỏ và xanh trên đồ thị đối xứng nhau.'},
      {type: 'choice', title: 'P và Q dao động như thế nào?', text: 'Hai điểm cách nhau nửa bước sóng dao động:', options: ['Ngược pha', 'Cùng pha', 'Vuông pha'], answer: 0, wrong: ['', 'Cùng pha khi cách nhau một số nguyên lần λ.', 'Vuông pha khi cách nhau λ/4.'], hints: ['Xem hai đường trên đồ thị theo thời gian.'], explain: 'Δφ = 2π·(λ/2)/λ = π: ngược pha.'},
      {type: 'predict', title: 'Độ lệch pha', text: 'Giờ đặt P tại 1,00 m và Q tại 1,25 m với λ = 1 m. Độ lệch pha Δφ = 2πΔx/λ bằng bao nhiêu radian?', unit: 'rad', setup: () => act.keep({xP: 1, xQ: 1.25}), hints: ['Δx = 0,25 m; 2π·0,25 = π/2 ≈ 1,57.'], answer: (c) => (2 * Math.PI * c.r.dx) / c.r.lam, tol: 0.04, explain: 'Δφ = π/2 ≈ 1,57 rad (một phần tư chu kì): Q dao động chậm pha hơn P một phần tư chu kì.'},
      {type: 'predict', title: 'Vận tốc dao động của hạt', text: 'Khác với tốc độ sóng, mỗi hạt dao động với tốc độ cực đại v_max = 2πf·A. Với A = 10 cm và f = 2 Hz, tính v_max.', unit: 'm/s', hints: ['2π · 2 · 0,1.'], answer: (c) => c.r.vmax, tol: 0.04, explain: 'v_max ≈ 1,26 m/s, còn sóng truyền với v = 2 m/s. Đó là hai đại lượng khác nhau.'},
      {type: 'do', title: 'Bóc tách máy rung', text: 'Bấm TEARDOWN (phím T) để xem tay quay và thanh trượt.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Chốt tay quay trượt trong rãnh của thanh trượt nên thanh chỉ chuyển động lên – xuống theo A·sin(ωt). Bán kính tay quay chính là biên độ A.'},
    ],
    quiz: [
      {q: 'Sóng có tần số 50 Hz, bước sóng 0,2 m. Tốc độ truyền sóng là:', options: ['0,004 m/s', '10 m/s', '250 m/s', '100 m/s'], answer: 1, explain: 'v = λf = 0,2·50 = 10 m/s.'},
      {q: 'Tần số 4 Hz thì chu kì là:', options: ['0,25 s', '0,4 s', '2,5 s', '4 s'], answer: 0, explain: 'T = 1/f = 1/4 = 0,25 s.'},
      {q: 'Hai điểm trên phương truyền sóng cách nhau đúng một bước sóng thì dao động:', options: ['Ngược pha', 'Cùng pha', 'Vuông pha', 'Không liên quan'], answer: 1, explain: 'Δφ = 2π·λ/λ = 2π: cùng pha.'},
      {q: 'Bước sóng là:', options: ['Quãng đường sóng truyền được trong một chu kì', 'Độ cao của đỉnh sóng', 'Số dao động trong 1 giây', 'Thời gian một dao động'], answer: 0, explain: 'λ = vT: quãng đường sóng truyền trong một chu kì, cũng là khoảng cách hai đỉnh liên tiếp.'},
      {q: 'Khi sóng truyền trên dây, các phần tử dây:', options: ['Chạy theo sóng với tốc độ v', 'Dao động quanh vị trí cân bằng', 'Đứng yên', 'Chuyển động tròn'], answer: 1, explain: 'Sóng truyền dạng dao động; các phần tử chỉ dao động tại chỗ.'},
    ],
    summary: [
      'Sóng cơ là dao động lan truyền trong môi trường; trên dây là sóng ngang (dao động vuông góc phương truyền).',
      'T = 1/f; λ = vT = v/f; v do môi trường quyết định.',
      'Độ lệch pha giữa hai điểm cách nhau Δx: Δφ = 2πΔx/λ (λ/2 là ngược pha, λ là cùng pha).',
      'Các phần tử môi trường chỉ dao động tại chỗ, tốc độ dao động cực đại v_max = 2πfA khác với tốc độ truyền sóng v.',
    ],
  };
}

// Nội dung bài học W4 (Vật lí 11 KNTT, chương 2 Sóng — Giao thoa sóng). ctx = {s: mô hình, r: readout, td}.
// act = {set(o) (chạy lại từ đầu), keep(o)}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl11-w4',
    title: 'Giao thoa sóng: hai nguồn kết hợp trên mặt nước',
    objectives: [
      'Nêu được điều kiện của hai nguồn kết hợp và hiện tượng giao thoa của hai sóng.',
      'Xác định hiệu đường đi Δd = d₂ − d₁ tại một điểm và vận dụng: cực đại khi Δd = kλ, cực tiểu khi Δd = (k + ½)λ (hai nguồn cùng pha).',
      'Nhận ra đường cực đại, cực tiểu là các đường hypebol; đếm số cực đại trên đoạn nối hai nguồn.',
      'So sánh trường hợp hai nguồn cùng pha và ngược pha.',
    ],
    steps: [
      {type: 'do', title: 'Cho hai nguồn rung', text: 'Hai cần rung chạm mặt nước cùng tần số 3 Hz, cùng pha. Chờ khoảng 3 giây cho sóng lan ra khắp khay và quan sát hình ảnh trên mặt nước.', hints: ['Nếu sóng chưa chạy, bấm “↺ Lại”.'], setup: () => act.set({f: 3, v: 0.3, a: 0.35, opp: false, xM: 0.2, zM: 0.3, lines: false}), check: (c) => c.s.t >= 3 && !c.s.frozen, explain: 'Mặt nước xuất hiện những vùng dao động mạnh và những vùng gần như đứng yên, xen kẽ, đứng yên một chỗ: đó là hình ảnh giao thoa.'},
      {type: 'choice', title: 'Hai nguồn kết hợp', text: 'Muốn quan sát được hình giao thoa ổn định, hai nguồn sóng phải là hai nguồn kết hợp, tức là:', options: ['Cùng tần số và độ lệch pha không đổi theo thời gian', 'Có biên độ bằng nhau', 'Đặt gần nhau'], answer: 0, wrong: ['', 'Biên độ bằng nhau chỉ giúp nút triệt tiêu hoàn toàn, không phải điều kiện của hai nguồn kết hợp.', 'Khoảng cách giữa hai nguồn không quyết định hai nguồn có kết hợp hay không.'], hints: ['Hai cần rung gắn chung một động cơ nên luôn cùng tần số và cùng pha.'], explain: 'Hai nguồn kết hợp: cùng tần số và hiệu pha không đổi. Hai cần rung của khay sóng thoả mãn điều kiện đó.'},
      {type: 'do', title: 'Bật đường cực đại – cực tiểu', text: 'Bấm “Đường cực đại – cực tiểu”: đường vàng là những điểm dao động mạnh nhất, đường đỏ là những điểm đứng yên.', hints: ['Nút ở bảng bên phải.'], check: (c) => c.s.lines, explain: 'Các đường vàng và đỏ là những hypebol nhận hai nguồn làm tiêu điểm.'},
      {type: 'predict', title: 'Bước sóng', text: 'Tần số f = 3 Hz, tốc độ truyền sóng v = 0,3 m/s. Tính bước sóng λ = v/f.', unit: 'm', hints: ['λ = 0,3/3.'], answer: (c) => c.r.lam, tol: 0.004, explain: 'λ = 0,1 m = 10 cm. Hai đường vàng liên tiếp trên đoạn nối hai nguồn cách nhau λ/2 = 5 cm.'},
      {type: 'do', title: 'Điểm trên đường trung trực', text: 'Dùng thanh trượt “M · vị trí x” đặt điểm khảo sát M (phao đỏ) lên đường trung trực của S₁S₂ (x = 0).', hints: ['Kéo thanh trượt x về 0.'], check: (c) => Math.abs(c.s.xM) <= 0.011, explain: 'M cách đều hai nguồn nên d₁ = d₂, Δd = 0.'},
      {type: 'choice', title: 'M dao động thế nào?', text: 'Hai nguồn cùng pha. Điểm M trên đường trung trực, Δd = 0, nên M là:', options: ['Cực đại', 'Cực tiểu', 'Điểm có biên độ bằng một nửa'], answer: 0, wrong: ['', 'Cực tiểu cần hai sóng ngược pha; ở đây hai sóng đi cùng quãng đường nên cùng pha.', 'Biên độ chỉ bằng một nửa khi Δd = λ/4, không phải Δd = 0.'], hints: ['Hai sóng đến M cùng một lúc, cùng pha.'], explain: 'Δd = 0 = 0·λ nên M là cực đại (biên độ gấp đôi biên độ một nguồn).'},
      {type: 'do', title: 'Tìm cực đại bậc 1', text: 'Đặt M tại một điểm có hiệu đường đi |Δd| = λ (chỉ số Δd/λ = ±1 ở bảng bên trái). Gợi ý: đặt z = 30 cm rồi thử x gần 10 cm.', hints: ['Đọc Δd/λ ở bảng bên trái và chỉnh x từng cm một.'], setup: () => act.keep({xM: 0, zM: 0.3}), check: (c) => near(Math.abs(c.r.ddLam), 1, 0.1) && c.r.kind === 'max', explain: 'Δd = λ: hai sóng lệch nhau đúng một bước sóng nên vẫn cùng pha: cực đại. Biên độ đọc được là 2A.'},
      {type: 'predict', title: 'Hiệu đường đi tại cực tiểu', text: 'Cực tiểu đầu tiên bên cạnh đường trung trực có Δd = (0 + ½)λ. Tính Δd (m) với λ = 10 cm.', unit: 'm', hints: ['Δd = 0,5·0,1.'], answer: (c) => 0.5 * c.r.lam, tol: 0.004, explain: 'Δd = λ/2 = 0,05 m: hai sóng ngược pha nên triệt tiêu nhau.'},
      {type: 'do', title: 'Tìm một cực tiểu', text: 'Di chuyển M tới một điểm đứng yên (đường đỏ): Δd/λ gần ±0,5 hoặc ±1,5; biên độ ≈ 0.', hints: ['Gần đường trung trực, thử x ≈ 5 cm khi z = 30 cm.'], check: (c) => c.r.kind === 'min' && c.r.ratio < 0.15, explain: 'Tại cực tiểu li độ của M luôn bằng 0: sóng từ S₁ và S₂ luôn ngược pha. Hãy nhìn đồ thị dao động: đường tím (tổng) phẳng.'},
      {type: 'predict', title: 'Đếm cực đại trên đoạn S₁S₂', text: 'Khoảng cách hai nguồn a = 35 cm, λ = 10 cm. Số cực đại giữa hai nguồn thoả mãn |kλ| < a. Có bao nhiêu cực đại?', unit: 'cực đại', setup: () => act.keep({xM: 0.2, zM: 0.3}), hints: ['k = −3, −2, −1, 0, 1, 2, 3.'], answer: (c) => c.r.nMax, tol: 0.01, explain: 'a/λ = 3,5 nên k nhận 7 giá trị từ −3 đến 3: có 7 cực đại (và 6 cực tiểu xen kẽ).'},
      {type: 'do', title: 'Tăng tần số', text: 'Kéo f lên 3,5 Hz (v = 0,3 m/s). Bước sóng ngắn hơn.', hints: ['Thanh f ở bảng bên phải.'], check: (c) => c.s.f >= 3.4 && !c.s.opp, explain: 'λ = 0,3/3,5 ≈ 8,6 cm, các đường vàng sát nhau hơn.'},
      {type: 'predict', title: 'Số cực đại mới', text: 'Với λ ≈ 8,6 cm và a = 35 cm, a/λ ≈ 4,08. Có bao nhiêu cực đại trên đoạn S₁S₂?', unit: 'cực đại', hints: ['|k| < 4,08, nên k từ −4 đến 4.'], answer: (c) => c.r.nMax, tol: 0.01, explain: 'k = −4, …, 4: 9 cực đại. Bước sóng càng ngắn thì giao thoa càng nhiều vân.'},
      {type: 'choice', title: 'Bước sóng ngắn hơn', text: 'Khi λ giảm (a không đổi), số đường cực đại và cực tiểu trên mặt nước:', options: ['Tăng', 'Giảm', 'Không đổi'], answer: 0, wrong: ['', 'Số cực đại trên đoạn nối hai nguồn xấp xỉ 2a/λ: λ giảm thì số cực đại tăng.', 'Em vừa thấy số cực đại đã tăng từ 7 lên 9.'], hints: ['So 7 với 9.'], explain: 'Số vân tỉ lệ nghịch với λ.'},
      {type: 'do', title: 'Đổi sang hai nguồn ngược pha', text: 'Bấm “Ngược pha”: cần rung thứ hai nhấn xuống khi cần thứ nhất nhô lên.', hints: ['Nút “Ngược pha” ở bảng bên phải.'], check: (c) => c.s.opp, explain: 'Hình giao thoa đổi chỗ: nơi từng là cực đại nay là cực tiểu và ngược lại.'},
      {type: 'choice', title: 'Đường trung trực khi ngược pha', text: 'Hai nguồn ngược pha. Các điểm trên đường trung trực của S₁S₂ là:', options: ['Cực tiểu', 'Cực đại', 'Không xác định'], answer: 0, wrong: ['', 'Hai sóng đến trung trực cùng lúc nhưng xuất phát ngược pha nên triệt tiêu nhau.', 'Biên độ ở đó xác định: bằng 0. Đặt M vào x = 0 để kiểm tra.'], hints: ['Thử đặt M ở x = 0 và đọc biên độ.'], explain: 'Δd = 0 nhưng hai nguồn ngược pha, nên hiệu pha của hai sóng tại đó là π: cực tiểu.'},
      {type: 'predict', title: 'Đếm cực đại khi ngược pha', text: 'Với a/λ ≈ 4,08 và hai nguồn ngược pha, cực đại khi Δd = (k + ½)λ. Có bao nhiêu cực đại trên đoạn S₁S₂?', unit: 'cực đại', hints: ['|(k + ½)λ| < a, nên k + ½ nhận các giá trị −3,5 … 3,5.'], answer: (c) => c.r.nMax, tol: 0.01, explain: 'Có 8 cực đại và 9 cực tiểu (ngược với trường hợp cùng pha).'},
      {type: 'do', title: 'Xem bản đồ biên độ', text: 'Bấm “Xem biên độ”: vàng sáng là nơi dao động mạnh, xanh đậm là nơi đứng yên. Hình này không đổi theo thời gian.', hints: ['Nút “Xem biên độ”.'], check: (c) => c.s.ampMode, explain: 'Biên độ tại mỗi điểm không đổi theo thời gian: đó là điểm khác biệt với sóng truyền (nơi biên độ chạy theo).'},
      {type: 'do', title: 'Bóc tách cần rung', text: 'Bấm TEARDOWN (phím T): xem động cơ và đĩa lệch tâm làm cần rung nhấp nhô.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Hai cần rung gắn vào động cơ chung (hoặc hai động cơ cùng nguồn điện) nên luôn kết hợp với nhau.'},
    ],
    quiz: [
      {q: 'Hai nguồn cùng pha. Điểm có hiệu đường đi Δd = 2λ là:', options: ['Cực tiểu', 'Cực đại', 'Điểm có biên độ A', 'Điểm nút của sóng dừng'], answer: 1, explain: 'Δd = kλ (k = 2) nên hai sóng cùng pha: cực đại.'},
      {q: 'Hai nguồn cùng pha. Điểm có hiệu đường đi Δd = 1,5λ là:', options: ['Cực đại', 'Cực tiểu', 'Điểm có biên độ lớn nhất', 'Không dao động hay dao động đều được'], answer: 1, explain: 'Δd = (k + ½)λ (k = 1): hai sóng ngược pha, cực tiểu.'},
      {q: 'Sóng có f = 5 Hz, v = 0,4 m/s. Bước sóng là:', options: ['0,02 m', '0,08 m', '0,125 m', '2 m'], answer: 1, explain: 'λ = v/f = 0,4/5 = 0,08 m.'},
      {q: 'Điều kiện để có hình giao thoa ổn định là hai nguồn phải:', options: ['Cùng biên độ', 'Kết hợp (cùng tần số, hiệu pha không đổi)', 'Đặt cách nhau bằng bước sóng', 'Có biên độ khác nhau'], answer: 1, explain: 'Hai nguồn kết hợp cho hình giao thoa ổn định theo thời gian.'},
      {q: 'Hai nguồn ngược pha. Đường trung trực của hai nguồn là đường:', options: ['Cực đại', 'Cực tiểu', 'Bất kì', 'Nút của sóng dừng'], answer: 1, explain: 'Δd = 0 nhưng hai nguồn lệch pha π nên hai sóng ngược pha tại mọi điểm trên trung trực: cực tiểu.'},
    ],
    summary: [
      'Giao thoa là sự chồng chất của hai sóng kết hợp: có những điểm dao động mạnh nhất (cực đại) và những điểm đứng yên (cực tiểu), đứng yên một chỗ.',
      'Hai nguồn cùng pha: cực đại khi Δd = kλ, cực tiểu khi Δd = (k + ½)λ. Hai nguồn ngược pha thì ngược lại.',
      'Các đường cực đại, cực tiểu là hypebol nhận hai nguồn làm tiêu điểm; số cực đại trên đoạn nối hai nguồn xấp xỉ 2a/λ.',
      'Biên độ tại điểm bất kì: 2A|cos(Δψ/2)|; cực đại 2A, cực tiểu 0.',
    ],
  };
}

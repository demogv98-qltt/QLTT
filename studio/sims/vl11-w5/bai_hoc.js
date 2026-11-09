// Nội dung bài học W5 (Vật lí 11 KNTT, chương 2 Sóng — Sóng dừng). ctx = {s: mô hình, r: readout, td}.
// act = {set({f, L, mass}) (chạy lại từ đầu), keep(o)}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl11-w5',
    title: 'Sóng dừng trên dây hai đầu cố định',
    objectives: [
      'Giải thích sóng dừng là kết quả chồng chất của sóng tới và sóng phản xạ cùng tần số, truyền ngược chiều.',
      'Nhận biết nút và bụng; khoảng cách giữa hai nút (hoặc hai bụng) liên tiếp bằng λ/2.',
      'Vận dụng điều kiện sóng dừng trên dây hai đầu cố định: L = nλ/2, tức f = n·v/(2L); v = √(T/μ).',
      'Hiểu hiện tượng cộng hưởng: biên độ tăng vọt khi tần số máy rung bằng một tần số riêng của dây.',
    ],
    steps: [
      {type: 'do', title: 'Tìm tần số làm dây rung mạnh', text: 'Dây dài 1,5 m, treo 200 g. Kéo thanh f từ từ từ 1 Hz lên và quan sát: khi nào dây rung với biên độ lớn nhất và có một bụng duy nhất? (Gợi ý: trong khoảng 1,4 đến 1,6 Hz.)', hints: ['Nhìn đường cộng hưởng ở bảng bên trái: chấm tròn leo lên đỉnh.', 'Thử f = 1,48 Hz.'], setup: () => act.set({L: 1.5, mass: 0.2, f: 1}), check: (c) => c.r.n === 1, explain: 'Biên độ ở bụng tăng vọt (gấp hơn 20 lần biên độ máy rung) và dây chia thành một bó sóng đứng yên: đó là sóng dừng.'},
      {type: 'choice', title: 'Hiện tượng gì xảy ra?', text: 'Biên độ dây tăng vọt khi tần số máy rung đạt một giá trị đặc biệt. Hiện tượng đó gọi là:', options: ['Cộng hưởng', 'Giao thoa', 'Phản xạ toàn phần'], answer: 0, wrong: ['', 'Giao thoa là chồng chất của hai sóng từ hai nguồn kết hợp (bài kế tiếp). Ở đây có một máy rung.', 'Phản xạ toàn phần là hiện tượng của ánh sáng khi đi qua hai môi trường.'], hints: ['Tần số máy rung trùng với tần số riêng của dây.'], explain: 'Cộng hưởng: tần số cưỡng bức bằng tần số riêng của hệ nên biên độ rất lớn.'},
      {type: 'predict', title: 'Đếm nút', text: 'Đang ở sóng dừng một bụng. Có bao nhiêu nút trên dây (tính cả hai đầu cố định)? Em bấm “Nút và bụng” để thấy chấm đỏ.', unit: 'nút', hints: ['Hai đầu dây là hai nút.'], answer: (c) => c.r.nNear + 1, tol: 0.01, explain: 'Hai nút ở hai đầu, một bụng ở giữa: n + 1 = 2 nút.'},
      {type: 'predict', title: 'Bước sóng', text: 'Khoảng cách giữa hai nút liên tiếp là λ/2. Dây dài 1,5 m chứa đúng một λ/2. Tính bước sóng λ.', unit: 'm', hints: ['λ = 2L/n = 2·1,5/1.'], answer: (c) => (2 * c.s.L) / c.r.nNear, tol: 0.05, explain: 'λ = 3 m. Điều kiện sóng dừng: L = n·λ/2 với n = 1, 2, 3…'},
      {type: 'predict', title: 'Tần số cộng hưởng thấp nhất', text: 'Tốc độ truyền sóng trên dây v = √(T/μ) (xem “v” ở bảng bên trái). Tính f₁ = v/(2L).', unit: 'Hz', hints: ['v ≈ 4,43 m/s; 2L = 3 m.'], answer: (c) => c.r.f1, tol: 0.03, explain: 'f₁ = 4,43/3 ≈ 1,48 Hz, đúng với điểm em vừa tìm thấy.'},
      {type: 'do', title: 'Sóng dừng hai bụng', text: 'Tăng f lên gần gấp đôi để dây chia làm hai bụng.', hints: ['Đường cộng hưởng có đỉnh thứ hai ở khoảng 2,95 Hz.'], check: (c) => c.r.n === 2, explain: 'Cộng hưởng lần thứ hai: dây chia thành 2 bó, ở giữa có thêm một nút.'},
      {type: 'predict', title: 'Đếm nút lần nữa', text: 'Với sóng dừng hai bụng, có bao nhiêu nút (kể cả hai đầu)?', unit: 'nút', hints: ['n + 1.'], answer: (c) => c.r.nNear + 1, tol: 0.01, explain: 'Hai bụng thì có 3 nút. Quy tắc: n bụng thì n + 1 nút.'},
      {type: 'predict', title: 'Khoảng cách hai nút liên tiếp', text: 'Ở sóng dừng hai bụng, khoảng cách giữa hai nút liên tiếp bằng bao nhiêu? (Xem nhãn xanh lục trên dây.)', unit: 'm', hints: ['Dây 1,5 m chia thành 2 đoạn bằng nhau.'], answer: (c) => c.r.lam / 2, tol: 0.03, explain: 'λ/2 = 0,75 m, nên λ = 1,5 m.'},
      {type: 'choice', title: 'Khoảng cách hai nút', text: 'Trong sóng dừng, khoảng cách giữa hai nút liên tiếp bằng:', options: ['Nửa bước sóng (λ/2)', 'Một bước sóng (λ)', 'Một phần tư bước sóng (λ/4)'], answer: 0, wrong: ['', 'Một bước sóng là khoảng cách giữa hai nút CÁCH MỘT nút (ví dụ nút thứ nhất và nút thứ ba).', 'λ/4 là khoảng cách giữa một nút và bụng kề nó.'], hints: ['Em vừa đo 0,75 m khi λ = 1,5 m.'], explain: 'Hai nút liên tiếp cách nhau λ/2; một nút và một bụng liên tiếp cách nhau λ/4.'},
      {type: 'predict', title: 'Dự đoán cộng hưởng bậc 3', text: 'Tính tần số cộng hưởng thứ ba f₃ = 3·v/(2L) (dây vẫn 1,5 m, 200 g).', unit: 'Hz', hints: ['f₃ = 3·f₁ = 3·1,476.'], answer: (c) => 3 * c.r.f1, tol: 0.06, explain: 'f₃ ≈ 4,43 Hz. Các tần số cộng hưởng là f₁, 2f₁, 3f₁…'},
      {type: 'do', title: 'Kiểm chứng dự đoán', text: 'Đặt f gần giá trị em vừa tính và xem dây có ba bụng không.', hints: ['f ≈ 4,43 Hz.'], check: (c) => c.r.n === 3, explain: 'Dự đoán đúng: ba bụng, bốn nút.'},
      {type: 'choice', title: 'Điều kiện sóng dừng', text: 'Điều kiện để có sóng dừng trên dây dài L có hai đầu cố định là:', options: ['L = n·λ/2 (n = 1, 2, 3, …)', 'L = n·λ (n = 1, 2, 3, …)', 'L = (n + ½)·λ/2'], answer: 0, wrong: ['', 'L = nλ sẽ cho số nguyên bước sóng, nhưng hai đầu cố định là hai nút nên chỉ cần số nguyên NỬA bước sóng.', 'Dạng (n + ½)λ/2 là điều kiện của dây có một đầu cố định và một đầu tự do.'], hints: ['Hai đầu cố định là hai nút; hai nút liên tiếp cách nhau λ/2.'], explain: 'L = nλ/2 ⇒ f = n·v/(2L), n = 1, 2, 3, …'},
      {type: 'do', title: 'Tăng lực căng dây', text: 'Treo thêm quả nặng cho đủ 500 g (kéo thanh m lên 500 g). Lực căng tăng thì tốc độ truyền sóng thay đổi thế nào?', hints: ['Thanh “m quả nặng” ở bảng bên phải.'], setup: () => act.keep({f: 2, mass: 0.2}), check: (c) => near(c.s.mass, 0.5, 0.012), explain: 'T = mg tăng từ 1,96 N lên 4,9 N, v = √(T/μ) tăng từ 4,4 lên 7 m/s.'},
      {type: 'predict', title: 'Tần số cơ bản mới', text: 'Dây vẫn dài 1,5 m nhưng treo 500 g. Tính f₁ = v/(2L) mới.', unit: 'Hz', hints: ['v = √(4,9/0,1) = 7 m/s.'], answer: (c) => c.r.f1, tol: 0.03, explain: 'f₁ = 7/3 ≈ 2,33 Hz, cao hơn trước. Dây căng hơn thì các tần số cộng hưởng đều tăng.'},
      {type: 'choice', title: 'Cao độ của dây đàn', text: 'Vặn dây đàn căng hơn (cùng chiều dài) thì âm cơ bản của dây trở nên:', options: ['Cao hơn', 'Thấp hơn', 'Không đổi'], answer: 0, wrong: ['', 'Dây căng hơn thì v tăng nên f₁ = v/(2L) tăng, âm cao hơn.', 'f₁ phụ thuộc vào v nên đổi khi lực căng đổi.'], hints: ['f₁ = v/(2L) và v = √(T/μ).'], explain: 'Đó là cách chỉnh dây đàn: tăng lực căng thì f₁ tăng.'},
      {type: 'do', title: 'Tách sóng tới và sóng phản xạ', text: 'Em đã được trả về dây treo 200 g, đang cộng hưởng bậc 3. Bấm “Tách sóng tới – phản xạ” để thấy hai sóng chạy ngược chiều (xanh dương: tới, xanh lục: phản xạ) cộng lại thành sóng dừng (cam).', hints: ['Nút “Tách sóng tới – phản xạ”.'], setup: () => act.keep({mass: 0.2, f: 4.43}), check: (c) => c.s.showComp, explain: 'Hai sóng cùng biên độ, cùng tần số chạy ngược chiều. Tại nút chúng luôn ngược pha và triệt tiêu nhau; tại bụng chúng luôn cùng pha và cộng lại.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): xem máy rung, cầu đỡ và ròng rọc.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Cầu đỡ giữ dây đứng yên tại đó nên đó là một nút. Quả nặng treo qua ròng rọc tạo lực căng T = mg.'},
    ],
    quiz: [
      {q: 'Dây dài 0,6 m, hai đầu cố định, có sóng dừng với 3 bụng. Bước sóng là:', options: ['0,2 m', '0,4 m', '0,6 m', '1,2 m'], answer: 1, explain: 'L = nλ/2 ⇒ λ = 2L/n = 1,2/3 = 0,4 m.'},
      {q: 'Hai nút liên tiếp của sóng dừng cách nhau 5 cm. Bước sóng là:', options: ['2,5 cm', '5 cm', '10 cm', '20 cm'], answer: 2, explain: 'Hai nút liên tiếp cách nhau λ/2 nên λ = 10 cm.'},
      {q: 'Đầu cố định của dây trong sóng dừng là:', options: ['Bụng sóng', 'Nút sóng', 'Điểm có biên độ lớn nhất', 'Điểm dao động ngược pha với máy rung'], answer: 1, explain: 'Đầu cố định không dao động nên là nút.'},
      {q: 'Sóng dừng được tạo thành do:', options: ['Chồng chất của sóng tới và sóng phản xạ', 'Hai nguồn khác tần số', 'Sóng truyền qua hai môi trường', 'Sóng bị hấp thụ'], answer: 0, explain: 'Sóng tới và sóng phản xạ cùng tần số, truyền ngược chiều chồng chất tạo sóng dừng.'},
      {q: 'Dây dài 1 m hai đầu cố định, tốc độ truyền sóng 20 m/s. Tần số cơ bản (một bụng) là:', options: ['5 Hz', '10 Hz', '20 Hz', '40 Hz'], answer: 1, explain: 'f₁ = v/(2L) = 20/2 = 10 Hz.'},
    ],
    summary: [
      'Sóng dừng là sóng có các nút (không dao động) và bụng (dao động mạnh nhất) cố định trong không gian, do sóng tới và sóng phản xạ chồng chất.',
      'Hai nút (hoặc hai bụng) liên tiếp cách nhau λ/2; nút và bụng liên tiếp cách nhau λ/4.',
      'Dây hai đầu cố định: L = nλ/2, f_n = n·v/(2L); n bụng, n + 1 nút. v = √(T/μ).',
      'Tần số máy rung trùng tần số riêng của dây thì cộng hưởng: biên độ tăng vọt.',
    ],
  };
}

// Nội dung bài học M9 (Vật lí 10 KNTT: mômen lực, điều kiện cân bằng của vật rắn có trục quay cố định).
// ctx = {s: mô hình, c: giá trị đang đặt (cmd), r: readout, td}. act = {setCmd({F1, d1, F2, d2})}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const set = (c, F1, d1, F2, d2, t = 0.5) => near(c.c.F1, F1, t) && near(c.c.d1, d1, 0.015) && near(c.c.F2, F2, t) && near(c.c.d2, d2, 0.015);
  return {
    code: 'vl10-m9',
    title: 'Mômen lực và cân bằng của vật rắn: thanh đòn trên trục quay',
    objectives: [
      'Tính mômen lực M = F·d (d là cánh tay đòn: khoảng cách từ trục quay đến giá của lực); đơn vị N·m.',
      'Phân biệt mômen làm vật quay cùng chiều và ngược chiều kim đồng hồ.',
      'Vận dụng điều kiện cân bằng của vật có trục quay cố định: tổng mômen quay thuận = tổng mômen quay ngược.',
      'Giải thích vì sao đòn bẩy cho lợi về lực khi cánh tay đòn của lực tác dụng dài hơn.',
    ],
    steps: [
      {type: 'do', title: 'Bài thí nghiệm đầu tiên', text: 'Đặt F₁ = 40 N tại d₁ = 0,6 m (bên trái) và F₂ = 60 N tại d₂ = 0,4 m (bên phải). Hoặc bấm thí nghiệm mẫu 1.',
        hints: ['Bấm “1. Cân bằng chuẩn” ở bảng bên phải.'], setup: () => act.setCmd({F1: 25, d1: 0.5, F2: 30, d2: 0.7}), check: (c) => set(c, 40, 0.6, 60, 0.4),
        explain: 'Hai quả cân ở hai phía trục O, mỗi lực treo vào thanh ở một khoảng cách khác nhau.'},
      {type: 'predict', title: 'Đoán trước: mômen bên trái', text: 'Mômen của lực F₁ đối với trục O (M₁ = F₁·d₁) bằng bao nhiêu?', unit: 'N·m',
        hints: ['M = F · d', 'M₁ = 40 · 0,6.'], answer: (c) => c.c.F1 * c.c.d1, tol: 0.06, explain: 'M₁ = F₁·d₁ = 40·0,6 = 24 N·m. Lực F₁ làm thanh quay NGƯỢC chiều kim đồng hồ.'},
      {type: 'predict', title: 'Đoán trước: mômen bên phải', text: 'Mômen của lực F₂ (M₂ = F₂·d₂) bằng bao nhiêu?', unit: 'N·m',
        hints: ['M₂ = 60 · 0,4.'], answer: (c) => c.c.F2 * c.c.d2, tol: 0.06, explain: 'M₂ = F₂·d₂ = 60·0,4 = 24 N·m. Lực F₂ làm thanh quay CÙNG chiều kim đồng hồ.'},
      {type: 'choice', title: 'Thanh có cân bằng không?', text: 'F₁ = 40 N và F₂ = 60 N khác nhau, nhưng M₁ = M₂. Thanh sẽ:', options: ['Nghiêng về phía lực lớn hơn (F₂)', 'Nằm cân bằng', 'Nghiêng về phía lực nhỏ hơn (F₁)'], answer: 1,
        wrong: ['Không phải lực lớn hơn quyết định mà là MÔMEN lớn hơn. Hãy so M₁ và M₂.', '', 'Hãy so sánh hai mômen: chúng bằng nhau.'], hints: ['So M₁ với M₂ rồi nhìn bảng “τ_net”.'],
        explain: 'Cân bằng khi M₁ = M₂ (τ_net = 0), dù hai lực khác nhau. Lực nhỏ hơn nhưng cánh tay đòn dài hơn.'},
      {type: 'do', title: 'Phá cân bằng', text: 'Giữ nguyên F₂, d₁, d₂. Tăng F₁ lên 50 N và quan sát thanh quay về phía nào.', hints: ['Kéo thanh F₁ lên 50 N.'], setup: () => act.setCmd({F1: 40, d1: 0.6, F2: 60, d2: 0.4}),
        check: (c) => set(c, 50, 0.6, 60, 0.4) && c.r.theta > 0.05, explain: 'M₁ = 50·0,6 = 30 > M₂ = 24 nên thanh quay theo chiều của M₁ (ngược chiều kim đồng hồ): đầu trái đi xuống.'},
      {type: 'predict', title: 'Đoán trước: tìm cánh tay đòn mới', text: 'F₁ = 50 N, F₂ = 60 N, d₂ = 0,4 m. Phải đặt d₁ bằng bao nhiêu để thanh cân bằng lại?', unit: 'm',
        hints: ['Cân bằng: F₁·d₁ = F₂·d₂.', 'd₁ = 24 / 50.'], setup: () => act.setCmd({F1: 50, d1: 0.6, F2: 60, d2: 0.4}), answer: (c) => (c.c.F2 * c.c.d2) / c.c.F1, tol: 0.012,
        explain: 'd₁ = F₂·d₂/F₁ = 24/50 = 0,48 m. Lực lớn hơn thì cánh tay đòn phải ngắn đi.'},
      {type: 'do', title: 'Kiểm tra bằng thí nghiệm', text: 'Kéo d₁ về đúng 0,48 m. Thanh có cân bằng lại không?', hints: ['Kéo thanh d₁ về 0,48 m (độ chính xác 0,01).'],
        check: (c) => set(c, 50, 0.48, 60, 0.4) && Math.abs(c.c.F1 * c.c.d1 - c.c.F2 * c.c.d2) < 0.5 && Math.abs(c.r.theta) < 0.2, explain: 'Thanh nằm ngang trở lại vì M₁ = M₂ = 24 N·m. Đó là điều kiện cân bằng của vật có trục quay cố định.'},
      {type: 'predict', title: 'Đoán trước: đòn bẩy lợi lực', text: 'Dùng cánh tay đòn d₁ = 0,9 m để nâng vật F₂ = 60 N đặt ở d₂ = 0,3 m. Lực F₁ tối thiểu để cân bằng là bao nhiêu?', unit: 'N',
        hints: ['F₁·0,9 = 60·0,3.'], setup: () => act.setCmd({F1: 40, d1: 0.9, F2: 60, d2: 0.3}), answer: (c) => (c.c.F2 * c.c.d2) / c.c.d1, tol: 0.3,
        explain: 'F₁ = 60·0,3/0,9 = 20 N: chỉ cần lực bằng 1/3 trọng lượng vật. Đây là đòn bẩy cho LỢI về lực (k = d₁/d₂ = 3).'},
      {type: 'do', title: 'Thử lợi về lực', text: 'Đặt F₁ = 20 N, d₁ = 0,9 m, F₂ = 60 N, d₂ = 0,3 m. Xem dòng “Được lợi về lực” trong bảng.', hints: ['F₁ = 20, d₁ = 0,9, F₂ = 60, d₂ = 0,3.'],
        check: (c) => set(c, 20, 0.9, 60, 0.3), explain: 'Lợi về lực nhưng THIỆT về đường đi: đầu trái phải đi xuống quãng đường dài gấp 3 lần quãng đường vật nâng lên.'},
      {type: 'choice', title: 'Lợi về lực khi nào?', text: 'Đòn bẩy cho lợi về lực (dùng lực nhỏ nâng vật nặng) khi:', options: ['Cánh tay đòn của lực tác dụng ngắn hơn cánh tay đòn của vật', 'Cánh tay đòn của lực tác dụng dài hơn cánh tay đòn của vật', 'Hai cánh tay đòn bằng nhau'], answer: 1,
        wrong: ['Ngược lại: cánh tay đòn càng dài thì cần lực càng nhỏ.', '', 'Khi bằng nhau, hai lực cũng bằng nhau: không lợi về lực.'], hints: ['F₁·d₁ = F₂·d₂, muốn F₁ nhỏ thì d₁ phải thế nào?'],
        explain: 'Từ F₁·d₁ = F₂·d₂ suy ra F₁/F₂ = d₂/d₁: d₁ càng lớn thì F₁ càng nhỏ.'},
      {type: 'do', title: 'Bóc tách trục quay', text: 'Bấm TEARDOWN (phím T) để mở hộp trục: vòng bi, trục và cảm biến mômen xoắn.', hints: ['Nút cam “TEARDOWN · BÓC TÁCH CƠ CẤU”.'], check: (c) => c.td > 0.85,
        explain: 'Vòng bi giữ ma sát ở trục rất nhỏ, nên mômen của các lực mới là yếu tố quyết định. Mũi tên cong cho thấy chiều quay của từng mômen.'},
    ],
    quiz: [
      {q: 'Lực 30 N tác dụng cách trục quay 0,4 m (vuông góc với thanh). Mômen của lực là:', options: ['75 N·m', '12 N·m', '0,013 N·m', '30,4 N·m'], answer: 1, explain: 'M = F·d = 30·0,4 = 12 N·m.'},
      {q: 'Cánh tay đòn của một lực đối với trục quay là:', options: ['Chiều dài của thanh', 'Khoảng cách từ trục quay đến điểm đặt lực', 'Khoảng cách vuông góc từ trục quay đến giá của lực', 'Độ lớn của lực'], answer: 2, explain: 'Cánh tay đòn d là khoảng cách từ trục quay đến giá (đường tác dụng) của lực, đo vuông góc.'},
      {q: 'Vật có trục quay cố định cân bằng khi:', options: ['Tổng các lực bằng 0', 'Tổng mômen làm vật quay cùng chiều kim đồng hồ bằng tổng mômen làm quay ngược chiều', 'Hai lực có độ lớn bằng nhau', 'Trục quay ở giữa vật'], answer: 1, explain: 'Điều kiện cân bằng: M thuận = M nghịch. Hai lực không cần bằng nhau (như F₁ = 40 N và F₂ = 60 N ở bài thí nghiệm).'},
      {q: 'Muốn dùng lực nhỏ hơn để giữ cân bằng cùng một vật nặng, ta nên:', options: ['Đặt lực xa trục quay hơn', 'Đặt lực gần trục quay hơn', 'Dùng thanh nhẹ hơn', 'Không thể'], answer: 0, explain: 'Cánh tay đòn lớn hơn thì cần lực nhỏ hơn: F = M/d.'},
      {q: 'Đòn bẩy cho lợi về lực thì:', options: ['Cũng lợi về đường đi', 'Thiệt về đường đi', 'Không đổi đường đi', 'Lợi về công'], answer: 1, explain: 'Lợi bao nhiêu lần về lực thì thiệt bấy nhiêu lần về đường đi: công không đổi.'},
    ],
    summary: [
      'Mômen lực M = F·d (N·m), d là cánh tay đòn: khoảng cách vuông góc từ trục quay đến giá của lực.',
      'Cân bằng của vật có trục quay cố định: M làm quay cùng chiều kim đồng hồ = M làm quay ngược chiều.',
      'Hai lực khác nhau vẫn có thể cân bằng nếu mômen bằng nhau: F₁·d₁ = F₂·d₂.',
      'Đòn bẩy lợi về lực khi cánh tay đòn của lực tác dụng dài hơn, nhưng thiệt về đường đi.',
    ],
  };
}

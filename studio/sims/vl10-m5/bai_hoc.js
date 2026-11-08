// Nội dung bài học M5 (Vật lí 10 KNTT: tổng hợp và phân tích lực, bài thực hành bộ ba lực kế).
// act = {setT(F1, F2, al), setP(F, beta), td()}; ctx = {r: readout đang chạy, t: readout ổn định, c: cmd, mode, td}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m5',
    title: 'Tổng hợp và phân tích lực: thí nghiệm bộ ba lực kế',
    objectives: [
      'Nêu được hợp lực là lực thay thế tác dụng như hai (hoặc nhiều) lực cùng lúc.',
      'Dùng quy tắc hình bình hành để tìm hợp lực; biết |F₁ − F₂| ≤ F ≤ F₁ + F₂.',
      'Giải thích vì sao nút buộc đứng yên: tổng các lực bằng 0 (lực kế 3 đọc đúng độ lớn hợp lực).',
      'Phân tích một lực thành hai thành phần vuông góc: Fx = F·cosβ, Fy = F·sinβ.',
    ],
    steps: [
      {type: 'do', title: 'Đặt thí nghiệm 3 N – 4 N', text: 'Dùng thanh trượt bên phải: đặt F₁ = 3 N, F₂ = 4 N và góc α = 90° (hoặc bấm thí nghiệm mẫu 1).',
        hints: ['Kéo thanh F₁ về 3,0 N và F₂ về 4,0 N.', 'Kéo thanh α về đúng 90°. Hai lực kế đầu sẽ vuông góc với nhau trên thước đo góc.'], setup: () => act.setT(5, 2, 30),
        check: (c) => c.mode === 'T' && near(c.c.F1, 3, 0.1) && near(c.c.F2, 4, 0.1) && near(c.c.al, 90, 1),
        explain: 'Lực kế 1 và 2 kéo nút buộc theo hai hướng vuông góc. Lực kế 3 kéo ngược lại nên nút buộc đứng yên.'},
      {type: 'predict', title: 'Đoán trước: lực kế 3 đọc bao nhiêu?', text: 'Với F₁ = 3 N, F₂ = 4 N, α = 90°: theo em lực kế 3 sẽ đọc bao nhiêu N? Hãy đoán rồi mới nhìn mô phỏng.', unit: 'N',
        hints: ['Hai lực vuông góc: hợp lực là đường chéo của hình chữ nhật.', 'Dùng định lí Pythagoras: F = √(F₁² + F₂²).'], setup: () => act.setT(3, 4, 90),
        answer: (c) => c.t.Rmag, tol: 0.06, explain: 'F = √(3² + 4²) = 5 N. Lực kế 3 đọc đúng độ lớn hợp lực của F₁ và F₂, vì nút buộc cân bằng: F₃ = −(F₁ + F₂).'},
      {type: 'do', title: 'Hai lực cùng hướng (α = 0°)', text: 'Kéo α về 0°. Hợp lực lúc này bằng bao nhiêu? Nhìn lực kế 3.',
        hints: ['Kéo thanh α sang tận bên trái (0°).'], check: (c) => c.mode === 'T' && c.t.al < 2 && c.c.F1 > 0.5 && c.c.F2 > 0.5,
        explain: 'Hai lực cùng hướng: F = F₁ + F₂ = 7 N. Đây là giá trị LỚN NHẤT của hợp lực.'},
      {type: 'do', title: 'Hai lực ngược hướng (α = 180°)', text: 'Kéo α về 180°. Hợp lực lúc này bằng bao nhiêu?',
        hints: ['Kéo thanh α sang tận bên phải (180°).'], check: (c) => c.mode === 'T' && c.t.al > 178 && c.c.F1 > 0.5 && c.c.F2 > 0.5,
        explain: 'Hai lực ngược hướng: F = |F₁ − F₂| = 1 N. Đây là giá trị NHỎ NHẤT. Vậy |F₁ − F₂| ≤ F ≤ F₁ + F₂.'},
      {type: 'predict', title: 'Đoán trước: hợp lực có thể bằng một lực thành phần?', text: 'F₁ = F₂ = 6 N, α = 120°. Hợp lực bằng bao nhiêu N?', unit: 'N',
        hints: ['F² = F₁² + F₂² + 2F₁F₂·cosα', 'cos 120° = −0,5, nên F² = 36 + 36 − 36.'], setup: () => act.setT(6, 6, 120),
        answer: (c) => c.t.Rmag, tol: 0.06, explain: 'F = 6 N: hợp lực bằng đúng mỗi lực thành phần. Đừng nghĩ hợp lực lúc nào cũng lớn hơn các lực thành phần.'},
      {type: 'do', title: 'Bóc tách lực kế', text: 'Bấm nút TEARDOWN (hoặc phím T) để mở vỏ lực kế. Tìm cái lò xo bên trong.',
        hints: ['Nút màu cam “TEARDOWN · BÓC TÁCH LỰC KẾ” ở bảng bên phải.'], check: (c) => c.td > 0.85,
        explain: 'Lực kế đo lực nhờ lò xo: lực càng lớn, lò xo giãn càng dài (F = k·Δl). Kim chỉ trên thang đo cho biết độ giãn đó.'},
      {type: 'predict', title: 'Đoán trước: lò xo giãn bao nhiêu?', text: 'Lực kế 1 kéo F₁ = 10 N, lò xo có k = 200 N/m. Lò xo giãn Δl bao nhiêu cm?', unit: 'cm',
        hints: ['Δl = F / k, nhớ đổi mét sang cm.', '10 / 200 = 0,05 m.'], setup: () => act.setT(10, 4, 90),
        answer: (c) => c.t.m[0].ext * 100, tol: 0.1, explain: 'Δl = F/k = 10/200 = 0,05 m = 5 cm. Em có thể đối chiếu số Δl ở bảng bên trái.'},
      {type: 'do', title: 'Phân tích lực', text: 'Bấm tab “Phân tích lực”, đặt F = 10 N, β = 37°. Hai lực kế còn lại sẽ đọc hai thành phần.',
        hints: ['Bấm tab “Phân tích lực”, rồi kéo F về 10 N và β về 37°.'], setup: () => act.setP(6, 70),
        check: (c) => c.mode === 'P' && near(c.c.F, 10, 0.3) && near(c.c.beta, 37, 2),
        explain: 'Lực kế 2 đọc Fx ≈ 8 N, lực kế 3 đọc Fy ≈ 6 N. Thay một lực F bằng hai lực vuông góc Fx, Fy cho cùng tác dụng.'},
      {type: 'predict', title: 'Đoán trước: thành phần Fx', text: 'F = 10 N, β = 60° so với trục Ox. Thành phần Fx bằng bao nhiêu N?', unit: 'N',
        hints: ['Fx = F·cosβ', 'cos 60° = 0,5.'], setup: () => act.setP(10, 60), answer: (c) => Math.abs(c.t.Fx), tol: 0.06,
        explain: 'Fx = 10·cos60° = 5 N; Fy = 10·sin60° ≈ 8,66 N. Góc càng lớn thì thành phần theo Ox càng nhỏ.'},
    ],
    quiz: [
      {q: 'Hai lực 3 N và 4 N cùng phương, ngược chiều. Hợp lực có độ lớn:', options: ['7 N', '5 N', '1 N', '12 N'], answer: 2, explain: 'Ngược chiều thì trừ độ lớn: 4 − 3 = 1 N. (7 N là trường hợp cùng chiều; 5 N là trường hợp vuông góc.)'},
      {q: 'Hai lực bằng nhau 10 N hợp với nhau góc 120°. Hợp lực có độ lớn:', options: ['20 N', '10 N', '0 N', '14,1 N'], answer: 1, explain: 'F² = 10² + 10² + 2·10·10·cos120° = 100 → F = 10 N. Hợp lực có thể bằng đúng mỗi lực thành phần.'},
      {q: 'Giữ nguyên F₁ và F₂, tăng góc α từ 0° đến 180°. Độ lớn hợp lực:', options: ['Tăng dần', 'Giảm dần', 'Không đổi', 'Tăng rồi giảm'], answer: 1, explain: 'F lớn nhất (F₁ + F₂) khi α = 0°, nhỏ nhất |F₁ − F₂| khi α = 180°, và giảm dần giữa hai giá trị đó.'},
      {q: 'Trong thí nghiệm ba lực kế, nút buộc đứng yên vì:', options: ['Chỉ lực kế 3 đang kéo', 'Tổng ba lực tác dụng lên nút bằng 0', 'Lực kế 3 kéo mạnh nhất', 'Ba lực kế đều đọc cùng một số'], answer: 1, explain: 'Cân bằng nghĩa là F₁ + F₂ + F₃ = 0. Ba lực kế thường đọc các số khác nhau; lực kế 3 chỉ có độ lớn bằng hợp lực của hai lực kia.'},
      {q: 'Lực 20 N hợp với trục Ox góc 30°. Thành phần theo Ox xấp xỉ:', options: ['10 N', '17,3 N', '20 N', '34,6 N'], answer: 1, explain: 'Fx = F·cos30° = 20 × 0,866 ≈ 17,3 N. (10 N là thành phần theo Oy: 20·sin30°.)'},
    ],
    summary: [
      'Hợp lực F của hai lực F₁, F₂ là đường chéo hình bình hành: F² = F₁² + F₂² + 2F₁F₂·cosα.',
      'Giới hạn: |F₁ − F₂| ≤ F ≤ F₁ + F₂ (nhỏ nhất khi α = 180°, lớn nhất khi α = 0°).',
      'Vật (nút buộc) đứng yên khi tổng các lực bằng 0; khi đó lực thứ ba bằng và ngược với hợp lực của hai lực kia.',
      'Phân tích lực: Fx = F·cosβ, Fy = F·sinβ; và F = √(Fx² + Fy²). Lực kế đo lực nhờ lò xo: F = k·Δl.',
    ],
  };
}

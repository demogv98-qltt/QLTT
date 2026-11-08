// Nội dung bài học M14 (khối lượng riêng, áp suất chất lỏng, lực đẩy Acsimet / vật nổi – chìm). ctx = {s: mô hình, r: readout, td}.
// act = {set({liq, h, sol, a}), drop()}.
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m14',
    title: 'Khối lượng riêng và áp suất chất lỏng: bể kính, đầu dò, khối nổi – chìm',
    objectives: [
      'Tính khối lượng riêng ρ = m/V của vật và hiểu ý nghĩa của nó.',
      'Vận dụng công thức áp suất chất lỏng p = ρ·g·h; nhận ra p phụ thuộc độ sâu h và khối lượng riêng ρ của chất lỏng.',
      'Tính lực đẩy Acsimet F_A = ρ_lỏng·g·V_chìm và nêu điều kiện vật nổi, vật chìm (so sánh ρ vật và ρ lỏng).',
    ],
    steps: [
      {type: 'do', title: 'Đưa đầu dò xuống sâu 50 cm', text: 'Bể đang chứa nước. Kéo thanh trượt “h độ sâu đầu dò” đến 50 cm.', hints: ['Thanh trượt h ở bảng bên phải, giá trị 50.'], setup: () => act.set({liq: 0, h: 0.2, sol: 0, a: 0.2}), check: (c) => c.s.liq === 0 && near(c.s.h, 0.5, 0.006), explain: 'Đầu dò ở độ sâu 50 cm tính từ mặt thoáng (thước ghi bên trái bể, vạch 0 ở mặt nước).'},
      {type: 'predict', title: 'Đoán trước: áp suất', text: 'Áp suất do nước gây ra ở độ sâu h là p = ρ·g·h (ρ = 1000 kg/m³, g = 9,8 m/s²). Tính p tại đầu dò.', unit: 'Pa', hints: ['p = 1000·9,8·0,5.'], answer: (c) => c.r.pl, tol: 20, explain: 'p = 1000·9,8·0,5 = 4 900 Pa. Áp kế cũng đọc 4 900 Pa (chưa kể áp suất khí quyển 101 300 Pa).'},
      {type: 'do', title: 'Xuống sâu gấp đôi', text: 'Kéo đầu dò xuống độ sâu 100 cm.', hints: ['Thanh trượt h, giá trị 100.'], check: (c) => near(c.s.h, 1, 0.006), explain: 'Độ sâu tăng từ 50 cm lên 100 cm. Chú ý số đọc p trên bảng bên trái.'},
      {type: 'choice', title: 'Áp suất tăng bao nhiêu?', text: 'Độ sâu tăng gấp đôi, áp suất do nước gây ra tăng:', options: ['Gấp đôi', 'Không đổi', 'Gấp bốn'], answer: 0, wrong: ['', 'Càng xuống sâu càng bị nước đè nặng: áp suất phải tăng.', 'p = ρgh tỉ lệ bậc nhất với h, không phải bình phương.'], hints: ['So sánh 4 900 Pa với giá trị mới.'], explain: 'p tỉ lệ thuận với h: h gấp đôi thì p gấp đôi (9 800 Pa).'},
      {type: 'do', title: 'Đổi sang dầu ăn', text: 'Chọn dầu ăn (ρ = 800 kg/m³) ở bảng bên phải, giữ nguyên độ sâu 100 cm.', hints: ['Nút “Dầu ăn”.'], check: (c) => c.s.liq === 1 && near(c.s.h, 1, 0.006), explain: 'Dầu nhẹ hơn nước nên cùng độ sâu áp suất nhỏ hơn.'},
      {type: 'predict', title: 'Đoán trước: áp suất trong dầu', text: 'Tính áp suất do dầu gây ra ở độ sâu 1 m.', unit: 'Pa', hints: ['p = 800·9,8·1.'], answer: (c) => c.r.pl, tol: 30, explain: 'p = 800·9,8·1 = 7 840 Pa, nhỏ hơn trong nước (9 800 Pa) ở cùng độ sâu.'},
      {type: 'choice', title: 'Áp suất phụ thuộc vào gì?', text: 'Áp suất do chất lỏng gây ra tại một điểm phụ thuộc vào:', options: ['Độ sâu của điểm đó và khối lượng riêng của chất lỏng', 'Tổng thể tích chất lỏng trong bể', 'Hình dạng và diện tích đáy của bể'], answer: 0, wrong: ['', 'Bể to hay nhỏ không quan trọng: công thức p = ρgh không có thể tích.', 'p = ρgh không chứa diện tích đáy hay hình dạng bể.'], hints: ['Nhìn công thức p = ρ·g·h.'], explain: 'p = ρ·g·h chỉ phụ thuộc ρ và h. Đó là lí do đồ thị p–h là các đường thẳng, dốc hơn khi ρ lớn.'},
      {type: 'do', title: 'Thả khối gỗ vào nước', text: 'Chọn nước, khối gỗ cạnh 20 cm rồi bấm “▼ Thả khối”. Chờ khối đứng yên. Hoặc bấm thí nghiệm mẫu 2.', hints: ['Nút Nước, nút Gỗ, rồi “Thả khối”.'], setup: () => act.set({liq: 0, h: 0.5, sol: 0, a: 0.2}), check: (c) => c.s.liq === 0 && c.s.sol === 0 && c.r.settled, explain: 'Khối gỗ nổi, chỉ chìm một phần trong nước.'},
      {type: 'predict', title: 'Tính khối lượng riêng', text: 'Khối gỗ có khối lượng m = 4,8 kg và thể tích V = 8 lít = 0,008 m³ (cạnh 20 cm). Tính ρ = m/V.', unit: 'kg/m³', hints: ['ρ = 4,8/0,008.'], answer: (c) => c.r.m / c.r.V, tol: 6, explain: 'ρ gỗ = 4,8/0,008 = 600 kg/m³, nhỏ hơn ρ nước (1000 kg/m³).'},
      {type: 'predict', title: 'Đoán trước: phần chìm', text: 'Khối nổi cân bằng thì F_A = P, nên phần chìm: a·ρ_vật/ρ_lỏng. Khối gỗ chìm sâu bao nhiêu cm?', unit: 'cm', hints: ['20·600/1000.'], answer: (c) => c.r.eq * 100, tol: 0.5, explain: 'Chìm 12 cm = 60% chiều cao: bằng ρ vật/ρ lỏng = 600/1000. Em đối chiếu với số “chìm” ở bảng bên trái.'},
      {type: 'predict', title: 'Lực đẩy Acsimet khi nổi', text: 'Khối gỗ đứng yên trên mặt nước. Lực đẩy Acsimet F_A bằng trọng lượng P = m·g. Tính F_A.', unit: 'N', hints: ['F_A = 4,8·9,8.'], answer: (c) => c.r.P, tol: 0.5, explain: 'F_A = P = 47 N: hai mũi tên (xanh lục và xanh dương) dài bằng nhau.'},
      {type: 'do', title: 'Thả khối nhôm', text: 'Chọn nhôm (2700 kg/m³), cạnh 20 cm, rồi bấm “▼ Thả khối”. Quan sát.', hints: ['Nút Nhôm rồi “Thả khối”.'], check: (c) => c.s.sol === 2 && c.s.liq === 0 && c.r.settled && c.r.onBottom, explain: 'Nhôm chìm xuống đáy bể. Mũi tên F_A (xanh dương) ngắn hơn trọng lượng P (xanh lục).'},
      {type: 'choice', title: 'Vì sao nhôm chìm?', text: 'Vì sao khối nhôm chìm còn khối gỗ nổi?', options: ['Vì nhôm có khối lượng riêng lớn hơn nước', 'Vì nhôm luôn nặng hơn gỗ', 'Vì nhôm có hình dạng khác gỗ'], answer: 0, wrong: ['', 'Chìm hay nổi không phải do “nặng hay nhẹ” tuyệt đối: tàu thép rất nặng vẫn nổi, còn hòn sỏi nhỏ lại chìm. Quan trọng là ρ vật so với ρ lỏng.', 'Hai khối ở đây cùng là hình lập phương cạnh 20 cm; khác nhau là khối lượng riêng.'], hints: ['So sánh 2700 với 1000.'], explain: 'Điều kiện: ρ vật < ρ lỏng thì nổi, ρ vật > ρ lỏng thì chìm, bằng nhau thì lơ lửng.'},
      {type: 'predict', title: 'Trọng lượng biểu kiến', text: 'Khối nhôm ngập hoàn toàn: P − F_A = (ρ_vật − ρ_lỏng)·V·g. Đây là lực nén xuống đáy bể. Tính giá trị đó.', unit: 'N', hints: ['(2700 − 1000)·0,008·9,8.'], answer: (c) => c.r.apparent, tol: 1, explain: 'P − F_A ≈ 133 N. Nếu treo nhôm vào lực kế trong nước, lực kế chỉ 133 N thay vì 212 N ngoài không khí.'},
      {type: 'do', title: 'Nước đá trong dầu', text: 'Chọn dầu ăn và khối nước đá (920 kg/m³), cạnh 20 cm. Thả khối và quan sát.', hints: ['Nút Dầu ăn, nút Nước đá, “Thả khối”.'], setup: () => act.set({liq: 1, h: 0.5, sol: 0, a: 0.2}), check: (c) => c.s.liq === 1 && c.s.sol === 1 && c.r.settled && c.r.onBottom, explain: 'Nước đá (920) nhẹ hơn nước (1000) nên nổi trên nước, nhưng nặng hơn dầu (800) nên chìm trong dầu. Chìm hay nổi phụ thuộc vào chất lỏng nữa.'},
      {type: 'do', title: 'Bóc tách bể', text: 'Bấm TEARDOWN (phím T): xem đầu dò, màng đo áp suất, thành bể.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Màng cam của đầu dò bị chất lỏng ép vào từ mọi phía với cùng áp suất (các mũi tên xanh dương dài bằng nhau): áp suất chất lỏng tác dụng theo mọi phương.'},
    ],
    quiz: [
      {q: 'Khối sắt có m = 7,8 kg và V = 1 lít (0,001 m³). Khối lượng riêng của sắt là:', options: ['780 kg/m³', '7 800 kg/m³', '7,8 kg/m³', '78 000 kg/m³'], answer: 1, explain: 'ρ = m/V = 7,8/0,001 = 7 800 kg/m³.'},
      {q: 'Áp suất do nước (ρ = 1000 kg/m³) gây ra ở độ sâu 2 m là (g = 9,8 m/s²):', options: ['1 960 Pa', '9 800 Pa', '19 600 Pa', '98 000 Pa'], answer: 2, explain: 'p = ρ·g·h = 1000·9,8·2 = 19 600 Pa.'},
      {q: 'Ở cùng độ sâu, áp suất trong dầu (800 kg/m³) so với trong nước (1000 kg/m³):', options: ['Lớn hơn', 'Nhỏ hơn', 'Bằng nhau', 'Không so sánh được'], answer: 1, explain: 'p = ρgh: cùng h, ρ nhỏ hơn nên p nhỏ hơn.'},
      {q: 'Khối gỗ 600 kg/m³ nổi trên nước. Phần thể tích chìm trong nước chiếm:', options: ['40%', '60%', '100%', '600%'], answer: 1, explain: 'Phần chìm = ρ vật/ρ lỏng = 600/1000 = 60%.'},
      {q: 'Vật chìm xuống đáy khi:', options: ['Vật có khối lượng lớn', 'Khối lượng riêng của vật lớn hơn khối lượng riêng chất lỏng', 'Thể tích của vật nhỏ', 'Lực đẩy Acsimet bằng 0'], answer: 1, explain: 'ρ vật > ρ lỏng nên F_A < P: vật chìm.'},
    ],
    summary: [
      'Khối lượng riêng ρ = m/V (kg/m³).',
      'Áp suất do chất lỏng gây ra p = ρ·g·h, tăng theo độ sâu, tác dụng theo mọi phương; không phụ thuộc hình dạng bể.',
      'Lực đẩy Acsimet F_A = ρ_lỏng·g·V_chìm hướng lên.',
      'ρ vật < ρ lỏng: nổi (F_A = P); ρ vật > ρ lỏng: chìm; bằng nhau: lơ lửng.',
    ],
  };
}

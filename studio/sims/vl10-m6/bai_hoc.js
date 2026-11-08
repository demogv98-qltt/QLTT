// Nội dung bài học M6 (Vật lí 10 KNTT: ba định luật Newton). ctx = {s: mô hình, r: readout, mode, td}.
// act = {setN2(F, M), setN3(M1, M2, F0), reset()}.
import {ideal} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m6',
    title: 'Ba định luật Newton: xe quạt và hai xe đẩy nhau',
    objectives: [
      'Phát biểu và vận dụng định luật 2: a = F/M (gia tốc tỉ lệ thuận với lực, tỉ lệ nghịch với khối lượng).',
      'Giải thích định luật 1: khi hợp lực bằng 0, vật giữ nguyên vận tốc (quán tính).',
      'Nêu được đặc điểm cặp lực – phản lực của định luật 3: cùng độ lớn, ngược chiều, đặt vào hai vật khác nhau.',
      'Dùng khối lượng để so sánh mức quán tính: cùng lực thì vật nhẹ hơn có gia tốc lớn hơn.',
    ],
    steps: [
      {type: 'do', title: 'Đặt xe quạt', text: 'Ở tab “Định luật 1–2”, đặt lực đẩy F = 4 N và khối lượng M = 2 kg.',
        hints: ['Kéo thanh F về 4,0 và thanh M về 2.'], setup: () => act.setN2(7, 5), check: (c) => c.s.mode === 'N2' && near(c.s.F, 4, 0.05) && near(c.s.M, 2, 0.05),
        explain: 'Quạt đẩy không khí ra sau, không khí đẩy xe tới với lực 4 N. Xe nặng 2 kg (1 kg xe + 1 kg quả nặng).'},
      {type: 'predict', title: 'Đoán trước: gia tốc', text: 'Theo định luật 2, xe sẽ có gia tốc bao nhiêu?', unit: 'm/s²',
        hints: ['a = F / M', 'a = 4 / 2.'], answer: (c) => ideal.a(c.s.F, c.s.M), tol: 0.06, explain: 'a = F/M = 4/2 = 2 m/s². Gia tốc cùng hướng với lực.'},
      {type: 'do', title: 'Chạy xe 3 giây', text: 'Bấm “Chạy” và đợi đồng hồ t đến 3 s. Đọc vận tốc ở bảng bên trái.',
        hints: ['Bấm nút ▶ Chạy; xe tăng tốc đều.'], setup: () => act.reset(), check: (c) => c.s.mode === 'N2' && c.s.t >= 2.95,
        explain: 'v = a·t = 2·3 = 6 m/s. Đồ thị v–t là đường thẳng đi lên: lực không đổi nên gia tốc không đổi.'},
      {type: 'predict', title: 'Đoán trước: xe nặng gấp đôi', text: 'Giữ F = 4 N nhưng tăng khối lượng lên M = 4 kg. Gia tốc bây giờ là bao nhiêu?', unit: 'm/s²',
        hints: ['Cùng lực, khối lượng gấp đôi thì gia tốc thế nào?', 'a = 4 / 4.'], setup: () => act.setN2(4, 4), answer: (c) => ideal.a(c.s.F, c.s.M), tol: 0.06,
        explain: 'a = 1 m/s²: khối lượng càng lớn thì xe càng “lì”, càng khó thay đổi vận tốc. Khối lượng đo mức quán tính. Xem đồ thị a–F: đường M = 4 kg dốc ít hơn.'},
      {type: 'do', title: 'Tắt quạt khi xe đang chạy', text: 'Đặt F = 6 N, M = 2 kg, bấm Chạy; khi xe đã chạy nhanh (v > 1 m/s) hãy bấm “Tắt quạt”.',
        hints: ['Bấm Chạy, chờ vài giây rồi bấm nút “⏻ Tắt quạt”.'], setup: () => act.setN2(6, 2),
        check: (c) => c.s.mode === 'N2' && !c.s.fan && c.s.v > 1, explain: 'Quạt tắt, hợp lực bằng 0. Hãy nhìn bảng: gia tốc a = 0.'},
      {type: 'choice', title: 'Xe sẽ ra sao?', text: 'Quạt đã tắt và bỏ qua ma sát. Vận tốc của xe sau đó:', options: ['Giảm dần vì không còn lực đẩy', 'Giữ nguyên, xe chuyển động thẳng đều', 'Tăng dần nhờ quán tính'], answer: 1,
        wrong: ['Đó là quan niệm sai phổ biến: lực không cần để DUY TRÌ chuyển động, lực chỉ cần để THAY ĐỔI vận tốc.', '', 'Quán tính giữ nguyên vận tốc, không làm vận tốc tăng.'],
        hints: ['Hãy nhìn gia tốc a và vận tốc v ở bảng bên trái sau khi tắt quạt.'], explain: 'Định luật 1: khi hợp lực bằng 0, vật đang chuyển động giữ nguyên vận tốc (thẳng đều). Đó là quán tính.'},
      {type: 'do', title: 'Sang định luật 3', text: 'Bấm tab “Định luật 3: hai xe”. Có hai xe với một lò xo ép ở giữa.', hints: ['Tab thứ hai ở bảng bên phải.'], setup: () => act.setN3(1, 2, 20), check: (c) => c.s.mode === 'N3',
        explain: 'Lò xo sẽ đẩy cả hai xe ra xa nhau. Hãy xem lực đặt lên mỗi xe.'},
      {type: 'predict', title: 'Đoán trước: tốc độ xe 1', text: 'Xe 1 nặng 1 kg, xe 2 nặng 2 kg. Lò xo đẩy mỗi xe với lực 20 N trong 0,2 s. Xe 1 sẽ có tốc độ bao nhiêu sau khi tách ra?', unit: 'm/s',
        hints: ['a = F/M, rồi v = a·Δt.', 'a₁ = 20/1 = 20 m/s²; v₁ = 20·0,2.'], answer: (c) => ideal.v1(c.s.F0, c.s.M1), tol: 0.06, explain: 'v₁ = F·Δt/M₁ = 20·0,2/1 = 4 m/s (xe 1 chạy sang trái).'},
      {type: 'do', title: 'Cho lò xo bật', text: 'Bấm “Chạy”. Quan sát hai mũi tên lực và hai cảm biến lực (nếu muốn, bấm TEARDOWN).', hints: ['Bấm nút ▶ Chạy.'], setup: () => act.reset(),
        check: (c) => c.s.mode === 'N3' && c.s.c.phase !== 'ready' && c.s.c.t > 0.6,
        explain: 'Hai mũi tên lực CÙNG ĐỘ LỚN (20 N) và NGƯỢC CHIỀU, nhưng đặt vào HAI XE KHÁC NHAU nên không triệt tiêu nhau.'},
      {type: 'predict', title: 'Đoán trước: tốc độ xe 2', text: 'Còn xe 2 (2 kg) thì sao? Tốc độ của nó sau khi tách ra là bao nhiêu (chỉ nhập độ lớn)?', unit: 'm/s',
        hints: ['Cùng lực, cùng thời gian, khối lượng gấp đôi.'], answer: (c) => ideal.v2(c.s.F0, c.s.M2), tol: 0.06, explain: 'v₂ = 20·0,2/2 = 2 m/s (sang phải). Xe 1 bay nhanh gấp đôi vì nhẹ bằng một nửa.'},
      {type: 'choice', title: 'Vì sao xe 1 nhanh hơn?', text: 'Hai xe nhận lực cùng độ lớn, nhưng xe 1 chạy nhanh gấp đôi xe 2 vì:', options: ['Lực tác dụng lên xe 1 lớn hơn', 'Xe 1 nhẹ hơn nên gia tốc lớn hơn', 'Lực – phản lực không bằng nhau'], answer: 1,
        wrong: ['Hai cảm biến lực đọc cùng một số: lực đặt lên hai xe bằng nhau.', '', 'Định luật 3: lực và phản lực luôn bằng nhau về độ lớn.'], hints: ['So sánh a₁ = F/M₁ và a₂ = F/M₂.'],
        explain: 'F bằng nhau, a = F/M nên xe nhẹ hơn có gia tốc lớn hơn. Chú ý cả hai xe có p₁ + p₂ = 0: tổng động lượng không đổi (sẽ học ở bài Động lượng).'},
    ],
    quiz: [
      {q: 'Xe có khối lượng 3 kg chịu hợp lực 6 N. Gia tốc của xe là:', options: ['18 m/s²', '2 m/s²', '0,5 m/s²', '9 m/s²'], answer: 1, explain: 'a = F/M = 6/3 = 2 m/s².'},
      {q: 'Khi hợp lực tác dụng lên vật bằng 0, vật:', options: ['Nhất định đứng yên', 'Dừng lại sau một thời gian', 'Đứng yên hoặc chuyển động thẳng đều', 'Chuyển động nhanh dần'], answer: 2, explain: 'Định luật 1: giữ nguyên trạng thái đứng yên hoặc chuyển động thẳng đều.'},
      {q: 'Lực và phản lực trong định luật 3 Newton:', options: ['Cùng đặt vào một vật và cân bằng nhau', 'Đặt vào hai vật khác nhau, cùng độ lớn, ngược chiều', 'Có độ lớn khác nhau nếu vật nặng, vật nhẹ khác nhau', 'Triệt tiêu nhau'], answer: 1, explain: 'Cặp lực – phản lực đặt vào HAI vật khác nhau nên không thể triệt tiêu nhau.'},
      {q: 'Xe 1 kg và xe 2 kg được lò xo đẩy ra bằng lực như nhau. Gia tốc xe 1 so với xe 2 là:', options: ['Bằng nhau', 'Gấp đôi', 'Bằng một nửa', 'Gấp bốn'], answer: 1, explain: 'a = F/M: cùng F, M nhỏ một nửa thì a gấp đôi.'},
      {q: 'Khối lượng của một vật là đại lượng đặc trưng cho:', options: ['Tác dụng của trọng lực', 'Mức quán tính của vật', 'Thể tích của vật', 'Vận tốc của vật'], answer: 1, explain: 'Khối lượng là số đo mức quán tính: càng lớn thì càng khó thay đổi vận tốc.'},
    ],
    summary: [
      'Định luật 2: a = F/M (cùng hướng với hợp lực). Cùng lực, vật nặng gấp đôi thì gia tốc giảm một nửa.',
      'Định luật 1: hợp lực bằng 0 thì vật đứng yên hoặc chuyển động thẳng đều. Lực không cần để duy trì chuyển động.',
      'Định luật 3: lực và phản lực cùng độ lớn, ngược chiều, đặt vào hai vật KHÁC nhau, nên không cân bằng nhau.',
      'Khối lượng đo mức quán tính của vật.',
    ],
  };
}

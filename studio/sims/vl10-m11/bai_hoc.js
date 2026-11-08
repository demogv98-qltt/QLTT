// Nội dung bài học M11 (Vật lí 10 KNTT: động lượng và định luật bảo toàn động lượng, va chạm). ctx = {s: mô hình, r: readout, td}.
// act = {set({m1, m2, v1, v2, e}), reset()}.
import {after} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const is = (c, m1, m2, v1, v2, e) => near(c.s.m1, m1, 0.05) && near(c.s.m2, m2, 0.05) && near(c.s.v1, v1, 0.05) && near(c.s.v2, v2, 0.05) && near(c.s.e, e, 0.02);
  const done = (c) => c.r.hit && c.s.t >= c.r.tc + 0.5;
  return {
    code: 'vl10-m11',
    title: 'Động lượng và va chạm: hai xe trên đệm không khí',
    objectives: [
      'Tính động lượng p = m·v (có hướng, đơn vị kg·m/s) và động lượng của hệ.',
      'Phát biểu và vận dụng định luật bảo toàn động lượng cho hệ kín: p trước = p sau.',
      'Phân biệt va chạm mềm (hai vật dính nhau) và va chạm đàn hồi.',
      'Biết rằng động lượng luôn bảo toàn còn động năng chỉ bảo toàn khi va chạm đàn hồi.',
    ],
    steps: [
      {type: 'do', title: 'Va chạm mềm', text: 'Đặt m₁ = 2 kg, v₁ = 3 m/s, m₂ = 1 kg, v₂ = 0 và e = 0 (hai xe sẽ dính nhau). Hoặc bấm thí nghiệm mẫu 1.', hints: ['Bấm “Va chạm mềm (dính)” ở bảng bên phải.'], setup: () => act.set({m1: 1, m2: 2, v1: 1, v2: -1, e: 0.5}), check: (c) => is(c, 2, 1, 3, 0, 0),
        explain: 'Xe 2 kg chạy 3 m/s đâm vào xe 1 kg đứng yên. Mặt tiếp xúc có miếng dính nên hai xe sẽ dính vào nhau.'},
      {type: 'predict', title: 'Đoán trước: động lượng của hệ', text: 'Động lượng của hệ hai xe trước va chạm là p = m₁v₁ + m₂v₂ bằng bao nhiêu?', unit: 'kg·m/s', hints: ['p = 2·3 + 1·0.'], answer: (c) => c.s.m1 * c.s.v1 + c.s.m2 * c.s.v2, tol: 0.05, explain: 'p = 6 kg·m/s. Hệ hai xe là hệ kín (bỏ qua ma sát) nên p được bảo toàn.'},
      {type: 'predict', title: 'Đoán trước: vận tốc sau va chạm', text: 'Sau va chạm hai xe dính nhau, cùng vận tốc v′. Bảo toàn động lượng: (m₁ + m₂)v′ = p. Tìm v′.', unit: 'm/s', hints: ['v′ = 6/(2 + 1).'], answer: (c) => (c.s.m1 * c.s.v1 + c.s.m2 * c.s.v2) / (c.s.m1 + c.s.m2), tol: 0.05, explain: 'v′ = 6/3 = 2 m/s.'},
      {type: 'do', title: 'Cho hai xe va chạm', text: 'Bấm “Chạy” và quan sát đồ thị: p₁ giảm, p₂ tăng, nhưng tổng p (đường đen) không đổi.', hints: ['Bấm ▶ Chạy; va chạm xảy ra sau khoảng 2,4 s.'], setup: () => act.reset(), check: (c) => is(c, 2, 1, 3, 0, 0) && done(c), explain: 'Hai xe dính nhau, chạy với 2 m/s đúng như em tính. Tổng động lượng trước và sau đều là 6 kg·m/s.'},
      {type: 'predict', title: 'Đoán trước: động năng mất đi', text: 'Động năng trước va chạm là ½·2·3² = 9 J. Sau va chạm là ½·3·2² = 6 J. Động năng đã mất bao nhiêu?', unit: 'J', hints: ['9 − 6.'], answer: (c) => 0.5 * c.s.m1 * c.s.v1 ** 2 + 0.5 * c.s.m2 * c.s.v2 ** 2 - 0.5 * (c.s.m1 + c.s.m2) * ((c.s.m1 * c.s.v1 + c.s.m2 * c.s.v2) / (c.s.m1 + c.s.m2)) ** 2, tol: 0.1, explain: 'Mất 3 J: biến thành nhiệt và biến dạng chỗ dính. Va chạm mềm không bảo toàn động năng.'},
      {type: 'choice', title: 'Đại lượng nào bảo toàn?', text: 'Trong va chạm mềm vừa rồi:', options: ['Cả động lượng và động năng đều bảo toàn', 'Động lượng bảo toàn, động năng giảm', 'Động năng bảo toàn, động lượng giảm'], answer: 1, wrong: ['Động năng đã giảm từ 9 J xuống 6 J.', '', 'Động lượng tổng luôn bằng 6 kg·m/s: nó là đại lượng bảo toàn.'], hints: ['So sánh p và Wđ ở bảng bên trái trước và sau.'], explain: 'Động lượng của hệ kín luôn bảo toàn. Động năng chỉ bảo toàn trong va chạm đàn hồi.'},
      {type: 'do', title: 'Va chạm đàn hồi', text: 'Đặt m₁ = m₂ = 1 kg, v₁ = 2 m/s, v₂ = 0 và e = 1 (đệm lò xo, không mất năng lượng). Hoặc bấm thí nghiệm mẫu 2.', hints: ['Bấm “Va chạm đàn hồi, khối bằng nhau”.'], setup: () => act.set({m1: 2, m2: 1, v1: 3, v2: 0, e: 0}), check: (c) => is(c, 1, 1, 2, 0, 1), explain: 'Hai xe cùng khối lượng, đệm lò xo.'},
      {type: 'predict', title: 'Đoán trước: sau va chạm đàn hồi', text: 'Hai xe cùng khối lượng va chạm đàn hồi, xe 2 ban đầu đứng yên. Vận tốc v₂′ của xe 2 sau va chạm là bao nhiêu?', unit: 'm/s', hints: ['Động lượng và động năng cùng bảo toàn: xe 1 dừng lại, xe 2 lấy hết.'], answer: (c) => after(c.s).v2, tol: 0.05, explain: 'v₁′ = 0 và v₂′ = 2 m/s: xe 1 trao toàn bộ động lượng cho xe 2 (như quả cầu Newton).'},
      {type: 'do', title: 'Chạy thử', text: 'Bấm “Chạy” và so sánh đồ thị động năng tổng với lần va chạm mềm: lần này nó không giảm.', hints: ['Bấm ▶ Chạy.'], setup: () => act.reset(), check: (c) => is(c, 1, 1, 2, 0, 1) && done(c), explain: 'Động năng tổng trước và sau đều là 2 J: va chạm đàn hồi bảo toàn cả p và Wđ.'},
      {type: 'predict', title: 'Đoán trước: xe nặng đâm xe nhẹ', text: 'm₁ = 3 kg, v₁ = 2 m/s va chạm đàn hồi với m₂ = 1 kg đứng yên. Vận tốc v₂′ của xe nhẹ là bao nhiêu?', unit: 'm/s', hints: ['v₂′ = 2m₁v₁/(m₁ + m₂).', 'v₂′ = 2·3·2/4.'], setup: () => act.set({m1: 3, m2: 1, v1: 2, v2: 0, e: 1}), answer: (c) => after(c.s).v2, tol: 0.05, explain: 'v₂′ = 12/4 = 3 m/s, còn v₁′ = (3 − 1)·2/4 = 1 m/s. Xe nhẹ bị đẩy đi nhanh hơn xe nặng ban đầu.'},
      {type: 'do', title: 'Bóc tách xe', text: 'Bấm TEARDOWN (phím T): xem đệm lò xo, miếng dính và cảm biến tốc độ.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Đệm lò xo nén rồi trả lại năng lượng (va chạm đàn hồi); miếng dính làm hai xe dính nhau và biến một phần động năng thành nhiệt (va chạm mềm).'},
    ],
    quiz: [
      {q: 'Xe 2 kg chạy với vận tốc 5 m/s có động lượng là:', options: ['2,5 kg·m/s', '10 kg·m/s', '25 kg·m/s', '7 kg·m/s'], answer: 1, explain: 'p = m·v = 2·5 = 10 kg·m/s.'},
      {q: 'Hệ kín thì động lượng của hệ:', options: ['Tăng dần', 'Giảm dần', 'Bảo toàn', 'Bằng 0'], answer: 2, explain: 'Định luật bảo toàn động lượng: tổng động lượng của hệ kín không đổi.'},
      {q: 'Xe 3 kg chạy 4 m/s đâm vào xe 1 kg đứng yên rồi dính nhau. Vận tốc chung sau va chạm là:', options: ['4 m/s', '3 m/s', '1 m/s', '12 m/s'], answer: 1, explain: 'v′ = (3·4)/(3 + 1) = 3 m/s.'},
      {q: 'Trong va chạm mềm:', options: ['Cả p và Wđ đều bảo toàn', 'p bảo toàn, Wđ giảm', 'Wđ bảo toàn, p giảm', 'Cả hai đều giảm'], answer: 1, explain: 'p luôn bảo toàn; một phần động năng biến thành nhiệt và biến dạng.'},
      {q: 'Hai xe có khối lượng bằng nhau va chạm đàn hồi, xe 2 ban đầu đứng yên. Sau va chạm:', options: ['Hai xe cùng đứng yên', 'Xe 1 dừng lại, xe 2 chạy với vận tốc của xe 1 ban đầu', 'Hai xe dính nhau', 'Xe 1 bật ngược lại'], answer: 1, explain: 'Với m₁ = m₂, v₂ = 0, e = 1: v₁′ = 0 và v₂′ = v₁.'},
    ],
    summary: [
      'Động lượng p = m·v (vectơ, kg·m/s). Hệ kín: tổng động lượng trước = tổng động lượng sau.',
      'Va chạm mềm: hai vật dính nhau, v′ = (m₁v₁ + m₂v₂)/(m₁ + m₂); mất một phần động năng.',
      'Va chạm đàn hồi: bảo toàn cả động lượng và động năng.',
      'Mọi va chạm trong hệ kín đều bảo toàn động lượng.',
    ],
  };
}
void 0;

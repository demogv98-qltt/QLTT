// Nội dung bài học M1 (Vật lí 10 KNTT: độ dịch chuyển, quãng đường, tốc độ, vận tốc). ctx = {s: mô hình, r: readout, td}.
// act = {script(i), reset(), manual(v)}.
import {scriptAt} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m1',
    title: 'Độ dịch chuyển và vận tốc: xe thử nghiệm',
    objectives: [
      'Phân biệt quãng đường s (luôn dương) và độ dịch chuyển d (có dấu, đo từ vị trí đầu đến vị trí cuối).',
      'Tính vận tốc trung bình v_tb = d/t và tốc độ trung bình = s/t; biết khi nào chúng khác nhau.',
      'Đọc đồ thị độ dịch chuyển – thời gian: độ dốc của đồ thị chính là vận tốc.',
      'Nhận ra vận tốc có hướng (dấu + hoặc −) còn tốc độ thì không.',
    ],
    steps: [
      {type: 'do', title: 'Chạy xe đều', text: 'Bấm “Ví dụ 1: đi đều 4 m/s” rồi bấm Chạy cho tới khi t ≥ 5 s.', hints: ['Bấm ví dụ 1 ở bảng bên phải; xe tự chạy.'], setup: () => act.script(0, false), check: (c) => c.s.mode === 'script' && c.s.script === 0 && c.s.t >= 4.95,
        explain: 'Xe chạy đều theo chiều dương với vận tốc 4 m/s.'},
      {type: 'predict', title: 'Đoán trước: độ dịch chuyển', text: 'Xe chạy đều với vận tốc 4 m/s. Sau 5 s, độ dịch chuyển d bằng bao nhiêu mét?', unit: 'm', hints: ['d = v·t', 'd = 4·5.'], answer: () => scriptAt(0, 5).x, tol: 0.1,
        explain: 'd = v·t = 4·5 = 20 m. Em có thể đối chiếu với đồ thị d–t: đường thẳng đi lên.'},
      {type: 'predict', title: 'Đoán trước: độ dốc đồ thị', text: 'Đồ thị d–t của xe là đường thẳng. Độ dốc của nó (Δd/Δt) bằng bao nhiêu m/s?', unit: 'm/s', hints: ['Độ dốc = Δd/Δt, ví dụ (20 − 0)/(5 − 0).'], answer: () => 4, tol: 0.1,
        explain: 'Độ dốc = 20/5 = 4 m/s đúng bằng vận tốc. Đồ thị dốc hơn nghĩa là xe chạy nhanh hơn.'},
      {type: 'do', title: 'Xe quay đầu', text: 'Bấm “Ví dụ 3: đi tới rồi quay lại” và cho xe chạy hết (t = 12 s). Quan sát đồ thị d–t và các “ảnh xe”.', hints: ['Bấm ví dụ 3; chờ đến khi t = 12 s.'], setup: () => act.script(2, false), check: (c) => c.s.script === 2 && c.s.t >= 11.9,
        explain: 'Xe đi tới rồi lùi đúng bằng quãng đã đi, nên quay về chỗ xuất phát.'},
      {type: 'predict', title: 'Đoán trước: độ dịch chuyển cả chuyến', text: 'Sau 12 s xe quay về đúng chỗ xuất phát. Độ dịch chuyển d bằng bao nhiêu?', unit: 'm', hints: ['d = vị trí cuối − vị trí đầu.'], answer: () => scriptAt(2, 12).x, tol: 0.1,
        explain: 'd = 0: vị trí cuối trùng vị trí đầu. Độ dịch chuyển không quan tâm đường đi.'},
      {type: 'predict', title: 'Đoán trước: quãng đường', text: 'Còn quãng đường s xe đã đi trong 12 s là bao nhiêu mét?', unit: 'm', hints: ['Đi 6 s với 5 m/s, rồi 6 s với 5 m/s (ngược chiều).'], answer: () => scriptAt(2, 12).s, tol: 0.1,
        explain: 's = 30 + 30 = 60 m. Quãng đường cộng dồn cả lúc đi và lúc lùi nên luôn không âm và lớn hơn |d|.'},
      {type: 'choice', title: 'Vận tốc trung bình cả chuyến', text: 'Với chuyến đi tới rồi quay lại này (d = 0, s = 60 m, t = 12 s), vận tốc trung bình v_tb = d/t bằng:', options: ['5 m/s', '0 m/s', '60 m/s'], answer: 1,
        wrong: ['5 m/s là TỐC ĐỘ trung bình (s/t), không phải vận tốc trung bình.', '', 'Nhầm lẫn: 60 m là quãng đường.'], hints: ['v_tb = d/t, mà d = 0.'], explain: 'v_tb = 0/12 = 0 m/s còn tốc độ trung bình = 60/12 = 5 m/s. Vận tốc có hướng nên đi rồi về bù trừ nhau; tốc độ thì không.'},
      {type: 'do', title: 'Đo vận tốc trung bình trong một khoảng', text: 'Chọn Ví dụ 2 (đi – dừng – về), chạy tới hết (13 s). Kéo t₁ = 5 s và t₂ = 8 s để đo vận tốc trung bình khi xe đứng yên.', hints: ['Bấm ví dụ 2, chờ tới t = 13 s, rồi kéo t₁ về 5 và t₂ về 8.'], setup: () => act.script(1, false),
        check: (c) => c.s.script === 1 && c.s.t >= 12.9 && near(c.s.t1, 5, 0.15) && near(c.s.t2, 8, 0.15), explain: 'Trong khoảng 5–8 s xe đứng yên nên Δd = 0 và v_tb = 0. Đoạn nằm ngang trên đồ thị d–t cho thấy vận tốc bằng 0.'},
      {type: 'predict', title: 'Đoán trước: vận tốc lúc lùi', text: 'Ví dụ 2: sau t = 8 s xe lùi với vận tốc −2 m/s trong 5 s. Độ dịch chuyển trong giai đoạn lùi này (từ t = 8 s đến 13 s) là bao nhiêu?', unit: 'm', hints: ['Δd = v·Δt = (−2)·5.'], answer: () => scriptAt(1, 13).x - scriptAt(1, 8).x, tol: 0.1,
        explain: 'Δd = −2·5 = −10 m. Dấu âm: xe dịch chuyển ngược chiều dương. Đồ thị d–t đi xuống.'},
      {type: 'do', title: 'Bóc tách xe', text: 'Bấm TEARDOWN (phím T): tìm đĩa mã hoá đo vòng quay bánh xe.', hints: ['Nút cam “TEARDOWN” ở bảng bên phải.'], check: (c) => c.td > 0.85,
        explain: 'Cảm biến đếm xung khi đĩa quay; biết bán kính bánh xe, máy tính ra quãng đường, rồi chia cho thời gian để có tốc độ.'},
    ],
    quiz: [
      {q: 'Xe đi 3 m về phía đông rồi 3 m về phía tây. Độ dịch chuyển và quãng đường lần lượt là:', options: ['6 m và 0 m', '0 m và 6 m', '0 m và 0 m', '6 m và 6 m'], answer: 1, explain: 'd = vị trí cuối − vị trí đầu = 0; s = 3 + 3 = 6 m.'},
      {q: 'Độ dịch chuyển khác quãng đường ở chỗ:', options: ['Độ dịch chuyển luôn lớn hơn', 'Độ dịch chuyển có hướng và chỉ phụ thuộc vị trí đầu, cuối', 'Quãng đường có hướng', 'Hai đại lượng luôn bằng nhau'], answer: 1, explain: 'Độ dịch chuyển là đại lượng có hướng; quãng đường là đại lượng không âm, cộng dồn theo đường đi.'},
      {q: 'Vận tốc trung bình bằng:', options: ['Quãng đường chia thời gian', 'Độ dịch chuyển chia thời gian', 'Vận tốc đầu cộng vận tốc cuối', 'Thời gian chia độ dịch chuyển'], answer: 1, explain: 'v_tb = d/t (có hướng). Quãng đường chia thời gian là tốc độ trung bình.'},
      {q: 'Trên đồ thị d–t, đoạn nằm ngang cho biết vật:', options: ['Chuyển động nhanh', 'Đứng yên', 'Chuyển động lùi', 'Có gia tốc'], answer: 1, explain: 'Độ dốc = 0 nghĩa là vận tốc bằng 0: vật đứng yên.'},
      {q: 'Xe đi 100 m trong 20 s rồi quay về đúng chỗ cũ trong 30 s. Vận tốc trung bình của cả chuyến là:', options: ['4 m/s', '0 m/s', '5 m/s', '−4 m/s'], answer: 1, explain: 'd = 0 nên v_tb = 0. (Tốc độ trung bình = 200/50 = 4 m/s.)'},
    ],
    summary: [
      'Độ dịch chuyển d = vị trí cuối − vị trí đầu (có dấu). Quãng đường s cộng dồn mọi đoạn đường (không âm).',
      'Vận tốc trung bình v_tb = d/t (có hướng) ; tốc độ trung bình = s/t (không hướng).',
      'Độ dốc đồ thị d–t là vận tốc: dốc lên v > 0, nằm ngang v = 0, dốc xuống v < 0.',
      'Khi vật đổi chiều thì s lớn hơn |d|.',
    ],
  };
}

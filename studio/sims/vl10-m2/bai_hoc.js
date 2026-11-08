// Nội dung bài học M2 (Vật lí 10 KNTT: chuyển động thẳng biến đổi đều). ctx = {s: mô hình, r: readout, c: {v0, a, t}, td}.
// act = {set(v0, a), reset()}.
import {dAt, sAt, vAt} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m2',
    title: 'Chuyển động thẳng biến đổi đều: xe thử nghiệm',
    objectives: [
      'Dùng công thức v = v₀ + at và d = v₀t + ½at² để tính vận tốc, độ dịch chuyển.',
      'Đọc đồ thị v–t: độ dốc là gia tốc, diện tích dưới đồ thị là độ dịch chuyển.',
      'Phân biệt nhanh dần đều và chậm dần đều bằng dấu của v và a.',
      'Phân biệt độ dịch chuyển d và quãng đường s khi vật đổi chiều chuyển động.',
    ],
    steps: [
      {type: 'do', title: 'Xe tăng tốc từ nghỉ', text: 'Đặt vận tốc ban đầu v₀ = 0 và gia tốc a = 2 m/s² bằng hai thanh trượt.',
        hints: ['Kéo thanh v₀ về 0 và thanh a về 2,0.'], setup: () => act.set(5, -1), check: (c) => near(c.c.v0, 0, 0.05) && near(c.c.a, 2, 0.05),
        explain: 'Xe xuất phát từ nghỉ và tăng tốc đều 2 m/s²: cứ mỗi giây vận tốc tăng thêm 2 m/s.'},
      {type: 'predict', title: 'Đoán trước: vận tốc sau 5 s', text: 'Với v₀ = 0 và a = 2 m/s², sau 5 s vận tốc của xe là bao nhiêu?', unit: 'm/s',
        hints: ['v = v₀ + a·t', 'v = 0 + 2·5.'], answer: (c) => vAt(c.s, 5), tol: 0.06, explain: 'v = v₀ + a·t = 0 + 2·5 = 10 m/s.'},
      {type: 'do', title: 'Chạy xe đến t = 5 s', text: 'Bấm “Chạy” (hoặc kéo thanh thời gian) cho tới t = 5 s. Quan sát các “ảnh xe” mỗi giây.',
        hints: ['Bấm nút ▶ Chạy rồi chờ đồng hồ t đến 5 s.'], setup: () => act.reset(), check: (c) => c.c.t >= 4.9,
        explain: 'Đọc bảng bên trái: v = 10 m/s đúng như em đoán. Các ảnh xe cách nhau xa dần vì xe nhanh dần.'},
      {type: 'predict', title: 'Đoán trước: quãng đường 5 s', text: 'Xe đã đi được bao nhiêu mét trong 5 s đầu?', unit: 'm',
        hints: ['d = v₀t + ½at²', 'Hoặc tính diện tích tam giác dưới đồ thị v–t (đáy 5 s, cao 10 m/s).'], answer: (c) => dAt(c.s, 5), tol: 0.3,
        explain: 'd = ½·a·t² = ½·2·25 = 25 m. Đây cũng là diện tích tam giác dưới đồ thị v–t: ½·5·10 = 25.'},
      {type: 'do', title: 'Phanh xe', text: 'Đặt v₀ = 10 m/s và a = −2 m/s² (xe đang chạy rồi phanh).',
        hints: ['Kéo v₀ lên 10 và a xuống −2,0.'], check: (c) => near(c.c.v0, 10, 0.05) && near(c.c.a, -2, 0.05),
        explain: 'v và a ngược dấu nên xe chuyển động chậm dần đều: vận tốc giảm 2 m/s mỗi giây.'},
      {type: 'predict', title: 'Đoán trước: khi nào xe dừng?', text: 'Sau bao nhiêu giây thì xe dừng hẳn?', unit: 's',
        hints: ['Xe dừng khi v = 0.', '0 = v₀ + a·t → t = −v₀/a.'], answer: (c) => -c.s.v0 / c.s.a, tol: 0.06,
        explain: 't = −v₀/a = −10/(−2) = 5 s. Trên đồ thị v–t, đường thẳng cắt trục thời gian tại t = 5 s.'},
      {type: 'do', title: 'Xe quay đầu', text: 'Đặt v₀ = 10 m/s, a = −3 m/s², rồi chạy đến t = 10 s. Xe sẽ đi tới, dừng, rồi chạy lùi.',
        hints: ['Đặt v₀ = 10, a = −3, bấm Đặt lại rồi Chạy.', 'Xem các ảnh xe: chúng đi tới rồi quay lại.'], setup: () => act.reset(),
        check: (c) => near(c.c.v0, 10, 0.05) && near(c.c.a, -3, 0.05) && c.c.t >= 9.9,
        explain: 'Xe dừng lúc t ≈ 3,33 s (v = 0) rồi chạy theo chiều âm. Vì a vẫn âm và v bây giờ cũng âm nên xe NHANH dần.'},
      {type: 'predict', title: 'Đoán trước: độ dịch chuyển', text: 'Lúc t = 10 s, độ dịch chuyển d của xe so với gốc O là bao nhiêu mét? (dấu − nghĩa là ở phía sau gốc O)', unit: 'm',
        hints: ['d = v₀t + ½at²', 'd = 10·10 + ½·(−3)·100.'], answer: (c) => dAt(c.s, 10), tol: 0.6,
        explain: 'd = 100 − 150 = −50 m: xe đang ở cách gốc O 50 m, phía sau gốc.'},
      {type: 'predict', title: 'Đoán trước: quãng đường', text: 'Tổng quãng đường s mà xe đã chạy trong 10 s là bao nhiêu mét? (gợi ý: đi tới rồi mới lùi)', unit: 'm',
        hints: ['Tới điểm quay đầu cách O: 10·3,33 − ½·3·3,33² ≈ 16,7 m.', 'Rồi lùi từ 16,7 m về −50 m: 66,7 m.'], answer: (c) => sAt(c.s, 10), tol: 0.6,
        explain: 's = 16,7 + 66,7 ≈ 83,3 m, KHÁC |d| = 50 m. Khi vật đổi chiều thì quãng đường lớn hơn độ lớn độ dịch chuyển.'},
      {type: 'do', title: 'Bóc tách xe', text: 'Bấm TEARDOWN (phím T) để mở vỏ xe. Tìm đĩa mã hoá và cảm biến quang trên trục sau.',
        hints: ['Nút cam “TEARDOWN · BÓC TÁCH XE” ở bảng bên phải.'], check: (c) => c.td > 0.85,
        explain: 'Đĩa có 24 khe quay cùng bánh xe; cảm biến quang đếm xung. Biết số xung và bán kính bánh xe, máy tính ra quãng đường d, rồi vận tốc tức thời.'},
    ],
    quiz: [
      {q: 'Xe có v₀ = 0 và a = 2 m/s². Sau 4 s vận tốc là:', options: ['4 m/s', '8 m/s', '2 m/s', '16 m/s'], answer: 1, explain: 'v = v₀ + at = 0 + 2·4 = 8 m/s.'},
      {q: 'Chuyển động thẳng chậm dần đều khi:', options: ['Gia tốc a < 0', 'Vận tốc và gia tốc ngược dấu', 'Vận tốc bằng 0', 'Gia tốc bằng 0'], answer: 1, explain: 'Cái quyết định là dấu của v so với a. Nếu xe chạy theo chiều âm (v < 0) mà a < 0 thì xe vẫn nhanh dần.'},
      {q: 'Trên đồ thị v–t, diện tích giới hạn bởi đồ thị và trục thời gian cho biết:', options: ['Gia tốc', 'Vận tốc ban đầu', 'Độ dịch chuyển', 'Thời gian chuyển động'], answer: 2, explain: 'Diện tích dưới đồ thị v–t bằng độ dịch chuyển (phần dưới trục thời gian tính là âm).'},
      {q: 'Xe có v₀ = 10 m/s, a = −2 m/s². Quãng đường xe đi được cho đến khi dừng là:', options: ['5 m', '10 m', '25 m', '50 m'], answer: 2, explain: 'v² − v₀² = 2ad → 0 − 100 = 2·(−2)·d → d = 25 m.'},
      {q: 'Độ dốc của tiếp tuyến với đồ thị d–t tại một thời điểm cho biết:', options: ['Gia tốc', 'Vận tốc tức thời', 'Quãng đường', 'Thời gian'], answer: 1, explain: 'Độ dốc của đồ thị d–t là vận tốc; độ dốc của đồ thị v–t mới là gia tốc.'},
    ],
    summary: [
      'v = v₀ + a·t ;  d = v₀·t + ½·a·t² ;  v² − v₀² = 2·a·d.',
      'Độ dốc đồ thị v–t = gia tốc; diện tích dưới đồ thị v–t = độ dịch chuyển; độ dốc đồ thị d–t = vận tốc.',
      'Nhanh dần đều: v và a cùng dấu. Chậm dần đều: v và a ngược dấu.',
      'Độ dịch chuyển d có dấu; quãng đường s luôn dương và lớn hơn |d| nếu vật đổi chiều.',
    ],
  };
}

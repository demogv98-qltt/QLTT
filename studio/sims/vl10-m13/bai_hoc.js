// Nội dung bài học M13 (Vật lí 10 KNTT: biến dạng của lò xo, định luật Hooke). ctx = {s: mô hình, r: readout, td}.
// act = {set({sp, n})}: chọn lò xo, số quả nặng, xoá bảng số liệu.
import {G, M_W, SPRINGS} from './physics.js';
export function makeLesson(act) {
  const ok = (c) => c.r.settled;
  return {
    code: 'vl10-m13',
    title: 'Định luật Hooke: lò xo treo, quả nặng và thước đo',
    objectives: [
      'Đo độ giãn Δl của lò xo bằng thước khi treo các quả nặng và tính trọng lực F = m·g.',
      'Phát biểu định luật Hooke: trong giới hạn đàn hồi, F = k·Δl; vẽ và nhận xét đồ thị F theo Δl.',
      'Tính độ cứng k = F/Δl và so sánh lò xo cứng với lò xo mềm.',
      'Nhận biết giới hạn đàn hồi: vượt quá giới hạn, lò xo không trở về chiều dài ban đầu.',
    ],
    steps: [
      {type: 'do', title: 'Treo quả nặng vào lò xo A', text: 'Chọn lò xo A (k = 20 N/m) rồi bấm “+” hai lần để treo 2 quả nặng (200 g).', hints: ['Nút A ở bảng bên phải, rồi bấm + hai lần.'], setup: () => act.set({sp: 0, n: 0}), check: (c) => c.s.sp === 0 && c.s.n === 2 && ok(c), explain: 'Lò xo giãn ra, kim cam chỉ độ giãn Δl trên thước (vạch 0 là vị trí kim khi chưa treo gì).'},
      {type: 'predict', title: 'Đoán trước: lực kéo lò xo', text: 'Lực kéo lò xo chính là trọng lượng của quả nặng: F = m·g (lấy g = 9,8 m/s²). Tính F.', unit: 'N', hints: ['m = 0,2 kg.'], answer: (c) => c.r.m * G, tol: 0.03, explain: 'F = 0,2·9,8 = 1,96 N. Bảng số liệu hiện F = 1,96 N.'},
      {type: 'predict', title: 'Đoán trước: độ giãn', text: 'Theo định luật Hooke F = k·Δl. Với k = 20 N/m, độ giãn Δl bằng bao nhiêu cm?', unit: 'cm', hints: ['Δl = F/k = 1,96/20 (m), rồi đổi ra cm.'], answer: (c) => (c.r.F / c.r.k) * 100, tol: 0.2, explain: 'Δl = 1,96/20 = 0,098 m = 9,8 cm. Em hãy so với số kim cam chỉ trên thước.'},
      {type: 'do', title: 'Thu thập số liệu', text: 'Bấm “＋ Ghi số liệu” cho các lần treo 1, 2, 3, 4 và 5 quả nặng (mỗi lần thêm 1 quả, chờ kim đứng yên rồi ghi).', hints: ['Bấm + để thêm 1 quả, đợi kim đứng yên, bấm “Ghi số liệu”. Lặp lại.'], check: (c) => new Set(c.s.rows.map((q) => q.n)).size >= 5, explain: 'Bảng có 5 dòng. Chú ý cột F/Δl: các giá trị gần như bằng nhau (= 20 N/m).'},
      {type: 'predict', title: 'Tính độ cứng k', text: 'Từ bảng số liệu, độ cứng k = F/Δl (cột cuối, đổi Δl ra mét) bằng bao nhiêu?', unit: 'N/m', hints: ['Lấy một dòng bất kì: 1,96 N / 0,098 m.'], answer: (c) => c.r.k, tol: 0.5, explain: 'k = 20 N/m: mỗi 1 N kéo thêm làm lò xo giãn thêm 5 cm. k là độ cứng của lò xo.'},
      {type: 'choice', title: 'Lực gấp đôi', text: 'Treo gấp đôi số quả nặng (lực kéo gấp đôi), độ giãn Δl của lò xo sẽ:', options: ['Không đổi', 'Gấp đôi', 'Gấp bốn'], answer: 1, wrong: ['Treo thêm nặng thì lò xo phải giãn thêm; xem bảng số liệu.', '', 'Δl tỉ lệ thuận với F (bậc nhất), không phải bình phương.'], hints: ['So sánh dòng n = 2 và n = 4 trong bảng.'], explain: 'Δl tỉ lệ thuận với F: F gấp đôi thì Δl gấp đôi.'},
      {type: 'choice', title: 'Dạng đồ thị F theo Δl', text: 'Nhìn đồ thị các chấm cam: đồ thị F theo Δl có dạng nào?', options: ['Đường thẳng đi qua gốc toạ độ', 'Đường parabol', 'Đường thẳng nằm ngang'], answer: 0, wrong: ['', 'Parabol là khi F tỉ lệ với bình phương (như lực hướng tâm theo ω). Ở đây các chấm thẳng hàng.', 'Đường ngang nghĩa là F không đổi khi Δl đổi; không đúng.'], hints: ['Các chấm cam nằm trên một đường như thế nào?'], explain: 'Đường thẳng qua gốc: F = k·Δl, hệ số góc chính là độ cứng k.'},
      {type: 'do', title: 'Đổi sang lò xo cứng', text: 'Chọn lò xo C (k = 100 N/m) và treo 3 quả nặng. Hoặc bấm thí nghiệm mẫu 2.', hints: ['Nút C, rồi + ba lần.'], setup: () => act.set({sp: 2, n: 0}), check: (c) => c.s.sp === 2 && c.s.n === 3 && ok(c), explain: 'Cùng 300 g nhưng lò xo C giãn rất ít.'},
      {type: 'predict', title: 'Đoán trước: độ giãn lò xo C', text: 'Tính Δl của lò xo C (k = 100 N/m) khi treo 3 quả nặng.', unit: 'cm', hints: ['F = 0,3·9,8 = 2,94 N; Δl = F/k.'], answer: (c) => (c.r.F / c.r.k) * 100, tol: 0.15, explain: 'Δl = 2,94/100 = 0,0294 m ≈ 2,9 cm, nhỏ hơn nhiều so với lò xo A (14,7 cm).'},
      {type: 'choice', title: 'Lò xo cứng hơn', text: 'Cùng một lực kéo, lò xo có độ cứng k lớn hơn sẽ giãn:', options: ['Nhiều hơn', 'Ít hơn', 'Như nhau'], answer: 1, wrong: ['Δl = F/k: k lớn thì Δl nhỏ.', '', 'Độ cứng khác nhau thì độ giãn khác nhau; so sánh lò xo A và C ở trên.'], hints: ['Δl = F/k.'], explain: 'Δl = F/k, k càng lớn lò xo càng cứng, giãn càng ít.'},
      {type: 'predict', title: 'Giới hạn đàn hồi', text: 'Lò xo A chỉ tuân theo định luật Hooke khi F ≤ 6 N (giới hạn đàn hồi). Có thể treo tối đa bao nhiêu quả nặng 100 g (số nguyên) mà vẫn trong giới hạn?', unit: 'quả', setup: () => act.set({sp: 0, n: 0}), hints: ['F = n·0,1·9,8 ≤ 6.'], answer: () => Math.floor(SPRINGS[0].Flim / (M_W * G)), tol: 0.01, explain: '6 quả: F = 5,88 N ≤ 6 N. Quả thứ 7 (6,86 N) đã vượt giới hạn.'},
      {type: 'do', title: 'Quá tải lò xo', text: 'Treo 8 quả nặng vào lò xo A (F = 7,84 N > 6 N) và quan sát độ giãn.', hints: ['Bấm + tám lần, hoặc thí nghiệm mẫu 3.'], check: (c) => c.s.sp === 0 && c.s.n === 8 && c.r.over && ok(c), explain: 'Lò xo giãn nhiều hơn mức Hooke dự đoán (7,84/20 = 39 cm, thực tế giãn hơn 48 cm).'},
      {type: 'do', title: 'Bỏ hết quả nặng', text: 'Bấm “−” cho đến khi không còn quả nặng nào. Lò xo có trở về vạch 0 không?', hints: ['Bấm − tám lần.'], check: (c) => c.s.n === 0 && c.r.over && ok(c) && c.r.x > 0.05, explain: 'Lò xo không trở về vạch 0: nó đã bị giãn vĩnh viễn vì vượt quá giới hạn đàn hồi.'},
      {type: 'choice', title: 'Giới hạn đàn hồi là gì?', text: 'Giới hạn đàn hồi của lò xo là:', options: ['Lực kéo lớn nhất mà lò xo vẫn trở về chiều dài ban đầu khi bỏ lực', 'Chiều dài tối đa của lò xo', 'Độ cứng lớn nhất của lò xo'], answer: 0, wrong: ['', 'Giới hạn đàn hồi nói về độ lớn lực/biến dạng, không phải chiều dài tối đa.', 'Độ cứng k là hằng số của lò xo, không phải giới hạn đàn hồi.'], hints: ['Vừa rồi sau khi bỏ quả nặng lò xo không về vạch 0.'], explain: 'Trong giới hạn đàn hồi, lò xo trở về chiều dài ban đầu khi bỏ lực; vượt quá thì bị biến dạng vĩnh viễn và không còn tuân theo F = k·Δl.'},
      {type: 'do', title: 'Bóc tách giá treo', text: 'Bấm TEARDOWN (phím T): xem thanh treo, đĩa đặt quả nặng và kẹp giữ lò xo.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Quả nặng xếp lên đĩa của thanh treo; lực kéo lò xo bằng tổng trọng lượng các quả nặng (bỏ qua khối lượng thanh treo).'},
    ],
    quiz: [
      {q: 'Lò xo k = 40 N/m chịu lực kéo 2 N (trong giới hạn đàn hồi). Độ giãn là:', options: ['2 cm', '5 cm', '20 cm', '80 cm'], answer: 1, explain: 'Δl = F/k = 2/40 = 0,05 m = 5 cm.'},
      {q: 'Treo vật 300 g vào lò xo, lò xo giãn 6 cm. Lấy g = 10 m/s². Độ cứng của lò xo là:', options: ['5 N/m', '18 N/m', '50 N/m', '180 N/m'], answer: 2, explain: 'F = 0,3·10 = 3 N; k = F/Δl = 3/0,06 = 50 N/m.'},
      {q: 'Đồ thị lực F theo độ giãn Δl của lò xo (trong giới hạn đàn hồi) là:', options: ['Đường thẳng qua gốc toạ độ', 'Đường cong parabol', 'Đường thẳng song song với trục Δl', 'Đường hyperbol'], answer: 0, explain: 'F = k·Δl: tỉ lệ thuận nên đồ thị là đường thẳng qua gốc, hệ số góc k.'},
      {q: 'Hai lò xo chịu cùng một lực. Lò xo X giãn 2 cm, lò xo Y giãn 6 cm. Lò xo nào cứng hơn?', options: ['Lò xo X, k gấp 3 lần', 'Lò xo Y, k gấp 3 lần', 'Hai lò xo cứng như nhau', 'Không so sánh được'], answer: 0, explain: 'k = F/Δl. Cùng F, Δl nhỏ hơn 3 lần nên k lớn hơn 3 lần.'},
      {q: 'Khi kéo lò xo vượt quá giới hạn đàn hồi rồi thả ra, lò xo:', options: ['Luôn trở về chiều dài ban đầu', 'Không còn trở về chiều dài ban đầu', 'Co ngắn hơn ban đầu', 'Có k tăng gấp đôi'], answer: 1, explain: 'Vượt giới hạn đàn hồi lò xo bị biến dạng vĩnh viễn.'},
    ],
    summary: [
      'Trọng lượng quả nặng F = m·g là lực kéo lò xo.',
      'Trong giới hạn đàn hồi: F = k·Δl. Độ giãn tỉ lệ thuận với lực; đồ thị F–Δl là đường thẳng qua gốc.',
      'Độ cứng k = F/Δl (N/m): k lớn thì lò xo cứng, giãn ít.',
      'Vượt quá giới hạn đàn hồi, lò xo bị biến dạng vĩnh viễn và không còn tuân theo định luật Hooke.',
    ],
  };
}

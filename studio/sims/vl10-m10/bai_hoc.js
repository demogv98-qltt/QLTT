// Nội dung bài học M10 (Vật lí 10 KNTT: công, năng lượng, cơ năng, công suất, hiệu suất). ctx = {s: mô hình, r: readout, td}.
// act = {setE({m, L, th0, b}), setW({mw, P, eta}), reset()}.
import {ideal} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m10',
    title: 'Công, cơ năng, công suất và hiệu suất: con lắc và tời điện',
    objectives: [
      'Tính thế năng Wt = mgh, động năng Wđ = ½mv² và cơ năng W = Wđ + Wt.',
      'Giải thích sự bảo toàn cơ năng khi chỉ có trọng lực, và sự giảm cơ năng khi có lực cản.',
      'Tính công A = F·s·cosα, công suất P = A/t.',
      'Tính hiệu suất H = A_ích/A_tp và giải thích vì sao H < 100%.',
    ],
    steps: [
      {type: 'do', title: 'Chuẩn bị con lắc', text: 'Ở tab “Con lắc · cơ năng”, đặt m = 2 kg, ℓ = 2 m, góc thả α₀ = 40°, lực cản b = 0.', hints: ['Kéo các thanh m, ℓ, α₀ và b theo số đã cho.'], setup: () => act.setE({m: 1, L: 1.5, th0: 20, b: 0.3}),
        check: (c) => c.s.mode === 'E' && near(c.s.m, 2, 0.05) && near(c.s.L, 2, 0.05) && near(c.s.th0, 40, 0.5) && c.s.b === 0, explain: 'Quả nặng được giữ ở góc 40° (chưa thả). Mốc thế năng lấy ở vị trí thấp nhất.'},
      {type: 'predict', title: 'Đoán trước: thế năng lúc thả', text: 'Ở vị trí thả, quả nặng cao hơn điểm thấp nhất h = ℓ(1 − cos40°). Thế năng Wt của nó (g = 9,8 m/s²) là bao nhiêu?', unit: 'J',
        hints: ['Wt = m·g·h, với h = 2·(1 − cos40°) ≈ 0,468 m.', 'Wt = 2·9,8·0,468.'], answer: (c) => ideal.Wmax(c.s.m, c.s.L, c.s.th0), tol: 0.1, explain: 'Wt = mgh ≈ 2·9,8·0,468 ≈ 9,17 J. Lúc thả, v = 0 nên toàn bộ cơ năng là thế năng.'},
      {type: 'predict', title: 'Đoán trước: tốc độ ở điểm thấp nhất', text: 'Không có lực cản nên cơ năng bảo toàn: toàn bộ thế năng ban đầu biến thành động năng ở điểm thấp nhất. Tốc độ v tại đó là bao nhiêu?', unit: 'm/s',
        hints: ['½mv² = mgh₀ → v = √(2gh₀).', 'v = √(2·9,8·0,468).'], answer: (c) => ideal.vmax(c.s.L, c.s.th0), tol: 0.06, explain: 'v = √(2gh₀) ≈ 3,03 m/s. Khối lượng m triệt tiêu: quả nặng nhẹ hay nặng đều qua điểm thấp nhất với cùng tốc độ.'},
      {type: 'do', title: 'Thả con lắc và đo bằng cổng quang', text: 'Bấm “Thả”. Cổng quang ở điểm thấp nhất sẽ đo tốc độ khi quả nặng đi qua.', hints: ['Bấm nút ▶ Thả, chờ quả nặng đi qua điểm thấp nhất.'], setup: () => act.reset(), check: (c) => c.s.vGate !== null,
        explain: 'Cổng quang đo v ≈ 3,03 m/s, đúng như em tính. Nhìn đồ thị: Wt giảm thì Wđ tăng, còn tổng W là đường nằm ngang.'},
      {type: 'choice', title: 'Ở điểm cao nhất', text: 'Khi quả nặng lên tới vị trí cao nhất rồi dừng lại tức thời (v = 0), động năng Wđ bằng:', options: ['Cực đại', 'Bằng 0: toàn bộ cơ năng là thế năng', 'Bằng thế năng Wt'], answer: 1,
        wrong: ['Ngược lại: động năng cực đại ở điểm THẤP nhất.', '', 'Tại đó Wt cực đại còn Wđ = 0 nên hai đại lượng không bằng nhau.'], hints: ['Wđ = ½mv², v = 0.'], explain: 'Ở hai biên v = 0 nên Wđ = 0 và W = Wt cực đại. Ở điểm thấp nhất h = 0 nên Wt = 0 và W = Wđ.'},
      {type: 'do', title: 'Thêm lực cản không khí', text: 'Đặt b = 0,25 và thả lại. Quan sát đồ thị W theo thời gian trong khoảng 8 giây.', hints: ['Kéo b về 0,25, bấm “Đặt lại” rồi “Thả”.'], setup: () => act.reset(), check: (c) => near(c.s.b, 0.25, 0.03) && c.s.released && c.s.t > 6,
        explain: 'Biên độ giảm dần và đường W đi xuống: cơ năng không còn bảo toàn.'},
      {type: 'choice', title: 'Cơ năng đã đi đâu?', text: 'Phần cơ năng mất đi khi có lực cản biến thành:', options: ['Biến mất hoàn toàn', 'Nhiệt (làm nóng không khí) do công của lực cản', 'Thế năng của sợi dây'], answer: 1, wrong: ['Năng lượng không tự mất đi, chỉ chuyển hóa sang dạng khác.', '', 'Dây không tích lũy thêm thế năng.'],
        hints: ['Năng lượng toàn phần được bảo toàn, kể cả nhiệt.'], explain: 'Công của lực cản làm giảm cơ năng, phần mất đi hóa thành nhiệt. Tổng mọi dạng năng lượng vẫn không đổi.'},
      {type: 'do', title: 'Sang tời điện', text: 'Bấm tab “Tời · công suất”. Tời kéo tải lên cao nhờ một động cơ điện.', hints: ['Tab thứ hai ở bảng bên phải.'], check: (c) => c.s.mode === 'W', explain: 'Động cơ nhận điện năng, truyền qua hộp số tới tang quấn cáp. Hộp số tỏa nhiệt nên không phải điện năng nào cũng thành công có ích.'},
      {type: 'do', title: 'Đặt thông số tời', text: 'Đặt khối lượng tải m = 10 kg, công suất điện P = 200 W, hiệu suất η = 80%.', hints: ['Kéo m về 10, P về 200 và η về 80%.'], setup: () => act.setW({mw: 4, P: 100, eta: 0.6}), check: (c) => c.s.mode === 'W' && near(c.s.mw, 10, 0.5) && near(c.s.P, 200, 5) && near(c.s.eta, 0.8, 0.01),
        explain: 'Công suất có ích của tời là η·P = 160 W.'},
      {type: 'predict', title: 'Đoán trước: tốc độ nâng', text: 'Tải nâng đều nên lực kéo bằng trọng lượng mg. Công suất có ích η·P = F·v = mg·v. Tốc độ nâng v là bao nhiêu?', unit: 'm/s',
        hints: ['v = η·P/(m·g)', 'v = 160/(10·9,8).'], answer: (c) => ideal.vw(c.s.P, c.s.eta, c.s.mw), tol: 0.03, explain: 'v = 160/98 ≈ 1,63 m/s.'},
      {type: 'do', title: 'Chạy tời', text: 'Bấm “Chạy” và để tải lên cao hơn 1 m.', hints: ['Bấm nút ▶ Chạy.'], setup: () => act.reset(), check: (c) => c.s.mode === 'W' && c.s.h >= 1.0, explain: 'Quan sát bảng: A_tp = P·t tăng đều, A_ích = mgh nhỏ hơn A_tp.'},
      {type: 'predict', title: 'Đoán trước: công có ích', text: 'Để nâng tải 10 kg lên cao 2 m, công có ích A_ích = m·g·h là bao nhiêu?', unit: 'J', hints: ['A = mgh = 10·9,8·2.'], answer: (c) => ideal.Aich(c.s.mw, 2), tol: 1, explain: 'A_ích = 10·9,8·2 = 196 J (chính là thế năng tải thu được).'},
      {type: 'predict', title: 'Đoán trước: công toàn phần', text: 'Hiệu suất η = 80%. Công toàn phần A_tp mà động cơ phải thực hiện để nâng 2 m là bao nhiêu?', unit: 'J', hints: ['H = A_ích/A_tp → A_tp = A_ích/H.', 'A_tp = 196/0,8.'], answer: (c) => ideal.Aich(c.s.mw, 2) / c.s.eta, tol: 1.5,
        explain: 'A_tp = 196/0,8 = 245 J. Hao phí 49 J biến thành nhiệt trong hộp số: H = 196/245 = 80% < 100%.'},
      {type: 'do', title: 'Bóc tách tời', text: 'Bấm TEARDOWN (phím T): mở hộp số và động cơ. Chú ý quầng nhiệt màu cam: đó là phần công hao phí.', hints: ['Nút cam “TEARDOWN” ở bảng bên phải.'], check: (c) => c.td > 0.85,
        explain: 'Bánh răng nhỏ (động cơ) truyền cho bánh răng lớn (tang). Ma sát ở các răng và ổ trục sinh nhiệt, nên hiệu suất luôn nhỏ hơn 100%.'},
    ],
    quiz: [
      {q: 'Lực 50 N kéo vật đi 4 m theo hướng của lực. Công của lực là:', options: ['12,5 J', '54 J', '200 J', '0 J'], answer: 2, explain: 'A = F·s·cosα = 50·4·cos0° = 200 J.'},
      {q: 'Cơ năng của vật được bảo toàn khi:', options: ['Có ma sát lớn', 'Chỉ có trọng lực (hoặc lực thế) tác dụng, bỏ qua lực cản', 'Vật chuyển động nhanh', 'Vật đứng yên'], answer: 1, explain: 'Khi chỉ có lực thế (như trọng lực) sinh công thì Wđ + Wt không đổi.'},
      {q: 'Vật 2 kg ở độ cao 3 m so với mặt đất (g = 9,8 m/s², mốc ở mặt đất). Thế năng của vật:', options: ['6 J', '58,8 J', '19,6 J', '29,4 J'], answer: 1, explain: 'Wt = mgh = 2·9,8·3 = 58,8 J.'},
      {q: 'Công suất 100 W nghĩa là:', options: ['Thực hiện công 100 J trong 1 giây', 'Thực hiện công 100 J trong 100 giây', 'Lực tác dụng là 100 N', 'Vật đi được 100 m'], answer: 0, explain: 'P = A/t: 1 W = 1 J/s.'},
      {q: 'Hiệu suất H = A_ích/A_tp luôn nhỏ hơn 100% vì:', options: ['A_ích luôn bằng 0', 'Một phần công bị hao phí (nhiệt do ma sát…)', 'A_tp nhỏ hơn A_ích', 'Do đo sai'], answer: 1, explain: 'Một phần năng lượng bị chuyển thành nhiệt (hao phí) nên công có ích luôn nhỏ hơn công toàn phần.'},
    ],
    summary: [
      'Wt = mgh ; Wđ = ½mv² ; cơ năng W = Wđ + Wt. Không có lực cản: W không đổi.',
      'Có lực cản: cơ năng giảm, phần mất đi biến thành nhiệt (công của lực cản).',
      'Công A = F·s·cosα ; công suất P = A/t (1 W = 1 J/s).',
      'Hiệu suất H = A_ích/A_tp < 1 vì có hao phí.',
    ],
  };
}

// Nội dung bài học M3 (Vật lí 10 KNTT: sự rơi tự do). ctx = {s: mô hình, r: readout, td}. act = {set({H, air}), reset()}.
import {ideal} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  const both = (c) => c.s.lands[0] !== null && c.s.lands[1] !== null;
  return {
    code: 'vl10-m3',
    title: 'Sự rơi tự do: ống Newton và bơm chân không',
    objectives: [
      'Nêu được rơi tự do là chuyển động chỉ chịu tác dụng của trọng lực; mọi vật rơi cùng gia tốc g ≈ 9,8 m/s² (không phụ thuộc khối lượng).',
      'Giải thích vì sao trong không khí vật nhẹ có thể rơi chậm hơn: do lực cản của không khí.',
      'Tính thời gian rơi t = √(2h/g), vận tốc chạm đất v = √(2gh) và quãng đường s = ½gt².',
      'Đo gia tốc rơi tự do bằng g = 2h/t².',
    ],
    steps: [
      {type: 'do', title: 'Thả trong không khí', text: 'Ống đang chứa không khí. Bấm “Thả” (hoặc thí nghiệm mẫu “Trong không khí”) và chờ cả hai vật chạm đáy.', hints: ['Bấm nút cam “⏏ Thả”. Có thể chỉnh tốc độ ×0,25 để xem chậm.'], setup: () => act.set({H: 2, air: true}),
        check: (c) => c.s.air && c.s.pAtRelease > 0.9 && both(c), explain: 'Bi thép chạm đáy sau khoảng 0,64 s, còn lông chim mất hơn 1,3 s.'},
      {type: 'choice', title: 'Vì sao khác nhau?', text: 'Trong không khí, lông chim rơi chậm hơn bi thép. Nguyên nhân là:', options: ['Vật nặng hơn thì rơi nhanh hơn', 'Lực cản của không khí tác dụng lên lông chim đáng kể so với trọng lượng của nó', 'Trọng lực tác dụng lên lông chim nhỏ hơn rất nhiều'], answer: 1,
        wrong: ['Đây là quan niệm sai phổ biến từ thời cổ đại. Hãy xem thí nghiệm trong chân không ở bước sau.', '', 'Trọng lực nhỏ hơn thật, nhưng gia tốc tạo ra vẫn như nhau (g). Cái khác biệt là lực cản.'], hints: ['Khi hút hết không khí, điều gì xảy ra?'],
        explain: 'Lông chim nhẹ, diện tích lớn nên lực cản không khí so với trọng lượng rất lớn: nó nhanh chóng đạt vận tốc giới hạn khoảng 1,6 m/s.'},
      {type: 'do', title: 'Hút chân không rồi thả', text: 'Bấm “Hút chân không”, chờ kim áp suất về gần 0 (vài giây), rồi bấm “Thả”.', hints: ['Nút “⏻ Hút chân không” ở bảng bên phải; nhìn ô p ở bảng trái giảm về 0.'], setup: () => act.reset(),
        check: (c) => c.s.pAtRelease !== null && c.s.pAtRelease < 0.03 && both(c), explain: 'Trong chân không bi thép và lông chim chạm đáy CÙNG LÚC (0,639 s).'},
      {type: 'choice', title: 'Kết luận', text: 'Khi không có lực cản, các vật có khối lượng khác nhau rơi:', options: ['Vật nặng chạm đất trước', 'Cùng một lúc, cùng gia tốc g', 'Vật nhẹ chạm đất trước'], answer: 1, wrong: ['Thí nghiệm vừa rồi cho thấy chúng chạm đáy cùng lúc.', '', 'Thí nghiệm vừa rồi cho thấy chúng chạm đáy cùng lúc.'], hints: ['Nhìn các “ảnh” mỗi 0,1 s của bi và lông chim.'],
        explain: 'Rơi tự do là chuyển động thẳng nhanh dần đều với gia tốc g ≈ 9,8 m/s², như nhau với mọi vật.'},
      {type: 'predict', title: 'Đoán trước: thời gian rơi', text: 'Thả từ độ cao h = 2 m trong chân không (g = 9,8 m/s²). Thời gian rơi t là bao nhiêu?', unit: 's', hints: ['h = ½·g·t² → t = √(2h/g).', 't = √(2·2/9,8).'], setup: () => act.set({H: 2}), answer: (c) => ideal.t(c.s.H), tol: 0.01, explain: 't = √(4/9,8) ≈ 0,639 s.'},
      {type: 'predict', title: 'Đoán trước: vận tốc chạm đáy', text: 'Vận tốc của bi khi chạm đáy ống (v = g·t) là bao nhiêu?', unit: 'm/s', hints: ['v = g·t = 9,8·0,639', 'hoặc v = √(2gh).'], answer: (c) => ideal.v(c.s.H), tol: 0.1, explain: 'v = √(2gh) = √(2·9,8·2) ≈ 6,26 m/s.'},
      {type: 'do', title: 'Tự đo gia tốc g', text: 'Đặt độ cao thả h = 1,5 m, hút chân không rồi thả. Đồng hồ ở cổng quang đo thời gian rơi t, từ đó tính g = 2h/t².', hints: ['Kéo thanh h về 1,5 m, bấm “Hút chân không”, chờ rồi “Thả”.'], setup: () => act.set({H: 1.2, air: false}),
        check: (c) => near(c.s.H, 1.5, 0.05) && c.s.pAtRelease !== null && c.s.pAtRelease < 0.03 && both(c), explain: 'Đồng hồ đọc t ≈ 0,553 s → g = 2·1,5/0,553² ≈ 9,8 m/s². Đây là cách đo g trong phòng thí nghiệm.'},
      {type: 'predict', title: 'Đoán trước: quãng đường 0,3 s đầu', text: 'Trong chân không, quãng đường rơi sau 0,3 s đầu (s = ½gt²) là bao nhiêu?', unit: 'm', hints: ['s = ½·9,8·0,3².'], answer: () => ideal.y(0.3), tol: 0.01, explain: 's = ½·9,8·0,09 ≈ 0,441 m.'},
      {type: 'predict', title: 'Đoán trước: gấp đôi thời gian', text: 'Còn quãng đường sau 0,6 s đầu (gấp đôi thời gian) là bao nhiêu?', unit: 'm', hints: ['s = ½·9,8·0,6².'], answer: () => ideal.y(0.6), tol: 0.02, explain: 's = 1,764 m: gấp 4 lần 0,441 m. Quãng đường rơi tỉ lệ với t², nên các “ảnh” mỗi 0,1 s cách nhau xa dần.'},
      {type: 'do', title: 'Bóc tách ống Newton', text: 'Bấm TEARDOWN (phím T): thấy cuộn dây nam châm điện, cổng quang ở đáy và bơm chân không.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Khi ngắt điện, cuộn dây hết hút nên hai vật rơi cùng lúc. Cổng quang bắt đầu và dừng đồng hồ nhờ tia hồng ngoại bị chắn. Bơm hút khí làm lực cản biến mất.'},
    ],
    quiz: [
      {q: 'Rơi tự do là chuyển động của vật:', options: ['Rơi trong không khí', 'Chỉ chịu tác dụng của trọng lực', 'Rơi từ độ cao lớn', 'Rơi với vận tốc không đổi'], answer: 1, explain: 'Rơi tự do: chỉ chịu trọng lực (bỏ qua lực cản), là chuyển động nhanh dần đều với gia tốc g.'},
      {q: 'Gia tốc rơi tự do ở gần mặt đất xấp xỉ:', options: ['9,8 m/s² và phụ thuộc khối lượng', '9,8 m/s², hướng xuống, không phụ thuộc khối lượng', '10 m/s và hướng lên', '0,98 m/s²'], answer: 1, explain: 'g ≈ 9,8 m/s², hướng thẳng đứng xuống, như nhau với mọi vật.'},
      {q: 'Một vật rơi tự do từ độ cao 5 m (g = 9,8 m/s²). Thời gian rơi gần bằng:', options: ['0,5 s', '1,0 s', '2,0 s', '5,0 s'], answer: 1, explain: 't = √(2h/g) = √(10/9,8) ≈ 1,01 s.'},
      {q: 'Trong không khí, lông chim rơi chậm hơn hòn đá vì:', options: ['Trọng lực lên lông chim bằng 0', 'Lực cản không khí đáng kể so với trọng lượng của lông chim', 'Lông chim có gia tốc g nhỏ hơn', 'Hòn đá bị hút mạnh hơn'], answer: 1, explain: 'Gia tốc rơi tự do như nhau; khác biệt chỉ do lực cản không khí.'},
      {q: 'Quãng đường vật rơi tự do trong 2 s đầu (g = 9,8 m/s²) là:', options: ['9,8 m', '19,6 m', '39,2 m', '4,9 m'], answer: 1, explain: 's = ½gt² = ½·9,8·4 = 19,6 m.'},
    ],
    summary: [
      'Rơi tự do: chỉ chịu trọng lực, nhanh dần đều với gia tốc g ≈ 9,8 m/s² (mọi vật như nhau).',
      'v = g·t ; s = ½·g·t² ; v² = 2gh ; t = √(2h/g).',
      'Trong không khí, lực cản làm vật nhẹ rơi chậm hơn và đạt vận tốc giới hạn.',
      'Đo g: thả vật từ độ cao h, đo thời gian rơi t rồi tính g = 2h/t².',
    ],
  };
}

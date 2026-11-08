// Nội dung bài học M8 (Vật lí 10 KNTT: một số ví dụ về cách giải bài toán động lực học). ctx = {s: mô hình, r: readout, td}.
// act = {setA(m1, m2), setC(M, m), reset()}.
import {ideal} from './physics.js';
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl10-m8',
    title: 'Bài toán động lực học: máy Atwood và xe kéo bằng quả cân',
    objectives: [
      'Vẽ các lực tác dụng lên từng vật và viết định luật 2 Newton cho từng vật (chọn chiều dương theo chiều chuyển động).',
      'Giải hệ vật nối bằng dây qua ròng rọc: tìm gia tốc a và lực căng T.',
      'Hiểu vì sao lực căng dây khác trọng lượng của vật treo khi hệ đang chuyển động có gia tốc.',
      'Kiểm chứng a bằng thí nghiệm: a = 2s/t².',
    ],
    steps: [
      {type: 'do', title: 'Chuẩn bị máy Atwood', text: 'Ở tab “Máy Atwood”, đặt m₁ = 0,20 kg (trái) và m₂ = 0,30 kg (phải).', hints: ['Kéo m₁ về 0,20 và m₂ về 0,30.'], setup: () => act.setA(0.5, 0.45), check: (c) => c.s.mode === 'A' && near(c.s.m1, 0.2, 0.01) && near(c.s.m2, 0.3, 0.01),
        explain: 'Khối 300 g (bên phải) nặng hơn nên sẽ đi xuống, kéo khối 200 g đi lên. Hai khối có cùng độ lớn gia tốc vì nối cùng một dây không giãn.'},
      {type: 'predict', title: 'Đoán trước: gia tốc', text: 'Khối phải: m₂g − T = m₂a. Khối trái: T − m₁g = m₁a. Cộng hai phương trình rồi tìm a (g = 9,8 m/s²).', unit: 'm/s²', hints: ['(m₂ − m₁)g = (m₁ + m₂)a', 'a = 0,1·9,8/0,5.'], answer: (c) => ideal.aA(c.s.m1, c.s.m2), tol: 0.03, explain: 'a = (0,3 − 0,2)·9,8/(0,5) = 1,96 m/s².'},
      {type: 'predict', title: 'Đoán trước: lực căng dây', text: 'Thay a vào phương trình của khối trái: T = m₁(g + a). Lực căng dây T bằng bao nhiêu?', unit: 'N', hints: ['T = 0,2·(9,8 + 1,96).'], answer: (c) => ideal.TA(c.s.m1, c.s.m2), tol: 0.03, explain: 'T = 0,2·11,76 = 2,352 N.'},
      {type: 'choice', title: 'So sánh T với trọng lượng', text: 'Trọng lượng của khối phải là m₂g = 2,94 N. Lực căng dây T = 2,352 N thì:', options: ['T bằng trọng lượng m₂g', 'T nhỏ hơn m₂g vì khối phải đang đi xuống nhanh dần', 'T lớn hơn m₂g'], answer: 1, wrong: ['Đó là sai lầm thường gặp: T = mg chỉ đúng khi vật đứng yên hoặc chuyển động thẳng đều.', '', 'Nếu T > m₂g thì khối phải sẽ đi lên.'], hints: ['Khối phải có gia tốc hướng xuống: hợp lực của nó hướng xuống.'],
        explain: 'Khối phải đi xuống nhanh dần nên hợp lực hướng xuống: m₂g − T = m₂a > 0 ⇒ T < m₂g. Đồ thị cột bên trái cho thấy T nằm giữa m₁g và m₂g.'},
      {type: 'do', title: 'Thả và đo a', text: 'Bấm “Thả”. Máy dừng sau khi mỗi khối đi 1 m. Máy tự tính a = 2s/t².', hints: ['Bấm ▶ Thả (chọn ×0,25 nếu muốn xem chậm).'], setup: () => act.reset(), check: (c) => c.s.mode === 'A' && c.s.stopped, explain: 'Thời gian đi 1 m là t ≈ 1,01 s → a = 2·1/1,01² ≈ 1,96 m/s², khớp với lý thuyết.'},
      {type: 'do', title: 'Hai khối bằng nhau', text: 'Đặt m₁ = m₂ = 0,30 kg rồi thả. Có gì xảy ra?', hints: ['Kéo m₁ lên 0,30.'], setup: () => act.setA(0.2, 0.3), check: (c) => c.s.mode === 'A' && near(c.s.m1, 0.3, 0.01) && near(c.s.m2, 0.3, 0.01) && c.r.balanced,
        explain: 'Hệ cân bằng: a = 0, và T = mg = 2,94 N. Lúc này lực căng mới bằng trọng lượng.'},
      {type: 'do', title: 'Sang xe + quả cân', text: 'Bấm tab “Xe + quả cân”: một quả cân treo kéo xe 1 kg trên bàn qua ròng rọc.', hints: ['Tab thứ hai ở bảng bên phải.'], setup: () => act.setC(1, 0.2), check: (c) => c.s.mode === 'C', explain: 'Xe chuyển động ngang chỉ chịu lực căng T (bỏ qua ma sát); quả cân chịu trọng lực mg hướng xuống và T hướng lên.'},
      {type: 'predict', title: 'Đoán trước: gia tốc của hệ', text: 'M = 1 kg, m = 0,2 kg. Với xe: T = M·a; với quả cân: mg − T = m·a. Tìm a.', unit: 'm/s²', hints: ['mg = (M + m)a', 'a = 0,2·9,8/1,2.'], answer: (c) => ideal.aC(c.s.M, c.s.m), tol: 0.03, explain: 'a = mg/(M + m) = 1,96/1,2 ≈ 1,633 m/s². Khối lượng cả hệ (M + m) bị kéo bởi lực mg.'},
      {type: 'predict', title: 'Đoán trước: lực căng', text: 'Lực căng dây T kéo xe bằng bao nhiêu?', unit: 'N', hints: ['T = M·a = 1·1,633.'], answer: (c) => ideal.TC(c.s.M, c.s.m), tol: 0.03, explain: 'T = M·a ≈ 1,633 N, nhỏ hơn trọng lượng quả cân mg = 1,96 N.'},
      {type: 'do', title: 'Bóc tách', text: 'Bấm TEARDOWN (phím T): xem ổ bi của ròng rọc và cảm biến lực căng gắn trên dây.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Ổ bi làm ma sát ở trục ròng rọc rất nhỏ, nên có thể coi ròng rọc nhẹ và dây có lực căng như nhau ở hai phía. Cảm biến lực đo đúng T.'},
    ],
    quiz: [
      {q: 'Máy Atwood có m₁ = 0,1 kg và m₂ = 0,3 kg. Gia tốc của hệ là (g = 9,8 m/s²):', options: ['4,9 m/s²', '9,8 m/s²', '2,45 m/s²', '1,96 m/s²'], answer: 0, explain: 'a = (m₂ − m₁)g/(m₁ + m₂) = 0,2·9,8/0,4 = 4,9 m/s².'},
      {q: 'Hệ đang chuyển động nhanh dần, lực căng dây T so với trọng lượng của vật treo đi xuống:', options: ['Bằng', 'Nhỏ hơn', 'Lớn hơn', 'Bằng 0'], answer: 1, explain: 'Vật đi xuống nhanh dần nên mg − T = ma > 0 ⇒ T < mg.'},
      {q: 'Xe 2 kg trên bàn nhẵn được kéo bởi quả cân 0,5 kg qua ròng rọc. Gia tốc của hệ xấp xỉ (g = 9,8 m/s²):', options: ['1,96 m/s²', '4,9 m/s²', '9,8 m/s²', '0,5 m/s²'], answer: 0, explain: 'a = mg/(M + m) = 0,5·9,8/2,5 = 1,96 m/s².'},
      {q: 'Hai khối nối qua ròng rọc có khối lượng bằng nhau thì:', options: ['Khối bên trái đi xuống', 'Hệ đứng yên hoặc chuyển động đều, T = mg', 'Hệ chuyển động với gia tốc g', 'T = 0'], answer: 1, explain: 'm₁ = m₂ ⇒ a = 0, T = mg.'},
      {q: 'Vì sao hai khối nối bằng dây không giãn có cùng độ lớn gia tốc?', options: ['Vì cùng khối lượng', 'Vì dây không giãn nên quãng đường đi của hai khối bằng nhau tại mọi thời điểm', 'Vì cùng trọng lực', 'Vì ròng rọc quay'], answer: 1, explain: 'Dây không giãn ⇒ độ dài dây không đổi ⇒ khối này đi lên bao nhiêu thì khối kia đi xuống bấy nhiêu.'},
    ],
    summary: [
      'Giải bài toán: vẽ lực từng vật → chọn chiều dương → viết định luật 2 cho từng vật → giải hệ.',
      'Atwood: a = (m₂ − m₁)g/(m₁ + m₂) ; T = 2m₁m₂g/(m₁ + m₂).',
      'Xe + quả cân: a = mg/(M + m) ; T = Mmg/(M + m) < mg.',
      'T = mg chỉ khi vật cân bằng; khi vật có gia tốc thì T khác mg.',
    ],
  };
}
void 0;

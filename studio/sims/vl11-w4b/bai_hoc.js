// Nội dung bài học W4B (Vật lí 11 KNTT, chương 2 Sóng — Giao thoa ánh sáng, thí nghiệm Young). ctx = {s, r, td, view}.
// act = {set(o)}: đặt thông số (wl, a, D, x, white).
export function makeLesson(act) {
  const near = (a, b, t) => Math.abs(a - b) <= t;
  return {
    code: 'vl11-w4b',
    title: 'Giao thoa ánh sáng: thí nghiệm hai khe Young',
    objectives: [
      'Giải thích thí nghiệm Young: ánh sáng qua khe đơn (nhiễu xạ), qua hai khe, hai sóng kết hợp chồng chất tạo vân sáng, vân tối chứng tỏ ánh sáng có tính chất sóng.',
      'Dùng hiệu đường đi Δd = a·x/D để xác định vân sáng (x = k·i) và vân tối (x = (k + ½)·i).',
      'Vận dụng khoảng vân i = λD/a để tính i hoặc đo bước sóng λ = a·i/D.',
      'Nêu được vì sao ánh sáng trắng cho vân trung tâm màu trắng và các vân bên có màu.',
    ],
    steps: [
      {type: 'do', title: 'Nhìn vào màn', text: 'Laser đỏ 650 nm chiếu qua hai khe rất hẹp lên màn. Bấm nút “3 · MÀN” để nhìn chính diện hình trên màn.', hints: ['Bốn nút cuối bảng bên phải, hoặc phím 3.'], setup: () => act.set({wl: 650, a: 0.5, D: 2, x: 0}), check: (c) => c.view === 'screen', explain: 'Trên màn có những vạch sáng và tối nằm xen kẽ, cách đều nhau: đó là các vân giao thoa.'},
      {type: 'choice', title: 'Vì sao có khe đơn S₀?', text: 'Ánh sáng từ laser đi qua một khe hẹp S₀ rồi mới tới hai khe S₁, S₂. Khe đơn S₀ có tác dụng:', options: ['Nhiễu xạ ánh sáng thành một sóng lan rộng, tới S₁ và S₂ cùng lúc nên S₁, S₂ là hai nguồn kết hợp', 'Làm ánh sáng sáng hơn', 'Đổi màu ánh sáng'], answer: 0, wrong: ['', 'Khe hẹp làm chùm sáng yếu đi chứ không mạnh lên.', 'Màu (bước sóng) không đổi khi qua khe.'], hints: ['Nhìn tấm sóng màu giữa S₀ và S₁, S₂: sóng toả ra từ S₀ thành hình cung.'], explain: 'Nhờ nhiễu xạ qua S₀, một sóng duy nhất toả ra tới cả S₁ và S₂ với cùng pha. Hai khe thành hai nguồn kết hợp (cùng tần số, hiệu pha không đổi). Sau S₁, S₂ lại nhiễu xạ lần nữa, hai sóng toả ra gặp nhau và giao thoa.'},
      {type: 'choice', title: 'Ý nghĩa của hiện tượng', text: 'Vì sao hiện tượng giao thoa ánh sáng chứng tỏ ánh sáng có tính chất sóng?', options: ['Vì chỉ có sóng mới cho các vân sáng tối xen kẽ khi chồng chất', 'Vì ánh sáng đi theo đường thẳng', 'Vì ánh sáng có màu'], answer: 0, wrong: ['', 'Đi thẳng là tính chất của tia sáng, chưa nói lên điều gì về bản chất sóng.', 'Màu sắc không liên quan trực tiếp đến hiện tượng giao thoa.'], hints: ['Giao thoa là chồng chất của hai sóng kết hợp (bài trước với sóng nước).'], explain: 'Hai chùm sáng từ hai khe là hai sóng kết hợp. Chúng triệt tiêu nhau ở vân tối và tăng cường nhau ở vân sáng, như hai sóng nước.'},
      {type: 'predict', title: 'Khoảng vân', text: 'Khoảng vân i là khoảng cách giữa hai vân sáng liên tiếp: i = λD/a. Với λ = 650 nm, a = 0,5 mm, D = 2 m, tính i.', unit: 'mm', hints: ['i = 650·10⁻⁹·2/(0,5·10⁻³) m, rồi đổi ra mm.'], answer: (c) => c.r.iMm, tol: 0.05, explain: 'i = 2,6·10⁻³ m = 2,6 mm. Hãy nhìn thanh i = 2,6 mm trên đồ thị độ sáng.'},
      {type: 'do', title: 'Đo trên màn bằng con trỏ', text: 'Kéo con trỏ P (vạch đỏ) tới vân sáng bậc 1 (x = 2,6 mm), cạnh vân sáng trung tâm.', hints: ['Thanh “Con trỏ P · vị trí x”: giá trị 2,6.'], check: (c) => near(c.s.x, 2.6, 0.12), explain: 'Tại P, I = 1: vân sáng bậc 1. Hiệu đường đi Δd = λ.'},
      {type: 'predict', title: 'Hiệu đường đi', text: 'Hiệu đường đi tại P là Δd = a·x/D. Tính Δd theo bước sóng λ (Δd/λ bằng bao nhiêu?).', unit: 'λ', hints: ['Xem dòng Δd/λ ở bảng bên trái.'], answer: (c) => c.r.ddLam, tol: 0.06, explain: 'Δd = 1·λ nên hai sóng đến P cùng pha: vân sáng.'},
      {type: 'predict', title: 'Vị trí vân tối', text: 'Vân tối đầu tiên ở x = (0 + ½)i. Tính x (mm).', unit: 'mm', hints: ['x = 2,6/2.'], answer: (c) => c.r.iMm / 2, tol: 0.06, explain: 'x = 1,3 mm: Δd = λ/2, hai sóng ngược pha nên triệt tiêu.'},
      {type: 'do', title: 'Kiểm chứng vân tối', text: 'Kéo con trỏ P tới x = 1,3 mm và xem I(P).', hints: ['Thanh “Con trỏ P” = 1,3.'], check: (c) => c.r.kind === 'min' && c.r.I < 0.1, explain: 'I = 0: tại đây ánh sáng cộng với ánh sáng cho bóng tối.'},
      {type: 'choice', title: 'Điều kiện vân sáng', text: 'Tại điểm trên màn có hiệu đường đi Δd = 2λ ta thấy:', options: ['Vân sáng', 'Vân tối', 'Điểm có độ sáng bằng một nửa'], answer: 0, wrong: ['', 'Vân tối khi Δd = (k + ½)λ, tức một số bán nguyên lần λ.', 'Δd = 2λ là số nguyên lần λ nên hai sóng cùng pha.'], hints: ['Vân sáng khi Δd = kλ.'], explain: 'Vân sáng khi Δd = kλ; vân tối khi Δd = (k + ½)λ (k nguyên).'},
      {type: 'do', title: 'Tăng khoảng cách tới màn', text: 'Kéo D lên 3 m (giữ λ, a). Quan sát hình trên màn.', hints: ['Thanh “D khoảng cách khe – màn”.'], check: (c) => near(c.s.D, 3, 0.06), explain: 'Các vân trên màn giãn rộng ra.'},
      {type: 'predict', title: 'Khoảng vân mới', text: 'Với D = 3 m (λ = 650 nm, a = 0,5 mm), tính i mới.', unit: 'mm', hints: ['i = λD/a = 650·10⁻⁹·3/(0,5·10⁻³).'], answer: (c) => c.r.iMm, tol: 0.06, explain: 'i = 3,9 mm: tỉ lệ thuận với D.'},
      {type: 'do', title: 'Tăng khoảng cách hai khe', text: 'Kéo a lên 1,0 mm (D = 3 m).', hints: ['Thanh “a khoảng cách hai khe”.'], check: (c) => near(c.s.a, 1, 0.03), explain: 'Các vân sát nhau hơn.'},
      {type: 'choice', title: 'Khi a tăng', text: 'Khi hai khe cách nhau xa hơn (a tăng, λ và D không đổi), khoảng vân i:', options: ['Giảm', 'Tăng', 'Không đổi'], answer: 0, wrong: ['', 'i = λD/a: a ở mẫu số nên a tăng thì i giảm.', 'i phụ thuộc a; em vừa thấy các vân sát nhau hơn.'], hints: ['Xem công thức i = λD/a.'], explain: 'i tỉ lệ nghịch với a: khe càng xa, vân càng khít.'},
      {type: 'do', title: 'Đổi sang ánh sáng lam', text: 'Kéo λ về 450 nm (ánh sáng lam, laser xanh), giữ a = 1 mm và D = 3 m.', hints: ['Thanh λ; ô màu bên dưới thanh trượt cho biết màu.'], check: (c) => !c.s.white && near(c.s.wl, 450, 6), explain: 'Ánh sáng lam có bước sóng ngắn hơn ánh sáng đỏ.'},
      {type: 'predict', title: 'Khoảng vân ánh sáng lam', text: 'Tính i với λ = 450 nm, a = 1 mm, D = 3 m.', unit: 'mm', hints: ['i = 450·10⁻⁹·3/10⁻³ = 1,35·10⁻³ m.'], answer: (c) => c.r.iMm, tol: 0.06, explain: 'i = 1,35 mm. Cùng điều kiện, ánh sáng đỏ 650 nm cho i = 1,95 mm, lớn hơn.'},
      {type: 'choice', title: 'Màu nào có vân thưa hơn?', text: 'Cùng a và D, ánh sáng đỏ so với ánh sáng lam cho khoảng vân:', options: ['Lớn hơn', 'Nhỏ hơn', 'Bằng nhau'], answer: 0, wrong: ['', 'i tỉ lệ thuận với λ; λ đỏ > λ lam nên i đỏ lớn hơn.', 'i phụ thuộc λ, em vừa thấy i khác nhau.'], hints: ['Xem đồ thị i theo λ ở bảng bên trái.'], explain: 'Đỏ có λ lớn nhất nên vân thưa nhất; tím có λ nhỏ nhất nên vân khít nhất.'},
      {type: 'predict', title: 'Đo bước sóng', text: 'Đây là cách người ta đo bước sóng: biết a = 0,5 mm, D = 2 m, đo trên màn khoảng vân i = 2,2 mm. Tính λ = a·i/D theo nm.', unit: 'nm', setup: () => act.set({wl: 550, a: 0.5, D: 2, x: 0}), hints: ['λ = 0,5·10⁻³·2,2·10⁻³/2 m = 5,5·10⁻⁷ m.'], answer: (c) => c.s.wl, tol: 6, explain: 'λ = 550 nm: ánh sáng lục. Đối chiếu: thanh trượt λ đang ở 550 nm.'},
      {type: 'do', title: 'Ánh sáng trắng', text: 'Bấm “Ánh sáng trắng” (hoặc phím W) rồi nhìn màn.', hints: ['Nút “Ánh sáng trắng” đầu bảng bên phải.'], check: (c) => c.s.white, explain: 'Vân trung tâm màu trắng; hai bên là các dải màu như cầu vồng.'},
      {type: 'choice', title: 'Vì sao vân giữa màu trắng?', text: 'Với ánh sáng trắng, vân chính giữa có màu trắng vì:', options: ['Tại x = 0 mọi màu đều cho vân sáng (Δd = 0)', 'Tại đó chỉ có ánh sáng trắng đi qua', 'Các màu triệt tiêu nhau tại đó'], answer: 0, wrong: ['', 'Mọi màu đều đi qua hai khe; chúng cộng lại mới ra trắng.', 'Ở x = 0, Δd = 0 cho mọi bước sóng nên chúng tăng cường nhau chứ không triệt tiêu.'], hints: ['Δd = 0 với mọi bước sóng.'], explain: 'Δd = 0 nên mọi màu cùng cực đại tại x = 0. Ở hai bên, mỗi màu có i khác nhau nên vân sáng của các màu lệch nhau: hiện màu.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): xem diot laser và tấm hai khe.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Hai khe hẹp cắt chùm laser thành hai chùm kết hợp (cùng một nguồn nên luôn có hiệu pha không đổi).'},
    ],
    quiz: [
      {q: 'Thí nghiệm Young: λ = 600 nm, a = 1 mm, D = 2 m. Khoảng vân là:', options: ['0,3 mm', '1,2 mm', '3 mm', '12 mm'], answer: 1, explain: 'i = λD/a = 600·10⁻⁹·2/10⁻³ = 1,2·10⁻³ m = 1,2 mm.'},
      {q: 'Hai khe cách nhau 0,5 mm, màn cách khe 2 m, khoảng vân đo được 2,4 mm. Bước sóng ánh sáng là:', options: ['480 nm', '600 nm', '750 nm', '1200 nm'], answer: 1, explain: 'λ = a·i/D = 0,5·10⁻³·2,4·10⁻³/2 = 6·10⁻⁷ m = 600 nm.'},
      {q: 'Tại điểm có hiệu đường đi Δd = 1,5λ ta thấy:', options: ['Vân sáng', 'Vân tối', 'Vân sáng bậc 1,5', 'Không xác định'], answer: 1, explain: 'Δd = (k + ½)λ (k = 1): vân tối.'},
      {q: 'Muốn khoảng vân tăng lên gấp đôi (λ không đổi) ta có thể:', options: ['Tăng a gấp đôi', 'Giảm D một nửa', 'Tăng D gấp đôi', 'Tăng cả a và D gấp đôi'], answer: 2, explain: 'i tỉ lệ thuận với D, tỉ lệ nghịch với a: tăng D gấp đôi thì i gấp đôi.'},
      {q: 'Chiếu ánh sáng trắng vào hai khe. Vân sáng trung tâm có màu:', options: ['Đỏ', 'Tím', 'Trắng', 'Lục'], answer: 2, explain: 'Tại vân trung tâm mọi màu cùng cho cực đại nên chồng lại thành màu trắng.'},
    ],
    summary: [
      'Giao thoa ánh sáng chứng tỏ ánh sáng có tính chất sóng; hai khe cho hai sóng kết hợp.',
      'Hiệu đường đi Δd = a·x/D. Vân sáng: Δd = kλ (x = k·i). Vân tối: Δd = (k + ½)λ (x = (k + ½)·i).',
      'Khoảng vân i = λD/a; đo được i thì suy ra λ = a·i/D.',
      'Ánh sáng trắng: vân trung tâm trắng, hai bên có màu vì mỗi bước sóng có khoảng vân khác nhau (đỏ thưa nhất, tím khít nhất).',
    ],
  };
}

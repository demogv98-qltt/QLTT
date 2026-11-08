// Nội dung bài học M15 (Vật lí 10 KNTT: sai số của phép đo; phép đo trực tiếp và gián tiếp). ctx = {s: mô hình, r: readout, td}.
// act = {set({l, n}) (xoá bảng), measure()}.
export function makeLesson(act) {
  const rows = (c) => c.s.rows.length;
  return {
    code: 'vl10-m15',
    title: 'Sai số của phép đo: đo chu kì con lắc đơn và tính g',
    objectives: [
      'Hiểu sai số ngẫu nhiên khi dùng đồng hồ bấm giờ: mỗi lần đo cho một kết quả hơi khác nhau.',
      'Tính giá trị trung bình, sai số tuyệt đối, sai số tỉ đối δ = Δt/t̄ và ghi kết quả đo dạng t̄ ± Δt.',
      'Biết vì sao đo nhiều dao động rồi chia cho số dao động làm giảm sai số tỉ đối.',
      'Tính sai số của phép đo gián tiếp: g = 4π²l/T² có δg = δl + 2δT.',
    ],
    steps: [
      {type: 'do', title: 'Đo thời gian 1 dao động', text: 'Dây dài l = 100 cm. Chọn “1 dao động” rồi bấm “⏱ Đo 1 lần” năm lần để có 5 số liệu.', hints: ['Mỗi lần bấm sẽ thêm một dòng vào bảng bên trái.'], setup: () => act.set({l: 1, n: 1}), check: (c) => c.s.n === 1 && rows(c) >= 5, explain: 'Mỗi lần tay bấm đồng hồ trễ khác nhau nên 5 kết quả hơi khác nhau dù chu kì thật không đổi.'},
      {type: 'predict', title: 'Giá trị trung bình', text: 'Tính giá trị trung bình t̄ của 5 lần đo trong bảng (cộng lại rồi chia 5).', unit: 's', hints: ['t̄ = (t₁ + t₂ + t₃ + t₄ + t₅)/5.'], answer: (c) => c.r.st.mean, tol: 0.02, explain: 'Giá trị trung bình là giá trị đáng tin cậy nhất cho kết quả của phép đo.'},
      {type: 'predict', title: 'Sai số ngẫu nhiên', text: 'Với mỗi lần đo tính Δtᵢ = |tᵢ − t̄|, rồi lấy trung bình của 5 giá trị Δtᵢ. Đây là sai số ngẫu nhiên (sai số tuyệt đối trung bình).', unit: 's', hints: ['Tính 5 hiệu số tuyệt đối rồi cộng lại, chia 5.'], answer: (c) => c.r.st.dng, tol: 0.012, explain: 'Sai số ngẫu nhiên cho biết các lần đo “tản” quanh giá trị trung bình bao nhiêu.'},
      {type: 'predict', title: 'Sai số tỉ đối', text: 'Đồng hồ có độ chia nhỏ nhất 0,01 s nên sai số dụng cụ Δt_dc = 0,005 s. Sai số tuyệt đối Δt = Δt_ngẫu nhiên + Δt_dc. Tính sai số tỉ đối δ = Δt/t̄ theo %.', unit: '%', hints: ['δ = (Δt_ngẫu nhiên + 0,005)/t̄ · 100%.'], answer: (c) => c.r.st.dltT * 100, tol: 0.25, explain: 'Sai số tỉ đối cho biết sai số chiếm bao nhiêu phần trăm giá trị đo. Hãy bấm “∑ Xử lí số liệu” để đối chiếu.'},
      {type: 'do', title: 'Đối chiếu bằng xử lí số liệu', text: 'Bấm “∑ Xử lí số liệu” và so sánh với các số em vừa tính.', hints: ['Nút tím ở bảng bên phải.'], check: (c) => c.s.show, explain: 'Bảng đã hiện cột |t − t̄| và các kết quả. Kết quả đo T được ghi dưới dạng t̄ ± Δt.'},
      {type: 'do', title: 'Đo 10 dao động một lần', text: 'Chọn “10 dao động” (bảng cũ được xoá) rồi bấm “⏱ Đo 1 lần” năm lần.', hints: ['Nút 10, rồi bấm Đo 5 lần.'], check: (c) => c.s.n === 10 && rows(c) >= 5, explain: 'Bây giờ mỗi lần bấm đồng hồ đo thời gian của 10 dao động, khoảng 20 giây.'},
      {type: 'predict', title: 'Sai số tỉ đối đã nhỏ lại', text: 'Tính lại sai số tỉ đối δ = (Δt_ngẫu nhiên + 0,005)/t̄ theo % với số liệu mới.', unit: '%', hints: ['t̄ khoảng 20 s nên δ rất nhỏ.'], answer: (c) => c.r.st.dltT * 100, tol: 0.12, explain: 'Sai số tuyệt đối vẫn cỡ 0,05 – 0,1 s (do phản xạ của tay) nhưng t̄ lớn gấp 10 lần nên sai số tỉ đối chỉ còn khoảng 0,3%.'},
      {type: 'choice', title: 'Vì sao đo 10 dao động tốt hơn?', text: 'Vì sao nên đo thời gian của nhiều dao động rồi chia cho số dao động?', options: ['Sai số tuyệt đối của đồng hồ (do tay bấm) gần như không đổi, còn thời gian đo lớn hơn nên sai số tỉ đối nhỏ đi', 'Vì con lắc dao động nhanh hơn khi đo nhiều dao động', 'Vì đồng hồ trở nên chính xác hơn khi bấm lâu'], answer: 0, wrong: ['', 'Chu kì của con lắc không phụ thuộc số dao động ta đếm.', 'Đồng hồ vẫn có độ chia 0,01 s như cũ; điều thay đổi là thời gian đo dài hơn.'], hints: ['So sánh Δt và t̄ của hai thí nghiệm.'], explain: 'Δt cỡ 0,07 s cho cả hai trường hợp, nhưng t̄ = 2 s với 1 dao động và 20 s với 10 dao động.'},
      {type: 'predict', title: 'Chu kì của con lắc', text: 'Chu kì T = t̄/10. Tính T từ số liệu 10 dao động.', unit: 's', hints: ['Lấy t̄ chia 10.'], answer: (c) => c.r.st.T, tol: 0.005, explain: 'T ≈ 2,0 s, gần với giá trị lí thuyết T = 2π√(l/g) = 2,006 s.'},
      {type: 'choice', title: 'Sai số của phép đo gián tiếp', text: 'g = 4π²·l/T². Sai số tỉ đối của g (phép đo gián tiếp) tính bằng:', options: ['δg = δl + 2·δT', 'δg = δl + δT', 'δg = 2·δl + δT'], answer: 0, wrong: ['', 'T xuất hiện với số mũ 2 trong công thức nên sai số tỉ đối của T được nhân với 2.', 'l có số mũ 1 nên δl được nhân với 1; T có số mũ 2 nên δT mới nhân với 2.'], hints: ['Với tích/thương, sai số tỉ đối cộng lại, nhân với số mũ.'], explain: 'Tích và thương: cộng các sai số tỉ đối, mỗi cái nhân với số mũ của đại lượng tương ứng.'},
      {type: 'predict', title: 'Sai số tỉ đối của g', text: 'Thước có độ chia 1 mm nên Δl = 0,05 cm, suy ra δl = 0,05/100 = 0,05%. Tính δg = δl + 2δT theo %.', unit: '%', hints: ['δT = δ của thời gian: Δt/t̄ (đã tính ở trên).'], answer: (c) => c.r.st.dgRel * 100, tol: 0.15, explain: 'δg ≈ 0,05% + 2·0,35% ≈ 0,75%.'},
      {type: 'predict', title: 'Tính g', text: 'Tính g = 4π²·l/T² (l = 1 m, T lấy ở trên).', unit: 'm/s²', hints: ['4π² ≈ 39,48.'], answer: (c) => c.r.st.g, tol: 0.1, explain: 'g ≈ 9,7 – 9,9 m/s² gần với 9,8 m/s². Bấm “∑ Xử lí số liệu” để xem kết quả chính xác ± sai số.'},
      {type: 'do', title: 'Đo 20 dao động, nhiều lần hơn', text: 'Chọn “20 dao động”, đo 8 lần rồi bấm “∑ Xử lí số liệu”. So sánh sai số với phép đo trước.', hints: ['Nút 20, bấm Đo 8 lần, rồi nút tím.'], check: (c) => c.s.n === 20 && rows(c) >= 8 && c.s.show, explain: 'Thời gian đo dài hơn và nhiều lần đo hơn: g sát 9,8 hơn và khoảng sai số hẹp lại.'},
      {type: 'choice', title: 'Cách ghi kết quả', text: 'Cách ghi kết quả đo g đúng là:', options: ['g = ḡ ± Δg, ví dụ g = 9,78 ± 0,07 m/s²', 'g = ḡ, bỏ qua sai số', 'g = Δg ± ḡ'], answer: 0, wrong: ['', 'Kết quả đo phải kèm sai số; nếu không, ta không biết kết quả đáng tin tới mức nào.', 'Giá trị trung bình ḡ là kết quả, Δg là sai số kèm theo; thứ tự không phải vậy.'], hints: ['Xem dòng “g = … ± …” trong bảng xử lí số liệu.'], explain: 'Kết quả của phép đo viết dạng A = Ā ± ΔA, kèm sai số tỉ đối δ = ΔA/Ā.'},
      {type: 'do', title: 'Bóc tách thiết bị', text: 'Bấm TEARDOWN (phím T): xem quả nặng, đồng hồ bấm giờ và kẹp treo.', hints: ['Nút cam “TEARDOWN”.'], check: (c) => c.td > 0.85, explain: 'Đồng hồ chỉ cho số đọc cách 0,01 s nên có sai số dụng cụ; tay người bấm trễ nhanh khác nhau gây sai số ngẫu nhiên.'},
    ],
    quiz: [
      {q: 'Năm lần đo chu kì: 2,00; 2,02; 1,98; 2,04; 1,96 (s). Giá trị trung bình là:', options: ['1,98 s', '2,00 s', '2,02 s', '2,04 s'], answer: 1, explain: 'Tổng = 10,00 nên trung bình = 2,00 s.'},
      {q: 'Với số liệu trên, sai số tuyệt đối trung bình của các lần đo (sai số ngẫu nhiên) là:', options: ['0,02 s', '0,024 s', '0,04 s', '0,12 s'], answer: 1, explain: 'Δtᵢ = 0; 0,02; 0,02; 0,04; 0,04 nên trung bình = 0,12/5 = 0,024 s.'},
      {q: 'Chiều dài l = 50,0 ± 0,5 cm. Sai số tỉ đối là:', options: ['0,5%', '1%', '2%', '10%'], answer: 1, explain: 'δ = 0,5/50,0 = 1%.'},
      {q: 'Thể tích hình lập phương V = a³, cạnh a đo với sai số tỉ đối 1%. Sai số tỉ đối của V là:', options: ['1%', '2%', '3%', '1/3 %'], answer: 2, explain: 'δV = 3·δa = 3%.'},
      {q: 'Đo chu kì bằng đồng hồ, rồi tính g = 4π²l/T². Cách đo nào đúng?', options: ['Đo T là phép đo trực tiếp, tính g là phép đo gián tiếp', 'Cả hai đều là phép đo trực tiếp', 'Cả hai đều là phép đo gián tiếp', 'Đo T là gián tiếp, tính g là trực tiếp'], answer: 0, explain: 'Đo trực tiếp: đọc ngay trên dụng cụ. Gián tiếp: tính từ các đại lượng đo trực tiếp.'},
    ],
    summary: [
      'Giá trị trung bình t̄; sai số ngẫu nhiên = trung bình các |tᵢ − t̄|; Δt = sai số ngẫu nhiên + sai số dụng cụ.',
      'Sai số tỉ đối δ = Δt/t̄. Kết quả viết dạng t̄ ± Δt.',
      'Đo nhiều dao động rồi chia số dao động làm giảm sai số tỉ đối; đo nhiều lần làm giảm sai số ngẫu nhiên.',
      'Phép đo gián tiếp: tích/thương cộng các sai số tỉ đối (nhân số mũ), ví dụ δg = δl + 2δT.',
    ],
  };
}

# Phiếu B4 – Thực hành đo cảm ứng từ B bằng cân dòng điện (Vật lí 12, Chương 3) *(◻ thầy đối chiếu bài thực hành trong sách)*
**Mô hình:** F = N·B·I·l (l = 4,0 cm ± 0,5 mm); Δm = F/g; cân độ phân giải 0,01 g, nhiễu ngẫu nhiên σ = 0,005 g (lấy mẫu lại mỗi 0,35 s, giả ngẫu nhiên cố định). Ba nam châm A/B/C có B “thật” 0,082 / 0,121 / 0,163 T (học sinh không biết trước; nút “Kiểm tra” hiện ra).
**Phân tích số liệu:** hồi quy tuyến tính F–I (có tung độ gốc), hệ số góc ± sai số chuẩn; B = k/(N·l); δB = B·√((SE/k)² + (δl/l)²).
**Giả định:** từ trường đều trong khe, bỏ qua từ trường rìa; hai cạnh đứng của khung triệt tiêu lực; chiều dài hiệu dụng đúng bằng l (nguồn sai số hệ thống được nêu trong bài).
**Kiểm chứng:** 4 phép kiểm B4 (F = NBIl, hồi quy giải tích, 300 lần đo mô phỏng: 100 % nằm trong ±2δB, lệch trung bình 0,01 %, đổi chiều I) + học sinh làm thử `bai_hoc_B4.mjs`.

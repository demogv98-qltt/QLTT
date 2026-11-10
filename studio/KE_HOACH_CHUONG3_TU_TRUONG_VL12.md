# Kế hoạch Chương 3 – Từ trường (Vật lí 12, KNTT)

Số bài/tên bài đánh dấu ◻ là em ghi theo trí nhớ về chương trình GDPT 2018, **chưa đối chiếu sách** → thầy xác nhận.
Quy tắc: không vật nào lơ lửng; mỗi mô phỏng chạy audit hình học + bộ kiểm định số trước khi giao; không giao nếu chưa xem ảnh 3 góc.

## Danh sách mô phỏng đề xuất (mỗi cái 1 mô hình vật lí → 3D → bảng số → bài học dự đoán–quan sát + quiz)
| Mã | Nội dung ◻ | Mô hình & hình 3D | Kiểm định số độc lập |
|---|---|---|---|
| B1 | Khái niệm từ trường, đường sức từ | Nam châm thanh/chữ U, mạt sắt + kim la bàn mô phỏng; đường sức đi ra N vào S, khép kín; từ trường Trái Đất | Lưỡng cực từ: so sánh B(r) trên trục với B∝1/r³; đường sức khép kín (div B≈0 bằng sai phân) |
| B2 | Từ phổ & đường sức của dòng điện (dây thẳng, vòng dây, ống dây) | Dây thẳng/vòng/ống; quy tắc nắm tay phải; B theo I, r, N, l | Tích phân Biot–Savart số so với B=μ₀I/2πr, μ₀I/2R, μ₀nI (sai số <1%) |
| B3 | Lực từ lên dây dẫn: F=BIl sinθ, quy tắc bàn tay trái | Thanh dẫn trên ray trong nam châm chữ U, cân lực; đổi chiều I, B, góc θ | F=IlB sinθ bằng tích phân dF=I dl×B; chiều theo tích có hướng |
| B4 | Cảm ứng từ B, đo B (thực hành) | Cân dòng điện / cuộn dây trên cân lực kế, đồ thị F–I, F–l; xử lí số liệu & sai số | Hồi quy tuyến tính F–I cho B đặt trước; sai số đo lặp |
| B5 | Lực từ lên điện tích chuyển động (nếu thuộc chương ◻) | Hạt trong từ trường đều: quỹ đạo tròn/xoắn; r=mv/qB | Tích phân RK4 so với r=mv/(qB), T=2πm/(qB); bảo toàn động năng |
| B6 | Cảm ứng điện từ, từ thông Φ=BS cosθ, định luật Faraday–Lenz | Nam châm cắm vào cuộn dây + điện kế; khung quay; |e|=NΔΦ/Δt, chiều theo Lenz | e=−NdΦ/dt bằng đạo hàm số của Φ(t); dấu theo Lenz |
| B7 | Máy phát điện xoay chiều / biến áp (nếu thuộc chương ◻) | Khung quay trong từ trường, vành khuyên–chổi than; e=NBSω sin ωt; biến áp U₂/U₁=N₂/N₁ | Đỉnh e=NBSω; chu kỳ; công suất bảo toàn (lí tưởng) |

Thứ tự làm đề nghị: **B3 → B2 → B1 → B6 → B4 → B5 → B7** (B3 có hình rõ nhất và hay thi nhất).

## Nguyên tắc khoa học (bài học từ các lỗi trước)
1. Chiều từ trường/đường sức/lực vẽ đúng quy ước: đường sức ngoài nam châm đi N→S, bên trong S→N; mũi tên lực kiểm bằng tích có hướng trong code, không vẽ tay.
2. Mọi công thức hiển thị phải có phép kiểm số độc lập trong `studio/kiem_thu/kiem_dinh_vat_li.mjs` (thêm mục "Từ trường").
3. Ghi rõ mô hình gần đúng (ống dây dài vô hạn, từ trường đều giữa hai cực…) ngay trong bài, không để học sinh hiểu là thực tế.
4. Hình: nam châm có 2 cực rõ N đỏ/S xanh; ray, thanh dẫn, nguồn nối thật bằng dây; không có chi tiết lơ lửng (chạy `audit_khop_noi.mjs`).
5. Bố cục chung như các mô phỏng trước (thu gọn 2 thanh, ẩn thẻ tên, auto-tour, TEARDOWN).
6. Khả năng đối chiếu: em không mở được PhET/JavaLab; em sẽ đối chiếu bằng công thức đóng và sách của thầy. Thầy nên tự mở "Faraday's Law"/"Magnet and Compass" trên PhET để so sau khi em giao.

## Cần thầy quyết (ngắn)
1. Xác nhận danh sách bài thật của chương (◻) — nhất là B5, B7 có thuộc Chương 3 không.
2. Cho em tên/ảnh trang sách "yêu cầu cần đạt" nếu muốn bám sát.
3. Bắt đầu với B3 (lực từ lên dây dẫn) được không?

# Kế hoạch bộ mô phỏng Vật lí 10 — Kết nối tri thức

> Trạng thái nguồn: chưa đọc được mục lục chính thức (mạng sandbox chặn trang tra cứu).
> ✔ = số bài đã thấy trong kết quả tìm kiếm; ◻ = theo trí nhớ, **thầy đối chiếu với sách trước khi làm**.

## 1. Danh sách mô phỏng "nhất thiết phải có"

| # | Mô phỏng | Bài SGK | Học sinh tự làm được gì | Đại lượng hiện trên màn hình |
|---|---|---|---|---|
| M1 | Độ dịch chuyển – vận tốc, đồ thị d–t | 4 ✔, 5 ✔, 7 ◻ | Kéo xe, đọc độ dốc đồ thị ra vận tốc; phân biệt quãng đường và độ dịch chuyển | d, s, v, đồ thị d–t |
| M2 | Chuyển động thẳng biến đổi đều | 8–9 ◻ | Đổi a, v₀; thấy quãng đường = diện tích dưới đồ thị v–t | a, v, s, đồ thị v–t và d–t |
| M3 | Rơi tự do | 10–11 ◻ | Thả vật, bật/tắt lực cản, so sánh các vật | g, v, s, thời gian rơi |
| M4 | Chuyển động ném ngang/xiên | 12 ◻ | Đổi góc ném, v₀; tìm tầm xa, độ cao cực đại | quỹ đạo, vₓ, v_y, L, H |
| M5 | Tổng hợp và phân tích lực | 13 ◻ | Kéo 2 vectơ lực, thấy hình bình hành | F₁, F₂, F, góc |
| M6 | Ba định luật Newton | 14–16 ◻ | Đổi F, m; thấy a = F/m; cặp lực–phản lực | F, m, a, đồ thị a–F |
| M7 | Trọng lực, lực căng, ma sát, lực cản/nâng | 17 ✔, 18 ✔, 19 ✔ | Mặt phẳng nghiêng, đổi hệ số ma sát, tìm góc trượt | P, N, Fms, T, a |
| M8 | Bài toán động lực học (Atwood, mặt phẳng nghiêng) | 20 ✔ | Đổi khối lượng, kiểm tra kết quả tự giải | a, T, hình lực |
| M9 | **Mômen lực, cân bằng vật rắn** | 21 ✔ | Đã có bản đầu (đòn bẩy), cần chỉnh cho đúng sách 10 | M, d, điều kiện cân bằng |
| M10 | Công, năng lượng, cơ năng, công suất, hiệu suất | 23–27 ◻ | Trượt dốc, con lắc; biểu đồ cột Wđ–Wt–W | A, P, Wđ, Wt, W, H |
| M11 | Động lượng, va chạm | 28 ◻, 29 ✔, 30 ◻ | Va chạm đàn hồi/mềm, kiểm tra bảo toàn | p, tổng p trước/sau, Wđ |
| M12 | Chuyển động tròn đều, lực hướng tâm | 31 ✔, 32 ✔ | Đổi r, ω; thấy a_ht, F_ht | v, ω, T, f, a_ht, F_ht |
| M13 | Biến dạng lò xo, định luật Hooke | 33 ✔ | Treo vật, vẽ đồ thị F–Δl, tìm k | F, Δl, k |
| M14 | Khối lượng riêng, áp suất chất lỏng | 34 ✔ | Thả vật vào chất lỏng, đo áp suất theo độ sâu | ρ, h, p |
| M15 | Sai số phép đo (Chương Mở đầu) | 3 ✔ | Nhập số đo, tính sai số tuyệt đối/tương đối | Δ, δ |

## 2. Thứ tự làm (3 đợt)

- **Đợt 1 (cốt lõi, làm trước):** M2, M5, M6, M7, M9, M10. Đây là phần HS hay sai nhất và dùng nhiều nhất ở lớp 10.
- **Đợt 2:** M1, M3, M4, M8, M11, M12.
- **Đợt 3:** M13, M14, M15.

## 3. Cách làm chung (mỗi mô phỏng đi qua cùng một quy trình)

1. Thầy duyệt **phiếu mô phỏng 1 trang**: yêu cầu cần đạt, thông số, câu hỏi tự kiểm tra.
2. `fact-checker` tính lại công thức/số liệu bằng Python (cổng 1).
3. Dựng: **2D canvas + đồ thị** cho mô phỏng khái niệm (M1–M8, M10–M15); chỉ dùng **3D teardown** cho cơ cấu máy (M9). Một khung chung (vòng lặp, HUD, thanh trượt, đồ thị), chạy offline, một file HTML.
4. Kiểm tra Playwright: không lỗi console, chụp ảnh, thử các preset (cổng 3).
5. Mỗi mô phỏng kèm 1 phiếu học tập + 5 câu trắc nghiệm có đáp án.

## 4. Tiêu chí đạt chung
- Tiếng Việt, đúng thuật ngữ SGK; đơn vị SI.
- Mọi số trên màn hình lấy từ cùng một mô hình tính (không gõ tay).
- Chạy được trên điện thoại/laptop cũ; file nhẹ (< 1 MB).
- Có lưu ý rõ phần lý tưởng hóa (bỏ qua ma sát, vật điểm...).

## 5. Việc cần thầy quyết
1. Xác nhận/đối chiếu mục lục (nhất là các bài ◻) và bổ sung nội dung thầy coi là "nhất thiết".
2. Dùng mô phỏng để chiếu lớp hay cho HS tự thao tác trên điện thoại.
3. Có gắn vào app QLTT (giao bài, theo dõi) hay để file độc lập.

# Lịch thực hiện bộ mô phỏng Vật lí 10 (Kết nối tri thức)

Giả định: bắt đầu **thứ Hai 09/11/2026**, mỗi tuần làm 2 mô phỏng, thầy duyệt trong 1–2 ngày.
Đổi ngày bắt đầu thì dời cả lịch tương ứng. Số bài đánh ◻ cần thầy đối chiếu sách (xem `ke_hoach_mo_phong_vatli10.md`).

## 1. Nhịp làm mỗi mô phỏng (5 bước, lặp mỗi tuần)

| Ngày | Việc | Ai | Sản phẩm |
|---|---|---|---|
| Thứ 2 | Viết phiếu mô phỏng 1 trang (mục tiêu, thông số, tiêu chí nghiệm thu) | Claude | Phiếu |
| Thứ 3 | **Thầy duyệt phiếu** (cổng 1) | Thầy | "Đạt" hoặc ý sửa |
| Thứ 4–5 | Kiểm công thức bằng Python → dựng → kiểm tra Playwright | Claude | File HTML + ảnh kiểm tra |
| Thứ 6 | Gửi bản dùng thử + phiếu học tập + 5 câu trắc nghiệm | Claude | Link/file |
| T7–CN | **Thầy dùng thử, nhận xét** (cổng 2); sửa ở tuần sau | Thầy | Danh sách chỉnh sửa |

## 2. Lịch theo tuần

| Tuần | Ngày | Mô phỏng | Bài SGK | Mốc nghiệm thu |
|---|---|---|---|---|
| **Đợt 1 — cốt lõi** | | | | |
| 1 | 09–15/11 | M2 Chuyển động thẳng biến đổi đều · M5 Tổng hợp–phân tích lực | 8–9 ◻ · 13 ◻ | 15/11 |
| 2 | 16–22/11 | M6 Ba định luật Newton · M7 Trọng lực, lực căng, ma sát, lực cản | 14–16 ◻ · 17–19 ✔ | 22/11 |
| 3 | 23–29/11 | M9 Mômen lực (chỉnh bản đòn bẩy cho đúng sách 10) · M10 Công–cơ năng | 21 ✔ · 23–27 ◻ | **29/11: xong Đợt 1** |
| **Đợt 2** | | | | |
| 4 | 30/11–06/12 | M1 Độ dịch chuyển–vận tốc · M3 Rơi tự do | 4–5 ✔, 7 ◻ · 10–11 ◻ | 06/12 |
| 5 | 07–13/12 | M4 Ném ngang/xiên · M8 Bài toán động lực học | 12 ◻ · 20 ✔ | 13/12 |
| 6 | 14–20/12 | M11 Động lượng, va chạm · M12 Chuyển động tròn đều | 28–30 · 31–32 ✔ | **20/12: xong Đợt 2** |
| **Đợt 3** | | | | |
| 7 | 21–27/12 | M13 Định luật Hooke · M14 Áp suất chất lỏng | 33 ✔ · 34 ✔ | 27/12 |
| 8 | 28/12–03/01 | M15 Sai số phép đo · rà soát toàn bộ, đóng gói, hướng dẫn dùng | 3 ✔ | **03/01: bàn giao** |

Mỗi tuần dự phòng ~20% thời gian cho chỉnh sửa theo phản hồi của thầy. Tuần nào thầy chưa duyệt phiếu thì mô phỏng của tuần đó lùi lại, không bỏ cổng.

## 3. Tiêu chí nghiệm thu (đo được) cho từng mô phỏng

Mọi mô phỏng đều phải: tiếng Việt đúng thuật ngữ SGK, đơn vị SI, số trên màn hình lấy từ cùng một mô hình tính, chạy offline, không lỗi console, đọc được trên điện thoại.

| # | Điều phải đúng (kiểm bằng Python/ảnh chụp) |
|---|---|
| M1 | Độ dốc đồ thị d–t = vận tốc; khi vật đổi chiều, quãng đường s ≠ độ dịch chuyển d; hiện cả vận tốc trung bình và tức thời |
| M2 | v = v₀ + at, s = v₀t + ½at², v² − v₀² = 2as khớp công thức (sai lệch < 0,1%); phần diện tích dưới đồ thị v–t tô màu bằng đúng s; a < 0 (chậm dần) hiển thị đúng |
| M3 | t = √(2h/g); có/không lực cản; thả 2 vật khác khối lượng (không lực cản) rơi cùng lúc. Chốt g theo sách (9,8 hay 9,81) ◻ |
| M4 | Tầm xa L = v₀²sin2α/g, độ cao cực đại H = v₀²sin²α/(2g); α = 45° cho tầm xa lớn nhất; ném ngang tách vₓ và v_y |
| M5 | Kéo được 2 vectơ lực; hình bình hành; F² = F₁² + F₂² + 2F₁F₂cosα; phân tích 1 lực theo 2 phương vuông góc |
| M6 | a = F_hl/m; đồ thị a–F thẳng, a–1/m thẳng; ĐL3: cặp lực–phản lực đặt vào 2 vật khác nhau; bật/tắt ma sát |
| M7 | Mặt phẳng nghiêng: N = mg·cosα, F_ms = μN; vật trượt khi tanα > μ; hiện P, N, F_ms, T; lực cản/lực nâng ở mức định tính theo sách |
| M8 | Atwood: a = (m₂ − m₁)g/(m₁ + m₂), T = 2m₁m₂g/(m₁ + m₂); thầy/HS nhập đề, đối chiếu đáp số |
| M9 | M = F·d; vật cân bằng khi tổng mômen thuận chiều = tổng mômen ngược chiều; ẩn θ, ω mặc định; phạm vi nội dung theo sách 10 ◻ (có thể gồm ngẫu lực) |
| M10 | A = Fs·cosα, Wđ = ½mv², Wt = mgh; không ma sát: cơ năng bảo toàn (< 0,5%); có ma sát: độ giảm cơ năng = công lực ma sát; P = A/t; H = A_ích/A_tp; biểu đồ cột Wđ–Wt–W |
| M11 | Va chạm mềm và đàn hồi 1 chiều; tổng động lượng bảo toàn mọi trường hợp; động năng chỉ bảo toàn khi đàn hồi |
| M12 | v = ωr, a_ht = v²/r, F_ht = mv²/r, T = 2π/ω, f = 1/T; đổi r/ω thì các đại lượng đổi đúng |
| M13 | F = kΔl; vẽ đồ thị F–Δl, đọc k từ độ dốc; quá giới hạn đàn hồi có cảnh báo |
| M14 | p = ρgh (+ áp suất khí quyển nếu sách dùng); ρ = m/V; đổi chất lỏng/độ sâu thì áp suất đổi đúng |
| M15 | Δ trung bình, sai số tuyệt đối, sai số tương đối δ = ΔA/Ā đúng với bộ số mẫu của sách |

## 4. Rủi ro và cách xử lý

- **Chưa đối chiếu được mục lục và "yêu cầu cần đạt" chính thức:** thầy gửi mục lục/ảnh trang đầu mỗi chương hoặc cho phép đọc nguồn; tiêu chí trên là bản nháp để đối chiếu, không thay chương trình.
- **Thầy duyệt chậm:** lùi mô phỏng tương ứng, không dồn sang tuần khác.
- **Máy HS yếu:** dùng 2D, kiểm tra ở màn hình 1280×720 và điện thoại.
- **Sai số liệu so với sách:** mọi số sai khác (g, ký hiệu) chốt theo sách của thầy trước khi dựng.

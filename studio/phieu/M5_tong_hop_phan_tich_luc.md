# Phiếu mô phỏng M5 — Tổng hợp và phân tích lực
Trạng thái: **CHỜ THẦY DUYỆT** (cổng 1) · Bài SGK: 13 ◻ (thầy đối chiếu) · Tuần 1

## Mục tiêu (HS làm được gì)
1. Kéo hai lực F₁, F₂ đồng quy, thấy hợp lực là đường chéo hình bình hành.
2. Thấy độ lớn hợp lực thay đổi theo góc α giữa hai lực.
3. Phân tích một lực thành hai thành phần vuông góc (Fₓ, F_y) rồi tổng hợp lại.

## Thông số điều khiển
Độ lớn F₁, F₂: 0–20 N · góc α: 0°–180° (kéo đầu mũi tên hoặc thanh trượt) · chế độ "Tổng hợp" / "Phân tích" · bật/tắt lưới ô vuông và hình bình hành.

## Hiển thị
Vectơ F₁, F₂, F (tô màu cố định cho mỗi lực) · số liệu F₁, F₂, α, F, góc của F · công thức đang dùng.

## Công thức
F² = F₁² + F₂² + 2F₁F₂cosα · Fₓ = F·cosβ, F_y = F·sinβ · trường hợp đặc biệt α = 0°, 90°, 180°.

## Tiêu chí nghiệm thu
- F hiển thị khớp công thức, sai lệch < 0,1% (kiểm bằng Python).
- α = 0° → F = F₁ + F₂; α = 180° → F = |F₁ − F₂|; α = 90° → F = √(F₁² + F₂²).
- Phân tích rồi tổng hợp lại ra đúng lực ban đầu.
- Không lỗi console; đọc được ở 1280×720 và điện thoại.

## Ví dụ cho HS tự thử
F₁ = 3 N, F₂ = 4 N, α = 90° → F = 5 N.

## Thầy cần quyết
Sách dùng ký hiệu F⃗ hay F? Có cần bài "phân tích trọng lực trên mặt phẳng nghiêng" ngay ở đây hay để M7?

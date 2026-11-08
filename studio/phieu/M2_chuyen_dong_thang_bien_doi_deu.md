# Phiếu mô phỏng M2 — Chuyển động thẳng biến đổi đều
Trạng thái: **ĐÃ DỰNG — chờ thầy dùng thử** (file `mo_phong/M2_chuyen_dong_thang_bien_doi_deu.html`) · Bài SGK: 8–9 ◻ (thầy đối chiếu) · Tuần 1

## Mục tiêu (HS làm được gì)
1. Đổi gia tốc a và vận tốc ban đầu v₀, quan sát vận tốc tăng/giảm đều theo thời gian.
2. Đọc đồ thị v–t: độ dốc = gia tốc; **diện tích dưới đồ thị = quãng đường**.
3. Phân biệt chuyển động nhanh dần đều (a cùng dấu v) và chậm dần đều (a ngược dấu v).

## Thông số điều khiển
v₀: −10 đến 20 m/s · a: −5 đến 5 m/s² · thời gian chạy t: 0–10 s · nút Chạy / Dừng / Đặt lại · kéo thanh thời gian để xem lại.

## Hiển thị
Xe trên đường thẳng có thước · số liệu t, v, s, a · đồ thị v–t (tô diện tích) và đồ thị d–t · công thức đang dùng.

## Công thức (đã dùng trong mô hình)
v = v₀ + at · s = v₀t + ½at² · v² − v₀² = 2as (dùng chung một mô hình tính cho xe, số liệu và đồ thị).

## Tiêu chí nghiệm thu
- 3 công thức khớp số hiển thị, sai lệch < 0,1% (kiểm bằng Python).
- Diện tích tô dưới đồ thị v–t bằng đúng s.
- a < 0 và v đổi dấu: xe quay đầu, đồ thị đúng.
- Không lỗi console; đọc được ở 1280×720 và điện thoại.

## Ví dụ cho HS tự thử
(1) v₀ = 0, a = 2 → sau 5 s v = 10 m/s, s = 25 m. (2) v₀ = 10, a = −2 → dừng sau 5 s, s = 25 m.

## Thầy cần quyết
Giữ ký hiệu d hay x cho độ dịch chuyển theo sách? Có cần cả bài toán "ngược" (cho đồ thị, tìm a) không?

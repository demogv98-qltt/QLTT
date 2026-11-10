# Phiếu B7 – Máy phát điện xoay chiều và máy biến áp (Vật lí 12) *(◻ thầy xác nhận bài này thuộc Chương 3 hay chương Dòng điện xoay chiều)*
**Máy phát:** khung N vòng, S = 80 cm², quay đều n (vòng/s) trong từ trường đều B: Φ = NBS·cosωt; e = −dΦ/dt = NBSω·sinωt; điện trở khung 0,01 Ω/vòng; tải đèn R; E hiệu dụng = E₀/√2; P = I₀²R/2.
**Biến áp:** mạch tương đương: R₁ = 0,006·N₁ Ω, R₂ = 0,006·N₂ Ω, L_m = 2·10⁻⁵·N₁² H (≈ 5 H với 500 vòng), R_lõi = 20 kΩ·(N₁/500)², f = 50 Hz; giải bằng phasor. Chế độ “lí tưởng”: bỏ R₁, R₂, L_m, R_lõi.
**Kiểm chứng:** 6 phép kiểm B7: e = −dΦ/dt (đạo hàm số), E = E₀/√2 và P trung bình (tích phân số), pha Φ–e, biến áp lí tưởng, cân bằng công suất, **phasor = tích phân thời gian RK4 của mạch tương đương (sai số < 0,01 %)** + học sinh làm thử `bai_hoc_B7.mjs` (18 nhiệm vụ + 6 câu).
**Giả định:** lõi tuyến tính (không bão hoà/từ trễ), không có từ thông rò, tần số cố định 50 Hz, độ sáng đèn minh hoạ (không nhấp nháy).

# Phiếu mô phỏng W4 — Giao thoa sóng (Vật lí 11 KNTT, chương 2 Sóng, bài 9 ◻)

**Mục tiêu:** hiểu giao thoa của hai sóng kết hợp trên mặt nước; hiệu đường đi Δd = d₂ − d₁;
cực đại khi Δd = kλ, cực tiểu khi Δd = (k + ½)λ (hai nguồn cùng pha; ngược pha thì đổi chỗ); đường cực đại – cực tiểu là các hypebol;
số cực đại trên đoạn nối hai nguồn.
**Thiết bị:** khay sóng có nước, hai cần rung (dipper) kết hợp trên một thanh ngang, điểm khảo sát M (phao đỏ) kéo được, thước, đồng hồ.
**Điều chỉnh:** tần số f (1–3,5 Hz), tốc độ truyền v (0,2–0,45 m/s), khoảng cách hai nguồn a (0,15–0,5 m), cùng pha / ngược pha, vị trí M.
**Mô hình:** u = Σ cos(ωt − k·rᵢ + φᵢ) với rᵢ là khoảng cách tới nguồn i, tính từ lúc sóng tới (t ≥ rᵢ/v); biên độ tại điểm bất kì = 2A|cos(Δψ/2)|,
Δψ = k(r₂ − r₁) + (φ₁ − φ₂). Mặt nước vẽ bằng GPU từ cùng công thức; các số đo CPU dùng đúng công thức đó.
**Giới hạn:** bỏ qua sự giảm biên độ theo khoảng cách và phản xạ ở thành khay (có "bờ hấp thụ"), nên các nút triệt tiêu hoàn toàn; độ cao sóng được phóng đại để nhìn rõ.

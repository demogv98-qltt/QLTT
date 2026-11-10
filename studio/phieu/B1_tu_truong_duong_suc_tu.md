# Phiếu B1 – Từ trường và đường sức từ (Vật lí 12, Chương 3) *(tên/số bài: ◻ thầy đối chiếu sách)*

**Mô hình vật lí:** nam châm thanh = trụ từ hoá đều (a = 1,5 cm, L = 12 cm, độ từ dư Br) ≡ 24 vòng dây tròn (K = Br/μ₀), từ trường mỗi vòng tính bằng công thức elliptic (đúng).
Từ trường Trái Đất: thành phần ngang 40 µT hướng Bắc. Kim la bàn: dao động tắt dần quanh hướng của B tổng. Mạt sắt: xếp theo B nam châm khi B > ~120–360 µT (ma sát giữ lại nếu yếu hơn).
Đường sức: tích phân RK4 trong mặt phẳng chứa trục nam châm, xuất phát từ cực N theo seed cách đều theo từ thông (không vẽ tay).

**Nội dung bài học:** 15 nhiệm vụ + 5 câu trắc nghiệm: Trái Đất làm kim chỉ Bắc · chiều từ trường tại kim · mạt sắt · đường sức khép kín, N→S, không cắt nhau · đảo cực · đo B theo r (≈ 1/r³ ở xa) · tìm r mà B nam châm = B Trái Đất (kim lệch 45°).

**Giả định phải nói với học sinh:** nam châm lí tưởng từ hoá đều; chỉ vẽ đường sức trong mặt phẳng chứa trục (có chế độ 3D); Trái Đất bỏ qua thành phần thẳng đứng; kim coi như không có ma sát đáng kể.

**Kiểm chứng (độc lập):** `node studio/kiem_thu/kiem_dinh_vat_li.mjs` – 9 phép kiểm B1: công thức elliptic = tích phân số Biot–Savart (6e-14), tỉ số trục/trung trực = 2 và ∝ 1/r³ ở xa, B_trục = μ₀m/2πr³, ∇·B = 0 (7e-8), 3 đường sức khép kín, kim cân bằng arctan(B_NC/B_TĐ), r₄₅, đảo cực. Học sinh làm thử: `studio/kiem_thu/bai_hoc_B1.mjs`.

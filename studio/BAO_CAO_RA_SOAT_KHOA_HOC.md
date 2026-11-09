# Báo cáo rà soát khoa học các mô phỏng

## Giới hạn phải nói thẳng
- Không mở được phet.colorado.edu và javalab.org (mạng của môi trường làm việc chặn). **Chưa đối chiếu trực tiếp** với PhET/JavaLab.
- Không đọc được sách giáo khoa Kết nối tri thức: số bài, "yêu cầu cần đạt" cần thầy tự đối chiếu.
- Mô phỏng chỉ được chạy thử trên WebGL phần mềm (không phải card đồ họa thật).

## Cách kiểm chứng
Chạy `node studio/kiem_thu/kiem_dinh_vat_li.mjs`: tính lại độc lập bằng phương pháp khác với code mô phỏng
(RK4, sai phân hữu hạn phương trình sóng, bảo toàn năng lượng/động lượng, tích phân elliptic cho chu kỳ con lắc,
công thức đóng). Hiện: **50 đạt, 0 lỗi**. Hình học: `studio/kiem_thu/audit_khop_noi.mjs` (đầu dây hở, vật lơ lửng).

## Lỗi đã tìm và sửa
| Mô phỏng | Lỗi | Sửa |
|---|---|---|
| W2 cường độ sóng | Vẽ nửa mặt cầu nhưng công thức I=P/4πr² (cầu đầy đủ) | Vẽ cầu đầy đủ, ghi chú bỏ qua sàn/hấp thụ |
| W6 ống cộng hưởng | Chữ "âm thoa" nhưng hình là loa | Sửa chữ thành loa |
| Đòn bẩy KHTN8 | Preset "lợi về lực" F₁=22 N: 19,8 ≠ 18 N·m, không cân bằng | F₁=20 N (18 = 18) |
| Con lắc M10/M15, đòn bẩy, M3/M6/M8/M13/M14/W1/W5/S3/W6 | Dây ngược chiều, vật/cảm biến lơ lửng | Đã sửa trước đó, có công cụ audit |
| W4B giao thoa ánh sáng | Thiếu khe đơn S₀, không có nhiễu xạ | Dựng lại: S₀ → 2 khe → chồng sóng |

## Còn lại / cần thầy lưu ý
- Ghi chú sư phạm cần hiển thị: M9 (lực F ở O₂ đã gồm quả treo), M3 (mô hình lực cản chỉ gần đúng).
- Tim S3: thầy đánh giá chưa ổn, chưa làm lại.

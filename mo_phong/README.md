# Bộ mô phỏng 3D Vật lí 10 (Kết nối tri thức)

15 mô phỏng, mỗi mô phỏng là **một file HTML duy nhất, chạy offline** (không cần mạng, không cài gì).
Cách mở: bấm đúp vào file `.html` (Chrome, Edge hoặc Cốc Cốc). Máy yếu: vẫn chạy, nhưng hình sẽ kém mượt hơn.

Mỗi mô phỏng có sẵn:
- **Thiết bị thí nghiệm 3D** (xe, lực kế, lò xo, bể kính, con lắc…) và các đại lượng đọc ra từ **cùng một mô hình vật lí**.
- **Bài học dưới màn hình** (📘): mục tiêu → các nhiệm vụ từng bước (tự kiểm tra từ mô hình) → đoán trước rồi quan sát
  → câu trắc nghiệm có giải thích lỗi sai phổ biến → 5 câu kiểm tra cuối bài → ghi nhớ.
- **TEARDOWN** (phím `T`): bóc vỏ thiết bị, nhìn cấu tạo bên trong.
- **AUTO-TOUR**: tự giới thiệu khi để yên khoảng 25 giây; chạm hoặc bấm phím là học sinh cầm lái.
- 4 góc nhìn (phím `1`–`4`), kéo chuột để xoay, lăn chuột để phóng to/thu nhỏ.

| # | File | Nội dung (Vật lí 10 KNTT) | Nhiệm vụ trong bài học |
|---|---|---|---|
| M1 | `M1_do_dich_chuyen_van_toc_3D.html` | Độ dịch chuyển, quãng đường, vận tốc trung bình/tức thời, đồ thị d–t | 10 |
| M2 | `M2_chuyen_dong_bien_doi_deu_3D.html` | Chuyển động thẳng biến đổi đều: v = v₀ + at, s = v₀t + ½at², đồ thị v–t | 10 |
| M3 | `M3_roi_tu_do_3D.html` | Rơi tự do: ống Newton, bơm chân không, đo g = 2h/t² | 10 |
| M4 | `M4_chuyen_dong_nem_3D.html` | Ném ngang, ném xiên: tầm xa, độ cao cực đại, 2 thành phần chuyển động | 11 |
| M5 | `M5_tong_hop_phan_tich_luc_3D.html` | Tổng hợp và phân tích lực bằng 3 lực kế | 9 |
| M6 | `M6_ba_dinh_luat_Newton_3D.html` | Ba định luật Newton: xe quạt, hai xe đẩy nhau | 11 |
| M7 | `M7_ma_sat_mat_phang_nghieng_3D.html` | Lực ma sát, mặt phẳng nghiêng, đo μₛ bằng tanα | 12 |
| M8 | `M8_bai_toan_dong_luc_hoc_3D.html` | Bài toán động lực học: máy Atwood, xe và quả cân | 10 |
| M9 | `M9_momen_luc_can_bang_3D.html` | Mômen lực, điều kiện cân bằng của vật có trục quay | xem trong file |
| M10 | `M10_cong_co_nang_cong_suat_3D.html` | Con lắc đơn và cổng quang (cơ năng); tời điện (công, công suất, hiệu suất) | 14 |
| M11 | `M11_dong_luong_va_cham_3D.html` | Động lượng, va chạm mềm và đàn hồi | 11 |
| M12 | `M12_chuyen_dong_tron_deu_3D.html` | Chuyển động tròn đều: v = ωr, a = ω²r, F = mω²r, dây đứt | 13 |
| M13 | `M13_dinh_luat_Hooke_3D.html` | Định luật Hooke, độ cứng, đồ thị F–Δl, giới hạn đàn hồi | 15 |
| M14 | `M14_khoi_luong_rieng_ap_suat_3D.html` | Khối lượng riêng, áp suất chất lỏng p = ρgh, vật nổi/chìm | 16 |
| M15 | `M15_sai_so_phep_do_3D.html` | Sai số của phép đo, đo chu kì con lắc, tính g và sai số | 15 |

Ngoài bộ này còn: `../khtn8_don_bay_teardown.html` (đòn bẩy KHTN 8) và hai bản 2D cũ `M2_ban_2D_tam.html`, `M5_ban_2D_cu.html`
(giữ lại để so sánh, **không dùng để dạy**).

## Lưu ý quan trọng (trung thực về giới hạn)

- Tất cả đã được kiểm thử tự động bằng trình duyệt giả lập không có card đồ họa (WebGL phần mềm): mỗi bài học được "học sinh ảo"
  làm từ đầu đến cuối, kể cả cố ý trả lời sai. Chưa thử trên máy học sinh thật, nên **thầy nên mở thử từng bài trên máy phòng học
  trước giờ dạy**. Nếu bị giật: đóng bớt tab, hoặc dùng máy có card đồ họa.
- Số hiệu bài/trang SGK và lời "yêu cầu cần đạt" chính thức **chưa được đối chiếu với sách** (không truy cập được sách điện tử).
  Thầy đối chiếu giúp trước khi giao cho học sinh.
- Mô hình đã đơn giản hóa có chủ đích (bỏ qua sức cản không khí khi không nói tới, dây không giãn, v.v.); mỗi bài đều ghi rõ
  điều kiện trong phần giải thích.

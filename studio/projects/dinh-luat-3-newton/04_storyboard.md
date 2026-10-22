# 04 – Storyboard: Định luật 3 Newton (lực và phản lực)

Nộp để GATE 2 (thầy duyệt). Khung 16:9, 1920x1080, 30 fps. Phong cách theo studio/templates/phong_cach.md.

Bảng màu dùng chung:
- Nền `#0b1020`; chữ `#f5f7ff`.
- Lực / vectơ lực: `#ff6b6b`. Vận tốc: `#4dabf7`. Gia tốc: `#ffd43b`. Vật: `#e599f7`. Năng lượng `#51cf66` (không dùng trong video này).
- Chuyển cảnh: cắt hoặc fade 0,3 s. Font Be Vietnam Pro. Mỗi cảnh tối đa 1 công thức mới, hiện dần từng vế.
- Quy ước phân biệt cặp (xem "Vấn đề còn mở" số 1): cặp lực–phản lực = mũi tên đặc `#ff6b6b` có vạch nối nét liền giữa hai khung và nhãn "cặp"; cặp lực cân bằng = mũi tên `#ff6b6b` nét đứt, cùng nằm trong một viền vật.

Quy ước kỹ thuật mô phỏng: chiều dài mũi tên lực tỉ lệ độ lớn (1 N = 12 px ở cảnh xe lăn); mũi tên gia tốc tỉ lệ độ lớn (1 m/s² = 30 px); mọi mô phỏng tích phân thời gian thật (Euler nửa ẩn hoặc giải tích), không keyframe tay.

---

## S01 – Hook (0:00, 8 s)
- Lời đọc: Ngựa kéo xe với lực bằng đúng lực xe kéo ngựa. Vậy tại sao xe vẫn đi được?
- Hình: ngựa kéo xe (hình phẳng, phong cách minh họa tối giản, vật màu `#e599f7`) đi từ trái sang phải. Ở 0:03 hai mũi tên lực bằng nhau chớp giữa ngựa và xe. Ở 0:06 dấu "?" lớn hiện. Camera: tĩnh, zoom nhẹ 105% trong 8 s.
- Chữ: "Lực bằng nhau... sao xe vẫn đi?" (cuối cảnh).
- Màu: mũi tên `#ff6b6b`, vật `#e599f7`.
- Âm thanh: nhạc nền nhẹ bắt đầu; tiếng "ding" khi dấu "?" hiện (0:06).
- Kỹ thuật: minh họa không phải mô phỏng định lượng; mũi tên bằng nhau chính xác về chiều dài.

## S02 – Vì sao đáng quan tâm (0:08, 14 s)
- Lời đọc: Nhiều bạn nghĩ: hai lực bằng nhau thì triệt tiêu, nên không vật nào chuyển động được. Chúng ta sẽ tìm chỗ sai bằng một câu hỏi: mỗi lực đang đặt vào vật nào?
- Hình: 0:08-0:16 hai mũi tên bằng nhau, ngược chiều trên cùng một chấm; dấu "= 0 ?" xuất hiện, gạch chéo đỏ nhạt. 0:16-0:22 chữ lớn "Mỗi lực đặt vào vật nào?" nằm giữa; camera tĩnh.
- Chữ: "Hai lực bằng nhau => triệt tiêu?" (nhãn quan niệm sai, gạch ngang) rồi "Mỗi lực đặt vào vật nào?".
- Màu: `#ff6b6b` mũi tên; chữ câu hỏi `#f5f7ff`.
- Âm thanh: nhạc nền; SFX "whoosh" nhẹ khi chữ câu hỏi hiện.
- Kỹ thuật: hai mũi tên cùng điểm đặt chỉ để minh họa quan niệm sai (ghi nhãn "quan niệm sai" để học sinh không hiểu nhầm đây là cặp lực–phản lực).

## S03 – Thấy trước (1): hai xe lăn (0:22, 20 s)
- Lời đọc: Hãy xem hai xe lăn trên mặt bàn nhẵn, bỏ qua ma sát. Xe A nặng 1 ki-lô-gam, xe B nặng 2 ki-lô-gam, giữa hai xe là một lò xo bị nén. Thả tay: hai xe lao đi ngược chiều. Xe nhẹ chạy nhanh hơn.
- Hình (đổi hình theo nhịp, không quá 20 s): 
  - 0:22-0:32 cận cảnh hai xe kẹp lò xo nén trên mặt bàn nhìn ngang; nhãn khối lượng trên xe (A 1 kg, B 2 kg); xe A nhỏ hơn xe B.
  - 0:32-0:36 thả tay (bàn tay biến mất), lò xo bung, hai xe rời nhau.
  - 0:36-0:42 camera pan rộng, hai xe chạy ngược chiều; vết chuyển động (vệt mờ) cho thấy xe A đi xa gấp đôi xe B. Khoảnh khắc "ồ" thứ nhất: xe nhẹ chạy gấp đôi.
- Chữ: "Bỏ qua ma sát", "A: 1 kg", "B: 2 kg".
- Màu: xe `#e599f7`; lò xo `#f5f7ff`; vệt vận tốc/mũi tên vận tốc `#4dabf7` sau khi thả.
- Âm thanh: tiếng "tách" khi thả; tiếng lò xo bung; tiếng lăn nhẹ.
- Kỹ thuật (cho animation-engineer): m_A = 1 kg, m_B = 2 kg; lực tương tác F = 6 N, giữ không đổi trong thời gian tiếp xúc Δt = 0,5 s (lý tưởng hóa; lò xo thật có lực giảm dần, ghi chú trong video "lực lấy trung bình"). Kết quả: v_A = 3,0 m/s, v_B = 1,5 m/s (kiểm tra động lượng: 1x3 = 2x1,5). Sau Δt chuyển động thẳng đều (ma sát bằng 0). Lò xo khối lượng không đáng kể. Thang thời gian: 1x (không slow motion), hoặc chậm 0,5x trong pha tiếp xúc.

## S04 – Thấy trước (2): lực kế và gia tốc (0:42, 16 s)
- Lời đọc: Gắn hai lực kế nhỏ vào hai xe: cả hai cùng chỉ 6 niutơn. Lực bằng nhau, nhưng gia tốc khác nhau. Xe A có gia tốc 6 mét trên giây bình phương, xe B chỉ có 3.
- Hình: phát lại pha tiếp xúc ở chậm 0,25x; hai lực kế hiện ở hai xe, cùng chỉ 6 N (0:42-0:50). Hai mũi tên lực dài bằng nhau (72 px). Ở 0:50-0:58 hai mũi tên gia tốc màu vàng xuất hiện, dài 180 px (xe A) và 90 px (xe B).
- Chữ: "F = 6 N" ở cả hai lực kế; "a_A = 6 m/s²", "a_B = 3 m/s²".
- Màu: lực `#ff6b6b`; gia tốc `#ffd43b`; xe `#e599f7`.
- Âm thanh: tiếng "tick" khi mỗi số hiện.
- Kỹ thuật: a_A = F/m_A = 6/1 = 6,0 m/s²; a_B = 6/2 = 3,0 m/s²; tỉ số 2:1 khớp m_B/m_A. Đồng hồ thời gian chạy 0 đến 0,5 s ở góc để học sinh thấy là pha tiếp xúc.

## S05 – Giải thích: phát biểu định luật (0:58, 20 s)
- Lời đọc: Đây là định luật 3 Newton. Khi vật A tác dụng lên vật B một lực, thì B cũng tác dụng lại A một lực. Hai lực này cùng độ lớn, cùng phương, ngược chiều. Chúng đặt vào hai vật khác nhau, nên không triệt tiêu. Hai lực xuất hiện đồng thời.
- Hình: 0:58-1:04 tiêu đề "Định luật 3 Newton" rồi hai vật A và B tách thành hai khung riêng (hai ô). 1:04-1:12 mũi tên F_AB nằm trong khung B, mũi tên F_BA nằm trong khung A, nối bằng vạch nét liền ("cặp"). 1:12-1:18 hai mũi tên bật lên cùng một khung hình (đồng thời), kèm đồng hồ cho thấy t = 0 chung.
- Chữ: "Cùng độ lớn", "Cùng phương, ngược chiều", "Hai vật khác nhau", "Đồng thời".
- Màu: mũi tên `#ff6b6b`; vật `#e599f7`.
- Âm thanh: SFX "pop" khi mỗi nhãn hiện; hai mũi tên cùng một tiếng "ting" (nhấn đồng thời).
- Kỹ thuật: hai mũi tên cùng độ dài chính xác; không có trễ giữa hai mũi tên (cùng frame).

## S06 – Ẩn dụ: ngựa kéo xe, khung riêng của xe (1:18, 17 s)
- Lời đọc: Quay lại con ngựa, và tách riêng từng vật. Xét chiếc xe: ngựa kéo xe về trước, mặt đường cản xe về sau. Lực kéo lớn hơn lực cản thì xe tăng tốc. Hai lực bằng nhau thì xe chạy đều.
- Hình: 1:18-1:22 hình ngựa-xe tách thành hai khung. 1:22-1:35 phóng khung xe: mũi tên kéo (về trước) và mũi tên cản (về sau); mô phỏng xe: pha 1 kéo > cản, xe tăng tốc (vận tốc tăng, mũi tên `#4dabf7` dài dần); pha 2 kéo = cản, xe chạy đều (vận tốc không đổi). Camera: theo xe, nền cuộn.
- Chữ: "Chỉ xét lực tác dụng lên xe", "Ví dụ giả định: kéo 500 N, cản 300 N, xe 200 kg: a = 1,0 m/s²" (pha 1), "Kéo = cản: chạy đều" (pha 2).
- Màu: lực `#ff6b6b`; vận tốc `#4dabf7`; gia tốc `#ffd43b`; xe `#e599f7`.
- Âm thanh: tiếng bánh xe nhẹ; nhấn "tick" khi chuyển pha.
- Kỹ thuật: m_xe = 200 kg; pha 1: F_kéo = 500 N, F_cản = 300 N, a = 1,0 m/s² trong 4 s (v từ 0 đến 4,0 m/s); pha 2: lực cản tăng lên 500 N (mô phỏng cản tăng theo tốc độ), a = 0, v = 4,0 m/s không đổi. Số liệu là ví dụ giả định, ghi chữ "giả định".

## S07 – Ẩn dụ: ngựa kéo xe, khung riêng của ngựa (1:35, 13 s)
- Lời đọc: Xét con ngựa: xe kéo ngựa về sau. Nhưng mặt đất tác dụng lực ma sát nghỉ lên móng ngựa, hướng về trước. Chính lực này giúp ngựa tiến lên.
- Hình: 1:35-1:40 khung ngựa: mũi tên xe kéo ngựa về sau (đây là phản lực của lực ngựa kéo xe, nối vạch với cặp ở khung xe). 1:40-1:44 phóng cận móng ngựa chạm đất; mũi tên lực ma sát nghỉ của đất lên móng hướng về trước, nhấp nháy. Khoảnh khắc "ồ" thứ hai: lực đưa ngựa đi là của mặt đất. 1:44-1:48 hai khung (ngựa, xe) cạnh nhau, cặp "ngựa kéo xe / xe kéo ngựa" nối bằng vạch.
- Chữ: "Ma sát nghỉ của đất lên móng ngựa", "Cặp lực–phản lực: ngựa kéo xe / xe kéo ngựa".
- Màu: tất cả lực `#ff6b6b`; ngựa `#e599f7`.
- Âm thanh: tiếng móng ngựa nhẹ; "ting" nhấn ở lúc phóng cận.
- Kỹ thuật: ngựa đứng ở thời điểm xe tăng tốc: lực ma sát nghỉ phải lớn hơn lực xe kéo ngựa cộng lực cản lên ngựa (không ghi số, chỉ thể hiện chiều và độ lớn tương đối). Không ghi "đất đẩy ngựa".

## S08 – Ví dụ: người trên ván trượt đẩy tường (1:48, 8 s)
- Lời đọc: Người trượt ván đẩy tường: tường đứng yên mà người lùi ra, vì tường đẩy lại người.
- Hình: người trên ván trượt đẩy tường (tường bên phải); mũi tên người đẩy tường (đặt vào tường) và tường đẩy người (đặt vào người), người lùi ra trái, tường đứng yên. Camera: tĩnh, nhìn ngang.
- Chữ: "Giả định: lực 120 N, người 60 kg, a = 2,0 m/s²".
- Màu: lực `#ff6b6b`; vận tốc người `#4dabf7`; gia tốc `#ffd43b`; người `#e599f7`.
- Âm thanh: tiếng đẩy "bịch"; tiếng bánh ván lăn.
- Kỹ thuật: m_người = 60 kg, F = 120 N trong Δt = 0,5 s; a = 2,0 m/s²; v sau đẩy = 1,0 m/s, sau đó chuyển động đều (bỏ qua ma sát). Tường cố định (khối lượng rất lớn); không minh họa biến dạng tường (chỉ ghi chú nhỏ: tường biến dạng rất nhỏ).

## S09 – Ví dụ: bóng bay xì hơi (1:56, 7 s)
- Lời đọc: Quả bóng bay xì hơi cũng vậy: bóng đẩy khí ra sau, khí đẩy bóng về trước.
- Hình: quả bóng bay xì hơi, các hạt khí (chấm trắng) phụt ra sau, bóng bay vọt về trước; hai mũi tên cặp nối bằng vạch, đặt đúng vào bóng và vào khí. Camera theo bóng.
- Chữ: "Không cần bám vào không khí" (nhãn nhỏ).
- Màu: lực `#ff6b6b`; bóng `#e599f7`; hạt khí `#f5f7ff`.
- Âm thanh: tiếng xì hơi "pssh".
- Kỹ thuật: mô phỏng hạt đơn giản; chiều phụt khí ngược với chiều chuyển động của bóng; chỉ mang tính minh họa định tính (không ghi số).

## S10 – Bẫy: sách trên bàn (2:03, 19 s)
- Lời đọc: Cẩn thận cái bẫy này. Sách nằm trên bàn: trọng lực và lực nâng của bàn cùng đặt lên sách, nên là hai lực cân bằng. Lực nâng tuy hay gọi là "phản lực", nhưng không phải phản lực của định luật 3. Cặp đúng: sách ép bàn, bàn đỡ sách.
- Hình: 2:03-2:08 quyển sách trên bàn; hai mũi tên trên sách (trọng lực xuống, lực nâng lên) nét đứt, cùng khoanh một viền "cân bằng: CÙNG MỘT vật". 2:08-2:14 dấu "!" ở chữ "phản lực" (của lực nâng) có chú thích "chỉ là tên gọi". 2:14-2:22 chuyển sang cặp đúng: hai khung riêng (sách, bàn), mũi tên sách ép bàn trong khung bàn, mũi tên bàn đỡ sách trong khung sách, nối vạch "cặp" (nét liền). Khoảnh khắc "ồ" thứ ba (cảnh 10): cặp cân bằng và cặp lực–phản lực khác hẳn nhau.
- Chữ: "Cân bằng: cùng một vật", "Lực–phản lực: hai vật khác nhau".
- Màu: mũi tên lực `#ff6b6b` (nét đứt cho cân bằng, nét liền cho cặp lực–phản lực); sách `#e599f7`.
- Âm thanh: nhạc nền nhỏ; SFX cảnh báo nhẹ khi hiện dấu "!"; "ting" khi sang cặp đúng.
- Kỹ thuật: không cần số liệu; trọng lực và lực nâng cùng độ dài. Cặp lực–phản lực của trọng lực (sách hút Trái Đất) không minh họa ở cảnh này để tránh quá tải; chỉ nhắc nếu thầy muốn thêm.

## S11 – Công thức (2:22, 9 s)
- Lời đọc: Viết gọn: F_AB bằng trừ F_BA. Rồi áp dụng cho từng vật riêng: gia tốc a bằng tổng lực chia khối lượng.
- Hình: 2:22-2:26 công thức thứ nhất hiện dần từng vế: vế trái \(\vec F_{AB}\), dấu =, vế phải \(-\vec F_{BA}\). 2:26-2:31 công thức \(a = \dfrac{\sum F}{m}\) hiện dần; hai khung xe lăn nhỏ ở góc với a_A và a_B (nhắc lại cảnh xe lăn). Camera tĩnh. (Mỗi cảnh một công thức mới: công thức a = F/m đã học, nên chỉ nhắc lại.)
- Chữ: \(\vec F_{AB} = -\vec F_{BA}\); \(a = \dfrac{\sum F}{m}\).
- Màu: \(\vec F\) `#ff6b6b`; a `#ffd43b`; m `#e599f7`; dấu = và chữ khác `#f5f7ff`.
- Âm thanh: "tick" khi mỗi vế hiện.
- Kỹ thuật: dựng LaTeX; vế phải xuất hiện sau vế trái 0,5 s.

## S12 – Thử thách (2:31, 16 s)
- Lời đọc: Thử thách: xe tải đâm xe con. Lực nào lớn hơn? Hãy tạm dừng và nghĩ ba giây. Đáp án: bằng nhau, ở mỗi thời điểm lúc va chạm. Khác nhau là gia tốc.
- Hình: 2:31-2:37 xe tải và xe con chạy vào nhau; trước va chạm đóng băng khung hình, chữ "Lực nào lớn hơn?". 2:37-2:40 đồng hồ đếm ngược 3-2-1 (dừng, âm thanh ticking). 2:40-2:47 hiện đáp án: hai mũi tên lực bằng nhau; hai mũi tên gia tốc khác nhau (xe con dài hơn).
- Chữ: "Thử thách", "Lực nào lớn hơn?", đáp án "Bằng nhau (mỗi thời điểm lúc va chạm)", "Khác nhau: gia tốc".
- Màu: lực `#ff6b6b`; gia tốc `#ffd43b`; xe `#e599f7`.
- Âm thanh: đếm ngược "tick" mỗi giây; SFX đáp án "ding"; không dùng tiếng va chạm quá gắt.
- Kỹ thuật: minh họa định tính; tỉ lệ khối lượng minh họa xe tải : xe con = 3 : 1 (không ghi số lên màn hình); gia tốc xe con gấp 3 lần xe tải; hai lực bằng nhau trong mỗi khung hình va chạm.

## S13 – Tóm tắt 3 ý (2:47, 13 s)
- Lời đọc: Tóm lại ba ý. Một: lực và phản lực bằng nhau, ngược chiều, đặt vào hai vật khác nhau. Hai: chỉ cộng lực trên cùng một vật. Ba: tổng lực quyết định gia tốc.
- Hình: ba thẻ chữ lần lượt hiện từ trái sang phải (mỗi thẻ ~4 s), mỗi thẻ có biểu tượng nhỏ (hai khung vật; một khung vật với mũi tên cộng; mũi tên gia tốc). Camera tĩnh.
- Chữ: "1. Lực–phản lực: bằng nhau, ngược chiều, hai vật khác nhau", "2. Chỉ cộng lực trên cùng một vật", "3. Tổng lực quyết định gia tốc".
- Màu: thẻ nền tối hơn nền một chút; số thứ tự `#ffd43b`; chữ `#f5f7ff`.
- Âm thanh: "pop" mỗi thẻ.
- Kỹ thuật: không có.

## S14 – CTA (3:00, 6 s)
- Lời đọc: Hãy đăng ký kênh và viết đáp án thử thách vào bình luận nhé!
- Hình: màn hình kết, nút đăng ký, chữ "Đáp án của bạn?" ; fade ra 0,3 s cuối cảnh.
- Chữ: "Đăng ký kênh", "Đáp án của bạn?".
- Màu: nền `#0b1020`; nhấn `#ff6b6b`.
- Âm thanh: nhạc nền nhỏ dần.
- Kỹ thuật: không có.

---

## Bảng tổng thời lượng

| Cảnh | Bắt đầu | Thời lượng (s) | Số từ lời đọc (ước) |
|---|---|---|---|
| S01 Hook | 0:00 | 8 | 18 |
| S02 Vì sao đáng quan tâm | 0:08 | 14 | 34 |
| S03 Hai xe lăn | 0:22 | 20 | 47 |
| S04 Lực kế, gia tốc | 0:42 | 16 | 38 |
| S05 Phát biểu định luật | 0:58 | 20 | 51 |
| S06 Ngựa-xe (xe) | 1:18 | 17 | 41 |
| S07 Ngựa-xe (ngựa) | 1:35 | 13 | 30 |
| S08 Người đẩy tường | 1:48 | 8 | 17 |
| S09 Bóng bay | 1:56 | 7 | 17 |
| S10 Sách trên bàn | 2:03 | 19 | 46 |
| S11 Công thức | 2:22 | 9 | 22 |
| S12 Thử thách | 2:31 | 16 | 34 |
| S13 Tóm tắt | 2:47 | 13 | 34 |
| S14 CTA | 3:00 | 6 | 13 |
| **Tổng** | | **186 s (3:06)** | **~442 từ** |

Khớp kịch bản: ~442 từ ở 150 từ/phút là khoảng 177 s lời đọc, cộng khoảng 3 s dừng ở thử thách và khoảng nghỉ giữa cảnh, ra 186 s. Hơi vượt mục tiêu 3 phút khoảng 6 s, chấp nhận được cho bản chạy thử.

Nhịp: không cảnh nào quá 20 s; S03 và S05 (20 s) có đổi hình bên trong. Khoảnh khắc "ồ": 0:36 (xe nhẹ chạy gấp đôi), 1:40 (lực từ mặt đất lên móng ngựa), 2:14 (hai loại cặp lực khác hẳn nhau), 2:40 (đáp án thử thách). Khoảng cách giữa các "ồ" tối đa 86 s.

## Danh sách asset cần làm

1. Hình ngựa kéo xe (hai khung riêng: ngựa, xe), phong cách tối giản.
2. Mô phỏng hai xe lăn kẹp lò xo (m = 1 kg, 2 kg; F = 6 N, Δt = 0,5 s), kèm hai lực kế.
3. Bộ mũi tên lực/vận tốc/gia tốc có tỉ lệ độ dài chuẩn.
4. Mô phỏng xe chịu lực kéo 500 N và lực cản 300 N rồi 500 N (m = 200 kg).
5. Hình người trên ván trượt đẩy tường; chuyển động theo m = 60 kg, F = 120 N.
6. Hoạt ảnh bóng bay xì hơi và hạt khí.
7. Cảnh quyển sách trên bàn với hai kiểu khung (cân bằng nét đứt, cặp lực–phản lực nét liền).
8. Hoạt ảnh xe tải đâm xe con (tỉ lệ khối lượng 3 : 1).
9. Công thức LaTeX (2 công thức), thẻ tóm tắt 3 ý, màn hình CTA.
10. Âm thanh: nhạc nền nhẹ; SFX tick, ting, pop, whoosh, xì hơi, móng ngựa, lò xo bung; lời đọc tiếng Việt.

## Vấn đề còn mở cho GATE 2

1. Bảng phong cách chỉ có một màu cho lực; 01_nghien_cuu gợi ý "xanh cho cặp lực cân bằng" nhưng màu xanh `#4dabf7` đã dành cho vận tốc. Storyboard phân biệt bằng nét đứt/nét liền thay vì thêm màu mới; xin thầy xác nhận.
2. Tổng 3:06, vượt mục tiêu 3 phút khoảng 6 s; có thể cắt cảnh S09 (bóng bay, 7 s) nếu cần đúng 3:00.
3. Số liệu lò xo lý tưởng hóa (lực không đổi 0,5 s) khác lò xo thật; đã ghi chú trên màn hình ở S03.

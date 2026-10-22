# 02 – Kiểm chứng: Định luật 3 Newton

Người kiểm chứng đối chiếu 01_nghien_cuu.md với kiến thức giáo trình chuẩn (SGK Vật lý 10 GDPT 2018, Halliday, OpenStax) và tự tính lại bằng Python. Chưa tra web trực tiếp; đối chiếu bằng kiến thức giáo trình.

## 1. Bảng khẳng định

| # | Khẳng định (trích) | Kết luận | Nguồn đối chiếu | Sửa đề xuất |
|---|---|---|---|---|
| 1 | "cùng độ lớn, cùng phương, ngược chiều, cùng bản chất, xuất hiện và mất đi đồng thời" | ĐÚNG | SGK Vật lý 10; Halliday ch.5 | Nên thêm "đặt vào hai vật khác nhau" ngay trong cùng câu phát biểu. |
| 2 | "F_AB = -F_BA (vectơ)" | ĐÚNG | SGK, OpenStax | Không. |
| 3 | "xe đi được vì lực đẩy của ngựa lên xe lớn hơn lực cản lên xe" | CẦN SỬA | Định luật 2 | Chỉ đúng lúc xe đang tăng tốc. Khi xe chạy đều, lực kéo bằng lực cản. Sửa: "xe tăng tốc khi lực kéo lớn hơn lực cản; chạy đều khi hai lực bằng nhau". Nói "lực kéo của ngựa lên xe", tránh "đẩy". |
| 4 | "ngựa đi được vì lực đất đẩy ngựa lớn hơn lực cản lên ngựa" | CẦN SỬA | Ma sát nghỉ | Nêu rõ lực đó là lực ma sát nghỉ của mặt đất lên móng ngựa, hướng về trước. Cũng "lớn hơn" chỉ khi tăng tốc. |
| 5 | "Vật chuyển động hay không do tổng các lực tác dụng lên chính vật đó" | ĐÚNG (cần chính xác hóa) | Định luật 1, 2 | Chính xác: tổng lực quyết định GIA TỐC; vật có thể chuyển động đều khi tổng lực bằng 0. Tránh nói "có chuyển động hay không". |
| 6 | "'lực' hay 'phản lực' chỉ là cách gọi, không có lực nào đi trước" | ĐÚNG | SGK, Halliday | Không. |
| 7 | Điều kiện: "hệ quy chiếu quán tính, cho tương tác tiếp xúc và từ xa" | CẦN SỬA nhẹ | Giáo trình đại học | Ở mức lớp 10 chỉ cần nói "trong hệ quy chiếu quán tính". Dạng mạnh của ĐL3 không đúng cho mọi tương tác điện từ giữa điện tích chuyển động; không đưa vào video. |
| 8 | Lỗi 3: "xe tải đâm xe con, độ lớn lực hai bên bằng nhau" | ĐÚNG | Halliday | Nên ghi rõ "trong lúc va chạm, ở mỗi thời điểm". |
| 9 | Lỗi 4: "phản lực của trọng lực đặt lên Trái Đất; cặp đúng: sách ép bàn và bàn đỡ sách" | ĐÚNG | Halliday, OpenStax | Lưu ý: SGK dùng tên "phản lực" cho lực nâng N của bàn, nên cần giải thích khéo để học sinh không nhầm tên gọi với khái niệm. |
| 10 | "tường biến dạng rất nhỏ và đẩy lại" | ĐÚNG | Giáo trình (lực đàn hồi/pháp tuyến) | Không. |
| 11 | "Hai xe lăn... 1 kg và 2 kg: xe nhẹ nhận gia tốc gấp đôi" | ĐÚNG (có giả thiết) | a = F/m | Giả thiết: bỏ qua ma sát, hai xe đẩy nhau với cùng lực F. Tính lại ở mục 2. |
| 12 | "Hai lực kế móc vào nhau, số chỉ luôn bằng nhau" | ĐÚNG (có giả thiết) | Giáo trình | Giả thiết: lò xo lực kế khối lượng không đáng kể, hệ đứng yên hoặc gần cân bằng. |
| 13 | "Bơi: tay đẩy nước về sau, nước đẩy người về trước" | ĐÚNG | NASA | Không. |
| 14 | "Tên lửa/khinh khí cầu xì hơi: khí phụt ra sau..." | SAI (thuật ngữ) | - | "Khinh khí cầu" là khí cầu bay bằng khí nóng, không phải bóng xì hơi. Sửa: "tên lửa / quả bóng bay xì hơi". Tên lửa không cần "bám" không khí: ĐÚNG. |
| 15 | "Đi bộ: chân đẩy đất về sau, đất đẩy ta về trước (ma sát nghỉ)" | ĐÚNG | Giáo trình | Không. |
| 16 | "Newton công bố ba định luật năm 1687 trong Principia" | ĐÚNG | Lịch sử vật lý | Không. |
| 17 | Latin dịch: "Mọi tác dụng luôn có phản tác dụng bằng và ngược chiều" | ĐÚNG về ý, KHÔNG CHẮC về từng chữ | Principia | Dùng bản dịch có nguồn nếu trích nguyên văn. |
| 18 | "quả táo rơi là giai thoại" | ĐÚNG | Lịch sử | Nếu nhắc, nói rõ là giai thoại. |
| 19 | Mục tiêu brief: "giải thích vì sao vật vẫn chuyển động dù lực bằng nhau" | ĐÚNG | - | Nói chính xác: hai lực bằng nhau nhưng đặt vào hai vật khác nhau. |
| 20 | Brief: "Tránh nói 'tác dụng trước, phản ứng sau'" | ĐÚNG | - | Không. |

## 2. Tính lại bằng Python

Chạy bằng Python 3 (g = 9,81 m/s²; khối lượng Trái Đất 5,972e24 kg):

| Phép tính | Kết quả |
|---|---|
| Xe lăn: F = 6 N, m_A = 1 kg, m_B = 2 kg: a_A, a_B | a_A = 6,0 m/s²; a_B = 3,0 m/s² |
| Tỉ số a_A/a_B so với m_B/m_A | 2,0 = 2,0 (khớp) |
| Người 60 kg đẩy tường với 120 N: gia tốc người | 2,0 m/s² |
| Quả táo 0,1 kg: P = mg | 0,981 N (≈ 0,98 N) |
| Gia tốc Trái Đất do táo: P/M | 1,64e-25 m/s² (≈ 1,6e-25) |
| Ví dụ minh họa ngựa-xe: kéo 500 N, cản 300 N, m_xe = 200 kg | a = 1,0 m/s² |

Thứ nguyên: N = kg·m/s², a = F/m có đơn vị m/s²: nhất quán. Chữ số có nghĩa: các số đầu vào là số giả định minh họa (2 chữ số có nghĩa); khi đưa lên video không ghi quá 2–3 chữ số.

Giả thiết lý tưởng hóa phải nói rõ trong kịch bản: bỏ qua ma sát giữa xe lăn và mặt bàn; coi xe lăn là vật điểm; lò xo/lực kế khối lượng không đáng kể; số liệu ngựa-xe và người-tường là ví dụ giả định, không phải số đo thực.

## 3. Việc cần sửa trước khi viết kịch bản
1. Sửa khẳng định 3 và 4 (chỉ "lớn hơn" khi tăng tốc; chạy đều thì bằng nhau; nêu ma sát nghỉ cho ngựa).
2. Sửa khẳng định 14 (đổi "khinh khí cầu" thành "bóng bay").
3. Chính xác hóa khẳng định 5 (tổng lực quyết định gia tốc).
4. Bỏ phần "tương tác từ xa" khỏi nội dung video (khẳng định 7).
5. Khi dùng chữ "phản lực" cho lực nâng của bàn, giải thích rõ khác với "phản lực" trong định luật 3 (khẳng định 9).

## 4. Kết luận

**GATE 1: ĐẠT** (có điều kiện). Không có sai sót khoa học nghiêm trọng về phát biểu định luật và số liệu; các số tính lại đều khớp. Có 2 lỗi cần sửa ở bước kịch bản (khẳng định 3-4 về "lớn hơn", khẳng định 14 về thuật ngữ) và vài chỗ cần chính xác hóa. Còn mở: chưa tra web để xác nhận link và chưa đối chiếu số trang SGK; nên soát lại khi kiểm kịch bản.

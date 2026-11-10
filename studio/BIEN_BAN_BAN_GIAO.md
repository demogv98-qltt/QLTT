# BIÊN BẢN BÀN GIAO – Dự án mô phỏng 3D Vật lí/KHTN/Sinh cho thầy

*Người nhận: một tài khoản/phiên Claude khác (hoặc AI khác). Đọc hết file này và `AGENTS.md` ở gốc repo TRƯỚC khi làm. Giao tiếp với thầy hoàn toàn bằng tiếng Việt.*

## 1. Thư mục chứa mọi thứ

- **Repo:** `demogv98-qltt/QLTT` trên GitHub. Gốc repo trên máy làm việc của phiên trước: `/home/user/QLTT`.
- **Nhánh đang làm việc:** `ccr-97053430-355pfy` (đã push, cây git sạch ở commit `1482e3a`). **CHƯA merge vào `main`.** Nếu thầy muốn dùng, phải merge vào `main` rồi bảo thầy `git pull` (xem `AGENTS.md`). Lệnh `git pull origin main` trước khi sửa là bắt buộc theo quy ước dự án.
- Máy thầy: Windows, `C:\Users\THVL\QLTT` (máy làm app QLTT). Máy tên người dùng `THU PHUONG` chưa có dự án (tải về `C:\Users\THU PHUONG\QLTT` nếu cần).

| Thư mục/file | Chứa gì |
|---|---|
| `studio/sims/<mã>/` | **Mã nguồn** từng mô phỏng (5 file: `physics.js`, `rig.js`, `ui.js`, `bai_hoc.js`, `main.js`). Mã: `khtn8-lever`, `vl10-m1…m15`, `vl11-w1…w6 (+w4b)`, `sinh-s3`, `vl12-b1…b7`. Dùng chung: `studio/sims/kit-su-pham/` (`lesson.js` bài học, `tay_phai.js` bàn tay phải 3D), `studio/sims/khtn8-lever/stage.js` (sân khấu 3D). |
| `teardown-out/dist/<mã>.html` | Bản **build** một file `.html` (~1 MB, chạy offline). Sinh ra bằng lệnh build (mục 3). |
| `mo_phong/` | Bản đã xuất: Vật lí 10 (M1–M15, `M*_3D.html`). |
| `vat_li_11/` | Bản đã xuất: Sóng W1–W6. |
| `vat_li_12/` | Bản đã xuất **Chương 3 Từ trường B1–B7** + `README.md` (bảng trạng thái). |
| `sinh_hoc/` | Sinh học S3 (tim và tuần hoàn). |
| `khtn8_don_bay_teardown.html` | Đòn bẩy KHTN8. |
| `studio/phieu/*.md` | Phiếu mô tả từng mô phỏng (mô hình vật lí, giả định, cách kiểm chứng). |
| `studio/kiem_thu/` | **Bộ kiểm thử** (mục 4). |
| `studio/KE_HOACH_CHUONG3_TU_TRUONG_VL12.md` | Kế hoạch Chương 3 (B1–B7), mục ◻ là chỗ thầy cần đối chiếu sách. |
| `studio/BAO_CAO_RA_SOAT_KHOA_HOC.md` | Báo cáo rà soát khoa học các sim Vật lí 10/11 và đòn bẩy (lỗi đã sửa, giới hạn). |
| `.claude/agents/kiem-dinh-mo-phong.md` | **Agent phản biện** (chạy thử + soi lỗi, chỉ báo cáo, không sửa mã). |
| `DANH_SACH_LINK_XEM_TRUC_TUYEN.md` | 24 link artifact xem trực tuyến (Vật lí 10/11, KHTN8, Sinh). **Chưa có Chương 3.** |
| `app/` | App QLTT (Firebase `qltt-tlm`, gói Spark). Không liên quan trực tiếp tới mô phỏng, trừ việc nếu đưa mô phỏng lên web thầy thì chép vào `app/public/mo_phong`. |

## 2. Việc đã hoàn thành (đừng làm lại)

- KHTN8 đòn bẩy; Vật lí 10 M1–M15; Sinh S3 (tim, **thầy chưa hài lòng**); Vật lí 11 chương Sóng W1–W6 (W4B giao thoa ánh sáng đã dựng lại: khe đơn S₀ → hai khe → chồng sóng).
- Nút thu gọn hai thanh, ẩn thẻ tên, auto-tour có trong mọi sim.
- Rà soát khoa học Vật lí 10/11 (sửa W2 hình cầu đầy đủ, W6 loa thay âm thoa, preset đòn bẩy lợi lực cân bằng).
- **Chương 3 Từ trường Vật lí 12, 7 mô phỏng đều xong, đã phản biện và sửa:** B1 từ trường + đường sức + la bàn + mạt sắt; B2 từ trường dòng điện (dây thẳng, khung, ống dây) có **bàn tay phải 3D ẩn/hiện**; B3 lực từ lên dây dẫn; B4 thực hành cân dòng điện (hồi quy, sai số); B5 lực Lorentz, đo e/m; B6 cảm ứng điện từ (Faraday, Lenz, bàn tay phải); B7 máy phát điện xoay chiều + máy biến áp.
- Bộ kiểm định số độc lập: **97/97 đạt**.

## 3. Cách dựng/chạy

- Build một sim (từ gốc repo): `node ~/.claude/skills/teardown/sims/build.mjs studio/sims/vl12-b3` → ra `teardown-out/dist/vl12-b3.html`. Skill `teardown` nằm ở `~/.claude/skills/teardown` (chứa esbuild, three, font). Nếu tài khoản mới không có skill này, cần cài lại skill `teardown` trước.
- Sau khi build: chép file `.dist` sang thư mục xuất (VD `vat_li_12/B3_luc_tu_len_day_dan_3D.html`).
- Playwright/Chromium có sẵn trong môi trường (`$(npm root -g)/playwright/index.mjs`); mô phỏng chỉ chạy thử trên **WebGL phần mềm (SwiftShader)**, chưa thử card đồ họa thật.

## 4. Quy trình kiểm định BẮT BUỘC cho mỗi mô phỏng mới/sửa (4 lớp)

1. `node studio/kiem_thu/kiem_dinh_vat_li.mjs` – tính lại độc lập (RK4, tích phân số, công thức đóng). Hiện 97 đạt, 0 lỗi. Thêm phép kiểm khi thêm công thức.
2. `node studio/kiem_thu/bai_hoc_<Mã>.mjs <thư mục ảnh tạm>` – "học sinh" làm cả bài, cố ý trả lời sai.
3. `node studio/kiem_thu/audit_khop_noi.mjs <đường dẫn tuyệt đối .html> <BIẾN window> '[{"preset":0}]'` rồi chụp ít nhất 3 góc và NHÌN ảnh.
4. Agent phản biện (`.claude/agents/kiem-dinh-mo-phong.md`): chạy bằng công cụ Agent, **chỉ báo cáo**, mình sửa rồi chạy lại.

Bài học đã trả giá: bàn tay phải từng bị vẽ thành bàn tay trái; cờ `settled` phải tính cả trạng thái tức thời; kim la bàn cần nhiễu nhỏ; số trong lời giải phải lấy từ lần chạy thật; mọi vật phải chạm nhau (không lơ lửng). Xem `AGENTS.md` mục "Quy tắc dựng mô phỏng 3D" và "Kiểm định mô phỏng Vật lí 12".

## 5. Việc DANG DỞ (theo thứ tự đề nghị)

1. **Hỏi thầy xác nhận chương trình:** B5 (lực Lorentz) và B7 (máy phát/biến áp) có thuộc chương/bài thầy dạy không; tên/số bài theo sách KNTT (các chỗ ◻). AI không đọc được sách giáo khoa, đừng bịa số bài.
2. **Sinh học S3 (tim):** thầy từng nhận xét "Vẫn chưa ổn". Cần thầy chỉ rõ chỗ nào sai/thiếu rồi làm lại theo phong cách giải phẫu chuyên nghiệp (tim vẫn phải đập thấy được).
3. **Rà soát lại hình ảnh 15 mô phỏng Vật lí 10** theo quy tắc không lơ lửng, soi bằng agent phản biện (mới rà số liệu/khoa học, chưa phản biện hình từng cái).
4. **Rà soát lại bản cuối B1, B2, B3** bằng agent phản biện một lượt nữa (đã sửa theo báo cáo nhưng chưa phản biện lần hai; B4–B7 cũng nên một lượt cuối nếu còn thời gian).
5. **W4 (giao thoa sóng nước) trên máy yếu:** thêm chế độ chất lượng thấp.
6. **Đưa lên trang web của thầy:** quyết định nơi đặt (app QLTT trên Firebase `qltt-tlm` → chép vào `app/public/mo_phong` + `firebase deploy --only hosting`, sau khi merge vào `main`). Cập nhật `DANH_SACH_LINK_XEM_TRUC_TUYEN.md` cho Chương 3 (chưa có link artifact cho B1–B7).
7. **Việc kế tiếp thầy từng chọn cho app QLTT:** mã học sinh ngắn + QR VietQR (xem README.MD, chưa làm).

## 6. Giới hạn trung thực (phải nói lại với thầy, đừng giấu)

- **Không mở được PhET Colorado và JavaLab** trong môi trường (mạng bị chặn) → chưa từng đối chiếu trực tiếp; thầy nên tự mở "Magnet and Compass", "Faraday's Law" trên PhET để so.
- **Không đọc được sách giáo khoa KNTT.**
- Mới chạy thử trên **WebGL phần mềm**, chưa thử card đồ họa thật hay màn hình cảm ứng.
- Một số mô hình là xấp xỉ có ghi rõ trong phiếu (B5 từ trường đều trong bình lệch vài % đến ~10 %; B4 có sai số hệ thống ẩn l_eff = 0,988·l để dạy sai số; B7 lõi biến áp tuyến tính; hoạt cảnh B5 làm chậm hàng trăm triệu lần).
- Các quyết định về sư phạm trong B1–B7 do AI đề xuất, thầy chưa duyệt từng bài.

## 7. Cách thầy phản hồi và cách làm việc với thầy

- Thầy không rành kỹ thuật, copy-paste từng lệnh `cmd.exe`. Mọi chỉ dẫn phải từng bước, ngắn.
- Thầy rất để ý **uy tín khoa học**: "không muốn mất uy tín vì những cái sai". Luôn nói thẳng điều chưa kiểm được; không khẳng định đã đối chiếu PhET/sách khi chưa làm.
- Commit trên nhánh `ccr-97053430-355pfy` (hoặc nhánh mới, rồi merge `main`); không tạo PR nếu thầy không yêu cầu; không đẩy lên nhánh khác khi chưa có phép.

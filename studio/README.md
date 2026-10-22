# Studio Video Khoa học — Quy trình sản xuất

Studio làm video Vật lý chất lượng cao cho kênh/trung tâm của thầy. Mỗi video
đi qua **9 công đoạn**, mỗi công đoạn do 1 agent chuyên trách phụ trách, có
**cổng duyệt (gate)** bắt buộc trước khi sang công đoạn sau. Không bỏ gate.

## Đội ngũ (định nghĩa ở `.claude/agents/`)

| # | Agent | Vai trò | Đầu ra (trong `studio/projects/<slug>/`) |
|---|-------|---------|------------------------------------------|
| 0 | `studio-producer` | Điều phối, giữ tiến độ, gọi các agent theo thứ tự | `00_tien_do.md` |
| 1 | `science-researcher` | Nghiên cứu chủ đề, nguồn uy tín, lỗi quan niệm phổ biến | `01_nghien_cuu.md` |
| 2 | `fact-checker` | Kiểm chứng số liệu, công thức, đơn vị, đối chiếu SGK/GDPT 2018 | `02_kiem_chung.md` (GATE 1) |
| 3 | `script-writer` | Viết kịch bản (hook, ẩn dụ, mạch kể, CTA) | `03_kich_ban.md` |
| 4 | `storyboard-director` | Chia cảnh, bố cục, nhịp, ghi chú hình/âm từng cảnh | `04_storyboard.md` (GATE 2) |
| 5 | `animation-engineer` | Dựng mô phỏng/hoạt hình vật lý bằng code (Manim/Python) | `05_hoat_hinh/` |
| 6 | `audio-producer` | Lời đọc (TTS/thu âm), nhạc nền, hiệu ứng, phụ đề | `06_am_thanh/` |
| 7 | `video-editor` | Ráp cảnh + audio + phụ đề, màu sắc, xuất bản master | `07_ra_phim/` |
| 8 | `qa-reviewer` | Kiểm định cuối: khoa học, kỹ thuật, trải nghiệm (GATE 3) | `08_qa.md` |
| 9 | `publisher` | Tiêu đề, mô tả, thumbnail, chapter, lịch đăng, đo hiệu quả | `09_xuat_ban.md` |

## Luồng chạy

```
Ý tưởng → [1 Nghiên cứu] → [2 Kiểm chứng] ══GATE 1══▶ [3 Kịch bản]
 → [4 Storyboard] ══GATE 2══▶ ┬─ [5 Hoạt hình] ─┐
                              └─ [6 Âm thanh]  ─┴▶ [7 Dựng phim]
 → [8 QA] ══GATE 3══▶ [9 Xuất bản]
```
- 5 và 6 chạy **song song** (cùng đọc storyboard).
- Gate không qua → quay lại agent phụ trách lỗi, ghi lý do vào `00_tien_do.md`.

## Cách bắt đầu một video

1. Copy `studio/projects/_mau/` thành `studio/projects/<slug-chu-de>/`
   (VD `dinh-luat-3-newton`).
2. Điền `00_brief.md` (chủ đề, đối tượng, độ dài, mục tiêu học tập).
3. Gọi: *"Dùng studio-producer chạy video `<slug>`"* — producer tự điều phối
   các agent còn lại.
4. Có thể gọi lẻ từng agent, VD: *"science-researcher nghiên cứu chủ đề X"*.

## Tiêu chuẩn chất lượng (áp dụng mọi video)

- **Đúng khoa học là trên hết**: mọi số liệu/công thức có nguồn, đúng đơn vị SI.
- **Một video = một ý lớn**. Hook trong 10 giây đầu, nêu rõ câu hỏi cần trả lời.
- **Thấy trước khi nghe công thức**: ưu tiên mô phỏng, thí nghiệm, ẩn dụ
  trước, công thức sau.
- Nhịp: ≤ 20 giây không đổi hình; mỗi 60–90 giây có 1 "khoảnh khắc ồ".
- Hình: 1920×1080, 30 fps; chữ ≥ 48 px, tương phản đủ đọc trên điện thoại.
- Màu nhất quán (xem `studio/templates/phong_cach.md`).
- Phụ đề tiếng Việt có dấu 100% (SRT), kiểm tra chính tả.
- Tôn trọng bản quyền: chỉ dùng tư liệu tự tạo, CC0/CC-BY có ghi nguồn.
- Ngôn ngữ: tiếng Việt, thuật ngữ theo SGK Vật lý GDPT 2018.

## Công cụ đề xuất (cài khi cần, không đưa vào `app/`)

- Hoạt hình: `manim` (Python), `matplotlib`/`numpy` cho mô phỏng số.
- Dựng/ghép: `ffmpeg`. Phụ đề: file `.srt`.
- Giọng đọc: TTS tiếng Việt hoặc thu âm của thầy (ưu tiên giọng thầy).
- Lưu ý: file video nặng **không commit vào git** (đã chặn trong `.gitignore`);
  chỉ commit kịch bản, storyboard, mã hoạt hình.

## Liên hệ với app QLTT

Video xuất bản có thể gắn link vào bài học/lớp trong app (tính năng sau, hỏi
thầy trước khi làm). Studio này độc lập, không đụng `app/`.

## Lưu ý vận hành

Agent con thường không tự gọi được agent khác. Vì vậy cách chắc chắn nhất:
phiên Claude chính đóng vai Producer — đọc `.claude/agents/studio-producer.md`
rồi lần lượt giao việc cho từng agent theo bảng trên.

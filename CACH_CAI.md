# Cách cài skill `teardown` trên máy Windows (đã kiểm tra thế nào ở cuối file)

**Nguồn gốc (kiểm bằng lệnh):** skill `elvarofficial/teardown` trên GitHub (giấy phép MIT, © 2026 elvarofficial, whaleyxbt), được cài bằng `npx -y skills add elvarofficial/teardown -g -a claude-code -y`. File nén này là bản copy nguyên thư mục, **không có `node_modules`**.

## Cần có
- Node.js 20 trở lên (https://nodejs.org). Kiểm tra: mở `cmd`, gõ `node -v`.

## Bước 1 – Giải nén
Giải nén file `teardown-skill.zip` để ra thư mục `teardown`, đặt vào:

```
C:\Users\<tên người dùng>\.claude\skills\teardown
```
(Ví dụ: `C:\Users\THVL\.claude\skills\teardown`. Nếu chưa có thư mục `.claude\skills` thì tạo.)

## Bước 2 – Cài gói npm (chỉ làm một lần)
Mở `cmd` và gõ từng dòng:

```
cd %USERPROFILE%\.claude\skills\teardown
npm ci --ignore-scripts
```
(`npm ci` cài đúng phiên bản đã khoá trong `package-lock.json`. Không cần tải trình duyệt Playwright để **build** mô phỏng; chỉ cần nếu muốn quay video.)

Phiên bản các gói (lấy từ `package.json` và `package-lock.json`): esbuild 0.28.1; three 0.186.1; @fontsource/jetbrains-mono 5.3.0; @fontsource-variable/inter 5.3.0; playwright 1.58.2 (chỉ để quay video/chụp ảnh). Gói `teardown-kit` **không phải gói npm**: là thư mục `sims\kit` nằm ngay trong skill.

## Bước 3 – Build thử một mô phỏng
Trong thư mục dự án QLTT (ví dụ `C:\Users\THVL\QLTT`):

```
cd C:\Users\THVL\QLTT
node "%USERPROFILE%\.claude\skills\teardown\sims\build.mjs" studio\sims\vl12-b3
```
Kết quả: `teardown-out\dist\vl12-b3.html` (khoảng 980 KB, mở bằng Chrome/Edge, chạy offline).

## Đã kiểm tra gì và chưa kiểm tra gì
- Đã kiểm trên Linux: giải nén bản zip vào thư mục mới, `npm ci --ignore-scripts`, build `vl12-b3`: file ra **giống hệt từng byte** bản đang có.
- **Chưa** chạy trên Windows. Nếu lệnh ở bước 3 báo lỗi, gửi nguyên thông báo lỗi cho người hỗ trợ.

# Ghi chú cho AI agent làm việc trên dự án này

Tài liệu này dành cho AI (Antigravity, Claude Code, Copilot, ...) — không phải
tài liệu người dùng cuối. Đọc file này trước khi bắt đầu bất kỳ việc gì. Kiến
trúc/tính năng chi tiết xem `README.MD`; file này chỉ ghi những gì một agent
mới cần biết mà README không nói tới: người dùng là ai, quy trình test/deploy
thực tế, và các "bẫy" đã từng gặp phải.

## Người dùng là ai

Chủ trung tâm dạy Vật lý ("thầy"), **không rành kỹ thuật**. Thao tác trên
Windows, dùng `cmd.exe`, copy-paste từng lệnh một — không tự debug được nếu
lệnh lỗi. Khi cần thầy chạy lệnh:
- Luôn ghi lệnh copy-paste được, từng bước một, không gộp nhiều bước phức tạp
  vào một câu giải thích.
- Không giả định thầy biết các khái niệm terminal cơ bản (đường dẫn, biến môi
  trường, v.v.) — giải thích ngắn gọn nếu cần thầy tự thao tác (VD: mở Notepad,
  Save As).
- Toàn bộ giao tiếp bằng tiếng Việt.
- Dự án này được bán cho nhiều giáo viên khác dùng (SaaS) — xem phần "Vận hành
  SaaS" trong README.MD.

## Repo & branch

- Remote: `demogv98-qltt/QLTT` (GitHub). Nhánh chính: `main`.
- Thầy thao tác trên máy Windows tại `C:\Users\THVL\QLTT`, luôn `git pull` từ
  `main` trước khi deploy. Nếu agent làm việc trên nhánh riêng, **nhớ merge
  vào `main` và bảo thầy `git pull` lại** — nếu không thầy sẽ deploy nhầm bản
  cũ và không hiểu vì sao code mới "không có tác dụng".
- **Luôn `git pull origin main` NGAY TRƯỚC khi bắt đầu sửa code**, không chỉ
  trước khi deploy — kể cả khi mới mở lại dự án sau một thời gian, hoặc khi
  chưa chắc máy đang đứng ở nhánh nào (`git branch` để kiểm tra: nếu không
  phải `main`, hỏi lại thầy trước khi sửa). Dự án này có nhiều công cụ AI
  cùng làm việc (Antigravity, Claude Code, ...) trên cùng 1 máy/cùng 1 repo
  nhưng không tự động biết công cụ kia vừa đổi gì — nếu agent nào đó sửa code
  từ một bản cũ, khi push sẽ bị "conflict" (Git từ chối vì 2 bên cùng sửa một
  chỗ khác nhau), và nếu xử lý conflict sai chiều (chọn nhầm phía) sẽ **âm
  thầm xóa mất bản vá của bên kia** mà không ai nhận ra ngay — đã xảy ra thật
  một lần: Antigravity sửa code từ bản cũ (thiếu các bản vá bảo mật mới nhất
  của Claude Code), tạo conflict ở `AttendancePage.tsx`/`ClassesPage.tsx`, và
  bước resolve conflict ban đầu chọn nhầm phía làm mất bản vá chống trừ buổi
  học 2 lần — phải rà soát lại thủ công mới phát hiện ra. `git pull` trước
  khi sửa giúp tránh việc này ngay từ đầu.

## Firebase project thật

- Project ID: `qltt-tlm`. Config đã ghi ở `.firebaserc` (default project) —
  không cần `firebase use` thủ công nữa.
- Gói **Spark (miễn phí)** — cố tình không dùng Cloud Functions (xem README).
  Đừng thêm Cloud Functions/Cloud Run trừ khi thầy đồng ý đổi sang gói Blaze.
- `app/.env` **không nằm trong git** (đã có `app/.gitignore`), chỉ tồn tại
  trên máy thầy. Nếu agent chạy trong sandbox/CI không có file này, phải tự
  tạo tạm từ `app/.env.example` trước khi build.
- Deploy: `firebase deploy --only firestore:rules,firestore:indexes,hosting`
  (chỉ deploy phần đã đổi để đỡ chờ, VD chỉ đổi UI thì `--only hosting`).
- **Lỗi từng gặp**: `firebase deploy` báo "No currently active project" hoặc
  "Failed to get Firebase project qltt-tlm... permission" — không phải lỗi
  code. Nguyên nhân thường là phiên đăng nhập Firebase CLI trên máy thầy hết
  hạn hoặc sai tài khoản Google. Cách xử lý: `firebase login --reauth`, chọn
  đúng tài khoản Google đã tạo project trên Firebase Console.

## Cách test trước khi bảo thầy deploy

**Luôn tự test bằng Firestore Emulator trước khi yêu cầu thầy deploy lên
production** — thầy không tự debug được nếu deploy nhầm.

1. `firebase.json` đã cấu hình sẵn emulator (Auth :9099, Firestore :8080, UI
   :4000). Chạy: `npx firebase-tools emulators:start --only firestore,auth`
   (dùng `npx` vì môi trường sandbox có thể không có `firebase-tools` cài
   sẵn — nó sẽ tự tải bản mới nhất).
2. Đổi tạm `app/.env`: `VITE_USE_FIREBASE_EMULATOR=true`, `VITE_FIREBASE_PROJECT_ID=qltt-dev`
   (project id không quan trọng khi chạy emulator, chỉ cần khớp giữa `.env`
   và lệnh emulator/seed script). **Nhớ backup `.env` gốc trước và khôi phục
   lại sau khi test xong** — nếu quên, lần build/deploy tiếp theo sẽ vô tình
   build vào project demo thay vì `qltt-tlm`.
3. Để dựng dữ liệu mẫu nhanh (org/user/enrollment/payment/attendance...) mà
   không phải click tay qua UI, cài tạm `firebase-admin` (KHÔNG lưu vào
   `package.json`: `npm install firebase-admin --no-save --no-package-lock`
   trong `app/`), viết script Node dùng Admin SDK (bỏ qua rules — chỉ dùng để
   seed dữ liệu, không dùng để test rules) trỏ vào
   `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` /
   `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`. Chạy bằng `npx tsx script.mts`
   (tsx tự tải qua npx, không cần cài). **Gỡ `firebase-admin` lại
   (`npm uninstall firebase-admin --no-save`) sau khi xong** — nó không phải
   dependency thật của app.
4. Để test đúng **Firestore Rules** (không phải chỉ test logic), phải test
   qua Client SDK (`firebase/firestore`) đã đăng nhập bằng tài khoản
   Auth thật (`signInWithEmailAndPassword` qua Auth emulator), không phải
   Admin SDK — Admin SDK luôn bỏ qua rules nên không phát hiện được lỗi phân
   quyền.
5. Sau khi test xong: tắt emulator (`lsof -ti:8080,9099 -sTCP:LISTEN | xargs
   kill`), xoá script test tạm, gỡ `firebase-admin`, khôi phục `.env`, rồi mới
   `npm run build` thật để xác nhận build production sạch trước khi bảo thầy
   deploy.

### Bẫy khi test transaction/concurrency trên emulator

Emulator Firestore đôi khi trả `PERMISSION_DENIED` (không phải `ABORTED`) cho
transaction thua trong một race điều kiện thật (hai transaction cùng sửa một
document), ngay cả khi rule + logic đã đúng — đây là hạn chế của bản thân
emulator, không phải bug code. Do đó code xử lý race (VD
`app/src/lib/creditDeduction.ts`) nên tự phòng thủ: sau khi transaction lỗi,
đọc lại document để xác nhận "có phải đối thủ đã thắng rồi" trước khi coi đó
là lỗi thật — xem comment trong file đó để hiểu rõ pattern.

## Quy ước code trong dự án này

- Toàn bộ UI text bằng tiếng Việt (không mix tiếng Anh trừ tên biến/field).
- Mọi collection Firestore đều có field `orgId`; mọi rule đọc/ghi trong
  `firestore.rules` đều kiểm tra `orgId` khớp — khi thêm collection/field mới,
  **luôn** thêm field `orgId` và rule kiểm tra tương ứng, đừng chỉ dựa vào
  `centerId`/`centerIds`.
- Khi thêm một field Firestore có thể bị client tự ý sửa giá trị (không chỉ
  tên field) — như bài học từ vụ vá `enrollments.usedSessions` — rule phải
  ràng buộc **giá trị** (VD `request.resource.data.x == resource.data.x + 1`),
  không chỉ ràng buộc `affectedKeys()`.
- Query Firestore nhiều field: rule chỉ chấp nhận list-query nếu **mọi field
  rule đọc** cũng nằm trong filter của chính query đó (thường phải thêm cả
  `orgId` lẫn `centerId` vào `where()`, không chỉ field đang thật sự cần lọc).
- Composite index: `firestore.indexes.json` — khi thêm query mới có
  range/orderBy, kiểm tra index đã đủ chưa trước khi test (Firestore sẽ báo
  lỗi kèm link tạo index nếu thiếu, nhưng agent chạy trong sandbox không mở
  được link đó — phải tự thêm vào `firestore.indexes.json`).
- Trước khi coi một trang là xong: `npx tsc -b --noEmit` (typecheck) rồi
  `npm run build` (trong `app/`) phải sạch, không chỉ dựa vào việc code "nhìn
  có vẻ đúng".
- Dùng skill dataviz (nếu công cụ AI có hỗ trợ) trước khi vẽ biểu đồ mới — màu
  đã dùng trong app: trạng thái điểm danh (present/makeup/excused/unexcused)
  có bảng màu cố định trong `DashboardPage.tsx`, doanh thu dùng 1 màu indigo
  (`#4f46e5`, đã validate qua script của skill) — giữ nhất quán, đừng bịa màu
  mới cho cùng loại dữ liệu.

## Việc tồn đọng (theo thứ tự ưu tiên thầy từng chọn)

Xem mục "Trạng thái hiện tại" trong `README.MD`. Việc kế tiếp thầy có thể yêu
cầu: mã học sinh ngắn + QR VietQR cho thanh toán (đã có trong backlog, chưa
làm — thầy đã ưu tiên các việc khác trước).

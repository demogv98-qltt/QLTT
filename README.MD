# QLTT — Quản lý Trung tâm Vật lý (3 cơ sở)

App quản lý trung tâm dạy thêm Vật lý nhiều cơ sở: điểm danh theo buổi thực tế,
học phí theo gói buổi học (tự động trừ khi điểm danh), và ghi nhận thanh toán
thủ công. Xem quy hoạch đầy đủ ở tài liệu quy hoạch gốc (đã trao đổi lúc khởi
tạo dự án).

## Kiến trúc thư mục

```
app/                    Frontend: React (Vite, TS) + Tailwind + Zustand + react-router
firestore.rules         Quy tắc bảo mật Firestore (phân quyền theo vai trò + cơ sở)
firestore.indexes.json  Composite index cho các query dùng trong app
firebase.json           Cấu hình project Firebase + emulator suite
```

Không có Cloud Functions — toàn bộ logic nghiệp vụ (gán vai trò owner cho tài
khoản đầu tiên, tự động trừ buổi khi điểm danh) chạy trực tiếp ở client
(`app/src/stores/authStore.ts`, `app/src/lib/creditDeduction.ts`), được bảo vệ
bởi Firestore Security Rules. Lý do: Cloud Functions bắt buộc project ở gói
**Blaze** (trả theo dùng, cần thẻ ngân hàng); chạy ở client giữ được gói
**Spark** (miễn phí tuyệt đối, không cần thẻ). Đánh đổi: logic chạy trên trình
duyệt thay vì server — vẫn an toàn nhờ Security Rules (xem phần "Bảo mật" bên
dưới), nhưng kém chặt chẽ hơn một chút so với chạy ở server.

## Yêu cầu

- Node.js 20+
- Firebase CLI (`firebase-tools`, đã có trong `devDependencies` gốc — chạy qua `npx firebase` hoặc `npm run emulators`)

## Chạy local với Firebase Emulator (không cần project Firebase thật)

1. Cài dependencies:
   ```
   npm install                    # root (firebase-tools)
   npm --prefix app install
   ```
2. Khởi động emulator suite (Auth + Firestore, UI tại http://127.0.0.1:4000):
   ```
   npm run emulators
   ```
3. Ở terminal khác, chạy frontend (mặc định `app/.env` đã bật `VITE_USE_FIREBASE_EMULATOR=true` để tự kết nối tới emulator, không cần config Firebase project thật):
   ```
   npm --prefix app run dev
   ```

### Tài khoản đầu tiên (bootstrap owner)

Tài khoản **đăng ký đầu tiên** trong hệ thống tự động được gán vai trò **Chủ
trung tâm (owner)** (xem `signUp()` trong `app/src/stores/authStore.ts`). Các
tài khoản đăng ký sau đó mặc định là "Học sinh/Phụ huynh" — owner/manager vào
trang **Nhân sự** để nâng quyền thành Quản lý/Giáo viên/Trợ giảng và gán cơ sở
phụ trách.

Luồng khởi tạo dữ liệu cho một trung tâm mới:
1. Đăng ký tài khoản đầu tiên → tự động là owner.
2. Vào **Cơ sở** → tạo cơ sở đầu tiên.
3. Các tài khoản GV/TA khác tự đăng ký, sau đó owner/manager vào **Nhân sự**
   gán vai trò + cơ sở cho họ.
4. Vào **Học sinh**, **Lớp/Ca học** để tạo dữ liệu, sau đó **Gói buổi học** để
   bán gói cho học sinh.
5. GV/TA vào **Điểm danh** để điểm danh — hệ thống tự trừ buổi trong gói.

## Bảo mật khi chạy logic ở client

- **Gán owner đầu tiên**: `firestore.rules` chỉ cho phép một tài khoản tự nhận
  vai trò `owner` khi đồng thời tạo document đánh dấu `meta/bootstrap` trong
  cùng transaction, và document đó chỉ được tạo đúng một lần (rule của chính
  nó chặn lần thứ hai). Vì vậy không có cách nào để tự phong owner sau khi đã
  có owner đầu tiên.
- **Trừ buổi học**: `firestore.rules` cho phép giáo viên/TA (không chỉ
  owner/manager) cập nhật enrollment, nhưng **chỉ giới hạn 3 field**
  (`usedSessions`, `remainingSessions`, `active`) — không thể sửa giá tiền,
  tổng số buổi, hay các field tài chính khác qua đường này.

## Cấu hình cho Firebase project thật (deploy)

Vì không dùng Cloud Functions, project chỉ cần gói **Spark (miễn phí)** —
không cần thẻ ngân hàng.

1. Tạo project trên Firebase Console, bật Authentication (Email/Password) và
   Firestore.
2. Copy `app/.env.example` → `app/.env`, điền các biến `VITE_FIREBASE_*` lấy
   từ cấu hình web app trên Firebase Console, và đặt
   `VITE_USE_FIREBASE_EMULATOR=false`.
3. Đăng nhập Firebase CLI (`npx firebase login`) rồi deploy:
   ```
   npx firebase deploy --only firestore:rules,firestore:indexes,hosting --project <project-id>
   ```

## Trạng thái hiện tại (MVP — Giai đoạn 1 theo quy hoạch)

Đã có:
- Quản lý cơ sở / học sinh / lớp (ca học lặp lại hàng tuần) / nhân sự
- Điểm danh theo buổi thực tế + tự động trừ 1 buổi trong gói (FIFO theo ngày
  mua, ưu tiên gói còn hạn dùng), cảnh báo "sắp hết buổi" ở trang Gói buổi học
  và Dashboard
- Bán gói buổi học (session-pack) và gói tháng, ghi nhận thanh toán thủ công +
  tổng hợp công nợ theo học sinh
- Phân quyền theo vai trò (Owner/Manager/TA/Teacher/Parent) qua Firestore
  Security Rules, scoping theo cơ sở

Chưa làm (Giai đoạn 2-4 theo quy hoạch, chưa trong phạm vi hiện tại):
- Bảng lương tự động theo điểm danh, báo cáo tháng tổng hợp 3 cơ sở, xuất
  PDF/Excel tự động
- Cổng xem riêng cho Học sinh/Phụ huynh (hiện tại role `parent` đã có trong
  data model + rules nhưng chưa có giao diện)
- App/PWA điểm danh riêng cho GV/trợ giảng

### Giới hạn đã biết

- Xóa một bản ghi điểm danh (owner/manager) **không** hoàn lại buổi đã trừ
  trong gói — cần điều chỉnh thủ công ở trang Gói buổi học nếu điểm danh nhầm.
- Chưa có cơ chế mời tài khoản qua email; nhân sự mới cần tự đăng ký trước,
  sau đó owner/manager mới gán được vai trò.

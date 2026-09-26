# QLTT — Quản lý Trung tâm Vật lý (SaaS đa khách hàng)

Phần mềm quản lý trung tâm dạy thêm Vật lý, bán cho nhiều giáo viên/trung tâm
khác nhau: mỗi trung tâm đăng ký là một **tổ chức (organization)** hoàn toàn
tách biệt — không thấy và không ảnh hưởng tới dữ liệu của trung tâm khác. Mỗi
tổ chức có thể vận hành nhiều **cơ sở (center)**. Tính năng cốt lõi: điểm danh
theo buổi thực tế, học phí theo gói buổi học (tự động trừ khi điểm danh), và
ghi nhận thanh toán thủ công.

## Kiến trúc thư mục

```
app/                    Frontend: React (Vite, TS) + Tailwind + Zustand + react-router
firestore.rules         Quy tắc bảo mật Firestore (phân quyền theo tổ chức + vai trò + cơ sở)
firestore.indexes.json  Composite index cho các query dùng trong app
firebase.json           Cấu hình project Firebase + emulator suite
```

Không có Cloud Functions — toàn bộ logic nghiệp vụ (tạo tổ chức mới/tham gia
tổ chức lúc đăng ký, tự động trừ buổi khi điểm danh) chạy trực tiếp ở client
(`app/src/stores/authStore.ts`, `app/src/lib/creditDeduction.ts`), được bảo vệ
bởi Firestore Security Rules. Lý do: Cloud Functions bắt buộc project ở gói
**Blaze** (trả theo dùng, cần thẻ ngân hàng); chạy ở client giữ được gói
**Spark** (miễn phí tuyệt đối, không cần thẻ). Đánh đổi: logic chạy trên trình
duyệt thay vì server — vẫn an toàn nhờ Security Rules (xem phần "Bảo mật" bên
dưới), nhưng kém chặt chẽ hơn một chút so với chạy ở server.

## Mô hình đa khách hàng (multi-tenant)

- `organizations/{orgId}`: một khách hàng (một trung tâm) = một tổ chức.
- `users/{uid}.orgId`, và **mọi** collection khác (`centers`, `students`,
  `classes`, `enrollments`, `attendance`, `payments`, `creditLedger`, ...) đều
  có field `orgId` — Firestore Rules kiểm tra field này ở **mọi** rule đọc/ghi,
  đảm bảo hai tổ chức không bao giờ thấy dữ liệu của nhau, kể cả khi có lỗi ở
  chỗ khác (không chỉ dựa vào `centerIds` của user).
- Đăng ký tài khoản có 2 lựa chọn (trang `/signup`):
  - **Tạo trung tâm mới**: tự động trở thành `owner` của một tổ chức mới.
  - **Tham gia trung tâm có sẵn**: nhập **mã trung tâm** (chính là `orgId`,
    owner xem/chia sẻ ở trang **Nhân sự**) → tài khoản mặc định là "Học
    sinh/Phụ huynh", sau đó owner/manager của tổ chức đó vào Nhân sự để nâng
    quyền.

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

### Luồng khởi tạo dữ liệu cho một trung tâm mới

1. Đăng ký tài khoản, chọn "Tạo trung tâm mới" → tự động là owner của tổ chức mới.
2. Vào **Cơ sở** → tạo cơ sở đầu tiên.
3. Các tài khoản GV/TA/phụ huynh khác tự đăng ký, chọn "Tham gia trung tâm có
   sẵn" và nhập mã trung tâm (owner lấy mã này ở trang **Nhân sự**), sau đó
   owner/manager vào **Nhân sự** gán vai trò + cơ sở cho họ.
4. Vào **Học sinh**, **Lớp/Ca học** để tạo dữ liệu, sau đó **Gói buổi học** để
   bán gói cho học sinh.
5. GV/TA vào **Điểm danh** để điểm danh — hệ thống tự trừ buổi trong gói.

## Bảo mật khi chạy logic ở client

- **Tạo tổ chức mới / gán owner**: `firestore.rules` chỉ cho phép một tài
  khoản tự nhận vai trò `owner` khi đồng thời tạo document
  `organizations/{orgId}` mới (chưa tồn tại) trong cùng transaction, và mỗi
  `orgId` chỉ được tạo đúng một lần (rule của chính `organizations/{orgId}`
  chặn ghi đè). Vì vậy không có cách nào để tự phong owner của một tổ chức đã
  có chủ.
- **Tham gia tổ chức có sẵn**: chỉ được tự nhận vai trò `parent` (thấp nhất),
  và chỉ khi `orgId` nhập vào **thực sự tồn tại** — nhập sai mã sẽ bị Firestore
  từ chối ghi (không tạo được tài khoản "lơ lửng" thuộc tổ chức không tồn tại).
- **Cách ly dữ liệu giữa các tổ chức**: mọi rule đọc/ghi trên mọi collection
  đều kiểm tra `resource.data.orgId == myOrgId()` — không chỉ dựa vào
  `centerIds` của user (để dù có sai sót ở tầng đó, dữ liệu tổ chức khác vẫn
  không lộ ra).
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
- Kiến trúc SaaS đa khách hàng: mỗi trung tâm đăng ký là một tổ chức tách biệt,
  quản lý nhiều cơ sở
- Quản lý cơ sở / học sinh / lớp (ca học lặp lại hàng tuần) / nhân sự
- Điểm danh theo buổi thực tế + tự động trừ 1 buổi trong gói (FIFO theo ngày
  mua, ưu tiên gói còn hạn dùng), cảnh báo "sắp hết buổi" ở trang Gói buổi học
  và Dashboard
- Bán gói buổi học (session-pack) và gói tháng, ghi nhận thanh toán thủ công +
  tổng hợp công nợ theo học sinh
- Phân quyền theo vai trò (Owner/Manager/TA/Teacher/Parent) qua Firestore
  Security Rules, scoping theo tổ chức + cơ sở

Chưa làm (Giai đoạn 2-4 theo quy hoạch, chưa trong phạm vi hiện tại):
- Bảng lương tự động theo điểm danh, báo cáo tháng tổng hợp nhiều cơ sở, xuất
  PDF/Excel tự động
- Cổng xem riêng cho Học sinh/Phụ huynh (hiện tại role `parent` đã có trong
  data model + rules nhưng chưa có giao diện)
- App/PWA điểm danh riêng cho GV/trợ giảng
- Thu phí/thanh toán từ giáo viên mua phần mềm (hiện tại tạo tổ chức mới là
  miễn phí, không có luồng billing)

### Giới hạn đã biết

- Xóa một bản ghi điểm danh (owner/manager) **không** hoàn lại buổi đã trừ
  trong gói — cần điều chỉnh thủ công ở trang Gói buổi học nếu điểm danh nhầm.
- Chưa có cơ chế mời tài khoản qua email; nhân sự mới cần tự đăng ký (dùng mã
  trung tâm) trước, sau đó owner/manager mới gán được vai trò.

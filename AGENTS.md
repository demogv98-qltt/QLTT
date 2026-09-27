# AGENTS.md — Ghi chú vận hành & Quy ước phát triển dự án QLTT

Tài liệu này dành cho AI Agent và các lập trình viên tham gia phát triển dự án QLTT (Quản lý Trung tâm Dạy thêm - SaaS đa khách hàng).

---

## 1. Hồ sơ người dùng & Nguyên tắc tương tác
- **Người dùng:** Chủ trung tâm / Thầy quản lý trung tâm, **không chuyên về kỹ thuật lập trình**.
- **Môi trường thao tác:** Windows Command Prompt (`cmd.exe`) hoặc PowerShell.
- **Nguyên tắc hướng dẫn:**
  - Hướng dẫn rõ ràng, chi tiết, từng bước một.
  - Các lệnh đưa ra phải copy-paste chạy được ngay trên Windows cmd/PowerShell.
  - Tránh các lệnh chỉ chạy được trên Linux/macOS (ví dụ: không dùng `export VAR=...`, `cat`, `rm -rf`, `grep` trừ khi chạy trong git bash hoặc giải thích rõ).

---

## 2. Quy trình thử nghiệm (Test) bằng Firebase Emulator trước khi Deploy thật
Dự án được thiết kế để phát triển và test hoàn chỉnh cục bộ mà không cần đụng đến dữ liệu Firebase thật trên đám mây.

1. **Cài đặt thư viện (nếu mới clone hoặc thêm package):**
   ```cmd
   npm install
   npm --prefix app install
   ```

2. **Khởi động Firebase Emulator (Auth + Firestore):**
   ```cmd
   npm run emulators
   ```
   - Giao diện quản lý Emulator UI: `http://127.0.0.1:4000`
   - Dữ liệu ở đây hoàn toàn độc lập, không sợ làm hỏng dữ liệu thật.

3. **Chạy giao diện Web (Frontend Vite):**
   Mở cửa sổ dòng lệnh thứ hai:
   ```cmd
   npm --prefix app run dev
   ```
   - Truy cập: `http://localhost:5173`
   - Trong file `app/.env`, mặc định `VITE_USE_FIREBASE_EMULATOR=true`.

---

## 3. Quy trình Deploy lên Firebase Production (`qltt-tlm`)
- **Project ID:** `qltt-tlm`
- **Gói cước:** Spark (Miễn phí 100% của Google Firebase).
- **Quy tắc vàng:** **TUYỆT ĐỐI KHÔNG DÙNG CLOUD FUNCTIONS** để không bị chuyển sang gói trả phí Blaze (cần thẻ tín dụng quốc tế). Toàn bộ logic chạy ở React Client và được bảo vệ nghiêm ngặt bằng Firestore Security Rules.

**Các bước deploy chuẩn:**
1. Đảm bảo file `app/.env` trỏ đúng Firebase Production (`VITE_USE_FIREBASE_EMULATOR=false` và các khóa API thật).
2. Build ứng dụng frontend:
   ```cmd
   npm --prefix app run build
   ```
3. Deploy Firestore Rules, Indexes và Hosting:
   ```cmd
   npx firebase deploy --only firestore:rules,firestore:indexes,hosting --project qltt-tlm
   ```

**Các lỗi thường gặp và cách xử lý:**
- *Lỗi build TypeScript (`tsc -b` báo lỗi types):* Luôn kiểm tra `npm --prefix app run build` ở local trước khi deploy. Sửa hết các lỗi kiểu dữ liệu trước.
- *Lỗi Firestore Index:* Nếu console trình duyệt báo query cần index, bấm vào link tạo index trong log Firebase hoặc khai báo vào file `firestore.indexes.json` rồi deploy lại indexes.
- *Lỗi Permission Denied:* Luôn kiểm tra xem document tạo mới/cập nhật có đầy đủ `orgId`, `centerId` theo đúng điều kiện của `firestore.rules`.

---

## 4. Quy ước Code & Bảo mật dữ liệu (Data Conventions & Security)
1. **Kiến trúc Multi-tenant (Mỗi trung tâm = 1 Organization):**
   - **Tất cả các collection** (`centers`, `students`, `classes`, `classSessions`, `enrollments`, `attendance`, `payments`, `creditLedger`, `teacherAttendance`, v.v.) **BẮT BUỘC PHẢI CÓ FIELD `orgId`**.
   - Mọi truy vấn Firestore (`where(...)`) phải lọc theo `orgId == profile.orgId`.
   - Mọi rule trong `firestore.rules` phải kiểm tra: `resource.data.orgId == myOrgId()`.
2. **Quy ước phân quyền vai trò (Roles):**
   - `owner`: Chủ trung tâm (toàn quyền trong tổ chức, xem báo cáo doanh thu, cài đặt, tạo cơ sở, xóa học sinh).
   - `manager`: Quản lý trung tâm (quản lý học sinh, lớp học, thu học phí, điểm danh, gói buổi học).
   - `teacher`: Giáo viên (xem lịch dạy, điểm danh lớp, xem danh sách học sinh lớp mình). **Không xem doanh thu, báo cáo tài chính hay thông tin nội bộ của trung tâm khác**.
   - `ta`: Trợ giảng (hỗ trợ điểm danh, điểm danh bù, hỗ trợ lớp học). **Không xem doanh thu**.
   - `parent`: Học sinh / Phụ huynh (chỉ xem tiến độ và lịch học của con mình).
   - `super_admin`: Tài khoản quản trị nền tảng SaaS (`haunn.vietanhschool@gmail.com`) kích hoạt/tạm khóa các trung tâm.
3. **Logic trừ buổi học tự động (Credit Deduction):**
   - Chạy theo cơ chế FIFO (gói mua trước, còn hạn dùng trừ trước).
   - Đã được khóa an toàn trong `firestore.rules`: giáo viên/trợ giảng chỉ được phép cập nhật đúng 3 field (`usedSessions`, `remainingSessions`, `active`) và số lượng tăng đúng 1 buổi.

import type { Timestamp } from 'firebase/firestore'

export type Role = 'owner' | 'manager' | 'ta' | 'teacher' | 'parent'

/**
 * A paying customer's tenant: one physics center business (which may run several branches,
 * see Center). Every other collection is scoped to an orgId so Firestore rules can prove two
 * organizations' data never mixes — see firestore.rules.
 */
export type OrgStatus = 'trial' | 'active' | 'suspended'

export interface Organization {
  id: string
  name: string
  ownerId: string
  createdAt: Timestamp
  /** Billing status, set by the Super Admin (see app/src/lib/superAdmin.ts) from
   * app/src/pages/AdminPage.tsx. New orgs start 'trial' (unrestricted, but the app shows a
   * banner nudging them to contact the seller); 'suspended' blocks the whole app until
   * reactivated. */
  status: OrgStatus
}

export interface AppUser {
  id: string
  /** The organization (tenant) this account belongs to — never changes after signup. */
  orgId: string
  email: string
  displayName: string
  role: Role
  /** Center ids this user can access. Owner/Manager: all centers. TA/Teacher: assigned centers. Parent: n/a (see studentIds). */
  centerIds: string[]
  /** For parent accounts: which students they can view. */
  studentIds?: string[]
  createdAt: Timestamp
}

export interface Center {
  id: string
  orgId: string
  name: string
  address: string
  createdAt: Timestamp
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday

export interface RecurringSlot {
  weekday: Weekday
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface ClassGroup {
  id: string
  orgId: string
  centerId: string
  name: string // VD: "Toán 12 - T3/T5/CN 19h"
  subject: string
  teacherId: string
  taIds: string[]
  schedule: RecurringSlot[]
  room?: string
  active: boolean
  createdAt: Timestamp
  /** Cách tính lương cho lớp này. Không set = mặc định 'fixed_per_session' (giữ nguyên cách cũ). */
  salaryMode?: 'fixed_per_session' | 'percentage_revenue'
  /** Chỉ dùng khi salaryMode = 'percentage_revenue'. VD 20 nghĩa là 20%. */
  revenuePercentage?: number
  /** Chỉ dùng khi salaryMode = 'percentage_revenue'. Số buổi chuẩn/tháng của lớp (VD 8 hoặc 12) — dùng làm mẫu số khi trừ theo buổi giáo viên nghỉ. */
  standardSessionsPerMonth?: number
}

export type SessionStatus = 'scheduled' | 'completed' | 'canceled'

export interface ClassSession {
  id: string
  orgId: string
  centerId: string
  classId: string
  date: string // "YYYY-MM-DD"
  startTime: string
  endTime: string
  status: SessionStatus
  createdAt: Timestamp
  /** "Chụp lại" đúng GV chính/trợ giảng của lớp tại thời điểm buổi học này được tạo (lần đầu mở
   * trang Điểm danh cho ngày đó) — KHÔNG lấy động từ classes.teacherId/taIds hiện tại. Nếu
   * không có (document cũ trước khi field này tồn tại), PayrollPage.tsx sẽ tự rơi về dùng phân
   * công hiện tại của lớp như hành vi cũ. Lý do bắt buộc phải "chụp lại": nếu 1 lớp đổi GV/TG
   * giữa tháng mà không lưu lại, tính lương sẽ gán NHẦM toàn bộ buổi cũ (trước khi đổi) cho
   * người mới, người cũ mất hết công — xem PayrollPage.tsx. */
  teacherId?: string
  taIds?: string[]
}

export interface Student {
  id: string
  orgId: string
  centerId: string
  fullName: string
  phone?: string
  parentPhone?: string
  parentUserId?: string
  active: boolean
  createdAt: Timestamp
}

export type PackageType = 'session_pack' | 'monthly'

export interface Enrollment {
  id: string
  orgId: string
  studentId: string
  classId: string
  centerId: string
  packageType: PackageType
  totalSessions: number
  usedSessions: number
  /** Denormalized: totalSessions - usedSessions. Kept in sync by the attendance Cloud Function so
   * the "sessions running low" dashboard query can filter with a plain range query. */
  remainingSessions: number
  pricePerSession: number
  totalPrice: number
  purchasedAt: Timestamp
  expiresAt: Timestamp
  active: boolean
  /** true = học sinh nghỉ ngang (đã đóng tiền nhưng tự ý nghỉ giữa chừng, không hoàn phí).
   * Doanh thu của gói này sẽ KHÔNG được tính vào doanh thu hợp lệ khi tính lương % doanh thu.
   * Chủ trung tâm/Quản lý tự đánh dấu thủ công, không tự động suy luận. */
  droppedOut?: boolean
}

/** Derived/denormalized for fast reads: sum of (totalSessions - usedSessions) across active, non-expired enrollments for a student+class. */
export interface CreditLedgerEntry {
  id: string
  orgId: string
  /** Needed so firestore.rules can scope reads to isStaffOfCenter, not just isStaff (org-wide). */
  centerId: string
  enrollmentId: string
  studentId: string
  classId: string
  delta: number // negative when a session is consumed, positive on purchase/refund
  reason: 'purchase' | 'attendance_present' | 'attendance_unexcused' | 'refund' | 'manual_adjustment'
  sessionId?: string
  createdAt: Timestamp
  createdBy: string
}

export type AttendanceStatus = 'present' | 'excused_absence' | 'unexcused_absence' | 'makeup'

export interface Attendance {
  id: string
  orgId: string
  sessionId: string
  classId: string
  centerId: string
  studentId: string
  enrollmentId?: string
  status: AttendanceStatus
  /** true once credit deduction has been applied for this record, to keep the transaction idempotent. */
  creditApplied: boolean
  recordedBy: string
  recordedAt: Timestamp
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'other'

export interface Payment {
  id: string
  orgId: string
  studentId: string
  enrollmentId?: string
  centerId: string
  amount: number
  method: PaymentMethod
  note?: string
  recordedBy: string
  recordedAt: Timestamp
  /** Lớp mà khoản thanh toán này áp dụng — bắt buộc với document mới, để tính đúng doanh thu theo từng lớp/tháng cho payroll.
   * Document payments cũ có thể không có field này — code đọc phải xử lý undefined. */
  classId?: string
  /** Tháng học phí này áp dụng, dạng "YYYY-MM" — KHÔNG PHẢI tháng ghi nhận thanh toán
   * (VD thu nợ tháng 8 vào tháng 9 thì forMonth vẫn là "2026-08"). Document payments cũ có thể undefined. */
  forMonth?: string
}

/** Chấm công GV/Trợ giảng cho 1 buổi học cụ thể — id tài liệu = `${sessionId}_${staffId}`.
 * Chỉ chủ/quản lý được ghi (xem firestore.rules): field `confirmed` (có mặt hay không) quyết
 * định trực tiếp buổi đó có tính lương cho người này hay không (PayrollPage.tsx), nên không để
 * GV/TG tự chấm công cho chính mình. Chưa có bản ghi cho 1 buổi = mặc định coi như có mặt. */
export interface TeacherAttendanceRecord {
  id: string
  orgId: string
  sessionId: string
  classId: string
  centerId: string
  staffId: string
  staffRole: 'teacher' | 'ta'
  confirmed: boolean
  confirmedAt?: Timestamp
}

export interface Payroll {
  id: string
  orgId: string
  centerId: string
  staffId: string
  month: string // "YYYY-MM"
  sessionsCount: number
  ratePerSession: number
  total: number
  generatedAt: Timestamp
  bonusAmount?: number
  bonusReason?: string
}


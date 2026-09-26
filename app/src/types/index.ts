import type { Timestamp } from 'firebase/firestore'

export type Role = 'owner' | 'manager' | 'ta' | 'teacher' | 'parent'

export interface AppUser {
  id: string
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
  centerId: string
  name: string // VD: "Toán 12 - T3/T5/CN 19h"
  subject: string
  teacherId: string
  taIds: string[]
  schedule: RecurringSlot[]
  room?: string
  active: boolean
  createdAt: Timestamp
}

export type SessionStatus = 'scheduled' | 'completed' | 'canceled'

export interface ClassSession {
  id: string
  centerId: string
  classId: string
  date: string // "YYYY-MM-DD"
  startTime: string
  endTime: string
  status: SessionStatus
  createdAt: Timestamp
}

export interface Student {
  id: string
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
}

/** Derived/denormalized for fast reads: sum of (totalSessions - usedSessions) across active, non-expired enrollments for a student+class. */
export interface CreditLedgerEntry {
  id: string
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
  studentId: string
  enrollmentId?: string
  centerId: string
  amount: number
  method: PaymentMethod
  note?: string
  recordedBy: string
  recordedAt: Timestamp
}

export interface TeacherAttendanceRecord {
  id: string
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
  centerId: string
  staffId: string
  month: string // "YYYY-MM"
  sessionsCount: number
  ratePerSession: number
  total: number
  generatedAt: Timestamp
}

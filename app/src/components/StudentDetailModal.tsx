import { collection, query, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { formatVND } from '../lib/month'
import { studentAvatar } from '../lib/avatar'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { useOrgStore } from '../stores/orgStore'
import { StudentCardModal } from './StudentCardModal'
import {
  X,
  QrCode,
  Phone,
  MessageCircle,
} from 'lucide-react'
import type { Attendance, AttendanceStatus, ClassGroup, Enrollment, Payment, Student } from '../types'

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Có mặt (-1 buổi)',
  excused_absence: 'Vắng có phép (không trừ buổi)',
  unexcused_absence: 'Vắng không phép (-1 buổi)',
  makeup: 'Học bù (-1 buổi)',
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  excused_absence: 'bg-blue-100 text-blue-800 border-blue-200',
  unexcused_absence: 'bg-red-100 text-red-800 border-red-200',
  makeup: 'bg-purple-100 text-purple-800 border-purple-200',
}

interface StudentDetailModalProps {
  student: Student | null
  onClose: () => void
}

export function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  const { profile } = useAuthStore()
  const { centers } = useCenterStore()
  const { organization } = useOrgStore()
  const [activeTab, setActiveTab] = useState<'progress' | 'attendance' | 'payments'>('progress')
  const [showQRCard, setShowQRCard] = useState(false)

  const studentCenter = centers.find((c) => c.id === student?.centerId)

  // Fetch enrollments of this student
  const { data: enrollments, loading: enrollmentsLoading } = useCollection<Enrollment>(
    () =>
      student && profile
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('studentId', '==', student.id),
          )
        : null,
    [student, profile],
  )

  // Fetch payments of this student
  const { data: payments, loading: paymentsLoading } = useCollection<Payment>(
    () =>
      student && profile
        ? query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('studentId', '==', student.id),
          )
        : null,
    [student, profile],
  )

  // Fetch attendance records of this student
  const { data: attendanceList, loading: attendanceLoading } = useCollection<Attendance>(
    () =>
      student && profile
        ? query(
            collection(db, 'attendance'),
            where('orgId', '==', profile.orgId),
            where('studentId', '==', student.id),
          )
        : null,
    [student, profile],
  )

  // Fetch classes to map names
  const { data: classes } = useCollection<ClassGroup>(
    () =>
      profile
        ? query(collection(db, 'classes'), where('orgId', '==', profile.orgId))
        : null,
    [profile],
  )
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])

  // Calculations
  const totalPurchasedSessions = enrollments.reduce((sum, e) => sum + e.totalSessions, 0)
  const totalUsedSessions = enrollments.reduce((sum, e) => sum + e.usedSessions, 0)
  const totalRemainingSessions = enrollments.reduce(
    (sum, e) => (e.active ? sum + e.remainingSessions : sum),
    0,
  )

  const totalOwed = enrollments.reduce((sum, e) => sum + e.totalPrice, 0)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalDebt = totalOwed - totalPaid

  const sortedAttendance = useMemo(() => {
    return [...attendanceList].sort((a, b) => {
      const timeA = a.recordedAt?.toDate?.()?.getTime() ?? 0
      const timeB = b.recordedAt?.toDate?.()?.getTime() ?? 0
      return timeB - timeA
    })
  }, [attendanceList])

  const presentAttendanceCount = attendanceList.filter(
    (a) => a.status === 'present' || a.status === 'makeup',
  ).length
  const attendanceRate =
    attendanceList.length > 0
      ? Math.round((presentAttendanceCount / attendanceList.length) * 100)
      : 0

  if (!student) return null

  const joinDate = student.createdAt?.toDate
    ? student.createdAt.toDate().toLocaleDateString('vi-VN')
    : 'Chưa cập nhật'

  const cleanPhone = (student.parentPhone || student.phone || '').replace(/\D/g, '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <span className="text-3xl shrink-0 h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-xs">
                {studentAvatar(student.id)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">{student.fullName}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      student.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {student.active ? 'Đang học' : 'Đã nghỉ'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>
                    Cơ sở: <strong>{studentCenter?.name || 'Chưa gán'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Ngày nhập học đầu tiên: <strong>{joinDate}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Contact & QR Button Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                PH: <strong>{student.parentPhone || student.phone || 'Chưa có'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {cleanPhone && (
                <a
                  href={`https://zalo.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 border border-blue-200"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Nhắn Zalo
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowQRCard(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              >
                <QrCode className="h-3.5 w-3.5" />
                Thẻ QR
              </button>
            </div>
          </div>
        </div>

        {/* High-level KPI Cards */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-white border-b border-slate-100">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Buổi học còn lại
            </p>
            <p
              className={`mt-1 text-xl font-black ${
                totalRemainingSessions <= 2 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {totalRemainingSessions} buổi
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Đã học {totalUsedSessions}/{totalPurchasedSessions} buổi
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Chuyên cần
            </p>
            <p className="mt-1 text-xl font-black text-indigo-600">{attendanceRate}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {presentAttendanceCount}/{attendanceList.length} lượt đi học
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Học phí</p>
            <p
              className={`mt-1 text-xl font-black ${
                totalDebt > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {totalDebt > 0 ? `Nợ ${formatVND(totalDebt)}` : 'Đủ học phí'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Đã thu: {formatVND(totalPaid)}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'progress'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Gói buổi học ({enrollments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Nhật ký điểm danh ({attendanceList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Lịch sử nộp tiền ({payments.length})
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: GÓI BUỔI HỌC */}
          {activeTab === 'progress' && (
            <div className="space-y-3">
              {enrollmentsLoading ? (
                <p className="text-center py-8 text-xs text-slate-400">Đang tải gói học...</p>
              ) : enrollments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-500">
                  Học sinh chưa đăng ký gói buổi học nào.
                </div>
              ) : (
                enrollments.map((en) => {
                  const cls = classMap.get(en.classId)
                  const pct = en.totalSessions > 0 ? Math.round((en.usedSessions / en.totalSessions) * 100) : 0
                  return (
                    <div
                      key={en.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {cls?.name || 'Lớp Toán'}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">
                            Gói {en.totalSessions} buổi · Giá {formatVND(en.totalPrice)}
                          </h4>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            en.active
                              ? en.remainingSessions <= 2
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {en.active
                            ? en.remainingSessions <= 2
                              ? `Sắp hết (còn ${en.remainingSessions})`
                              : `Còn ${en.remainingSessions} buổi`
                            : 'Đã hoàn tất'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Tiến độ học:</span>
                          <span>
                            {en.usedSessions}/{en.totalSessions} buổi ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              en.remainingSessions <= 2 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: NHẬT KÝ ĐIỂM DANH */}
          {activeTab === 'attendance' && (
            <div className="space-y-2.5">
              {attendanceLoading ? (
                <p className="text-center py-8 text-xs text-slate-400">Đang tải điểm danh...</p>
              ) : sortedAttendance.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-500">
                  Chưa có lượt điểm danh nào được ghi nhận.
                </div>
              ) : (
                sortedAttendance.map((a) => {
                  const cls = classMap.get(a.classId)
                  const dateStr = a.recordedAt?.toDate
                    ? a.recordedAt.toDate().toLocaleDateString('vi-VN')
                    : 'Gần đây'
                  const timeStr = a.recordedAt?.toDate
                    ? a.recordedAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : ''
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{cls?.name || 'Ca học'}</span>
                        <p className="text-slate-500 mt-0.5">
                          Thời gian: <strong className="text-slate-700">{dateStr} {timeStr}</strong>
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 font-bold border text-[11px] ${STATUS_COLORS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 3: LỊCH SỬ NỘP TIỀN */}
          {activeTab === 'payments' && (
            <div className="space-y-2.5">
              {paymentsLoading ? (
                <p className="text-center py-8 text-xs text-slate-400">Đang tải phiếu thu...</p>
              ) : payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-500">
                  Chưa có phiếu thu tiền nào.
                </div>
              ) : (
                payments.map((p) => {
                  const dateStr = p.recordedAt?.toDate
                    ? p.recordedAt.toDate().toLocaleDateString('vi-VN')
                    : 'Gần đây'
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                    >
                      <div>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          +{formatVND(p.amount)}
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          Hình thức: {p.method === 'cash' ? 'Tiền mặt' : p.method === 'bank_transfer' ? 'Chuyển khoản' : 'Khác'} · Ngày: {dateStr}
                        </p>
                        {p.note && <p className="text-slate-400 mt-0.5 italic">Ghi chú: {p.note}</p>}
                      </div>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold border border-emerald-200 text-[10px]">
                        Đã thu
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>

      {/* QR Badge Modal */}
      <StudentCardModal
        student={showQRCard ? student : null}
        centerName={studentCenter?.name}
        orgName={organization?.name}
        onClose={() => setShowQRCard(false)}
      />
    </div>
  )
}

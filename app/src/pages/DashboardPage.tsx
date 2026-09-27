import { collection, query, Timestamp, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { currentMonthValue, formatVND, monthRange } from '../lib/month'
import { ROLE_LABELS, canManage } from '../lib/roles'
import { todayISODate, weekdayOf } from '../lib/schedule'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { studentAvatar } from '../lib/avatar'
import {
  GraduationCap,
  Wallet,
  ClipboardCheck,
  PackageCheck,
  CalendarDays,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
  Plus,
  Users,
  Building2,
} from 'lucide-react'
import type { Attendance, AttendanceStatus, ClassGroup, Enrollment, Payment, Student, Weekday } from '../types'

const LOW_BALANCE_THRESHOLD = 2

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: '#16a34a', // green-600
  makeup: '#9333ea', // purple-600
  excused_absence: '#2563eb', // blue-600
  unexcused_absence: '#dc2626', // red-600
}
const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  makeup: 'Học bù',
  excused_absence: 'Vắng có phép',
  unexcused_absence: 'Vắng không phép',
}
const STATUS_ORDER: AttendanceStatus[] = ['present', 'makeup', 'excused_absence', 'unexcused_absence']

const FULL_WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Chủ Nhật',
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
}

interface StatTileProps {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
}

function StatTile({ label, value, sub, icon: Icon, iconColor, iconBg }: StatTileProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg} ${iconColor}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId, centers } = useCenterStore()
  const [month, setMonth] = useState(currentMonthValue())
  const { start, end, daysInMonth } = useMemo(() => monthRange(month), [month])

  const manage = canManage(profile?.role)
  const isTeacherOrTa = profile?.role === 'teacher' || profile?.role === 'ta'
  const isParent = profile?.role === 'parent'

  // Query classes of the current center
  const { data: classes } = useCollection<ClassGroup>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'classes'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile],
  )

  // Query students. firestore.rules only lets staff (not parent) list a center's students —
  // skip the query for the parent role rather than let it fail with permission-denied.
  const { data: students } = useCollection<Student>(
    () =>
      selectedCenterId && profile && !isParent
        ? query(
            collection(db, 'students'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile, isParent],
  )

  // Query active enrollments — same staff-only read rule as students above.
  const { data: activeEnrollments } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile && !isParent
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('active', '==', true),
          )
        : null,
    [selectedCenterId, profile, isParent],
  )

  // Query payments ONLY for managers/owners (financial confidentiality)
  const { data: monthPayments } = useCollection<Payment>(
    () =>
      manage && selectedCenterId && profile
        ? query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('recordedAt', '>=', Timestamp.fromDate(start)),
            where('recordedAt', '<', Timestamp.fromDate(end)),
          )
        : null,
    [manage, selectedCenterId, profile, start, end],
  )

  // Query attendance for the month — same staff-only read rule as students above.
  const { data: allMonthAttendance } = useCollection<Attendance>(
    () =>
      selectedCenterId && profile && !isParent
        ? query(
            collection(db, 'attendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('recordedAt', '>=', Timestamp.fromDate(start)),
            where('recordedAt', '<', Timestamp.fromDate(end)),
          )
        : null,
    [selectedCenterId, profile, isParent, start, end],
  )

  // Filter classes assigned to current teacher/TA
  const myClasses = useMemo(() => {
    if (!profile) return []
    if (manage) return classes
    return classes.filter(
      (c) => c.teacherId === profile.id || c.taIds?.includes(profile.id),
    )
  }, [classes, manage, profile])

  // Filter attendance for current teacher/TA if not manager
  const monthAttendance = useMemo(() => {
    if (manage) return allMonthAttendance
    const myClassIds = new Set(myClasses.map((c) => c.id))
    return allMonthAttendance.filter((a) => myClassIds.has(a.classId))
  }, [allMonthAttendance, manage, myClasses])

  // Today's classes for teacher/TA or general schedule
  const todayIso = todayISODate()
  const todayWeekday = weekdayOf(todayIso)

  const todayClasses = useMemo(() => {
    return myClasses.filter((c) =>
      c.active && c.schedule?.some((s) => s.weekday === todayWeekday),
    )
  }, [myClasses, todayWeekday])

  // Calculations
  const lowBalance = activeEnrollments.filter((e) => e.remainingSessions <= LOW_BALANCE_THRESHOLD)
  const totalRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)
  const presentCount = monthAttendance.filter((a) => a.status === 'present' || a.status === 'makeup').length
  const attendanceRate = monthAttendance.length > 0 ? Math.round((presentCount / monthAttendance.length) * 100) : 0

  // Day-of-month -> count per status for the chart
  const byDay = useMemo(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const counts: Record<AttendanceStatus, number> = {
        present: 0,
        makeup: 0,
        excused_absence: 0,
        unexcused_absence: 0,
      }
      return { day: i + 1, counts, total: 0 }
    })
    for (const a of monthAttendance) {
      if (!a.recordedAt?.toDate) continue
      const day = a.recordedAt.toDate().getDate()
      const bucket = days[day - 1]
      if (!bucket) continue
      bucket.counts[a.status] += 1
      bucket.total += 1
    }
    return days
  }, [monthAttendance, daysInMonth])

  const maxDayTotal = Math.max(1, ...byDay.map((d) => d.total))
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  if (!selectedCenterId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <p className="text-base font-semibold text-slate-700">
          Chưa có cơ sở nào được gán cho tài khoản này.
        </p>
        {profile?.role === 'owner' && (
          <Link
            to="/centers"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Tạo cơ sở đầu tiên
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Xin chào, {profile?.displayName} 👋
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Vai trò: <span className="font-semibold text-slate-700">{profile ? ROLE_LABELS[profile.role] : '-'}</span> ·{' '}
            {manage
              ? `Điều hành ${centers.length} cơ sở của trung tâm`
              : `Phụ trách ${myClasses.length} lớp học môn Toán`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Xem tháng:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs focus:border-indigo-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* ===================== VIEW 1: CHỦ TRUNG TÂM / QUẢN LÝ (EXECUTIVE VIEW) ===================== */}
      {manage && (
        <>
          {/* Stat Tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Học sinh toàn cơ sở"
              value={String(students.length)}
              sub="Đang theo học"
              icon={GraduationCap}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatTile
              label="Doanh thu tháng"
              value={formatVND(totalRevenue)}
              sub={`${monthPayments.length} giao dịch`}
              icon={Wallet}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
            <StatTile
              label="Lượt điểm danh tháng"
              value={String(monthAttendance.length)}
              sub={`${attendanceRate}% có mặt`}
              icon={ClipboardCheck}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <StatTile
              label={`Sắp hết buổi (≤ ${LOW_BALANCE_THRESHOLD})`}
              value={String(lowBalance.length)}
              sub="Cần gia hạn gói"
              icon={PackageCheck}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
          </div>

          {/* Quick Actions Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Tác vụ nhanh cho quản lý
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Link
                to="/students"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Plus className="h-4 w-4" />
                </div>
                <span>Thêm học sinh</span>
              </Link>

              <Link
                to="/enrollments"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <PackageCheck className="h-4 w-4" />
                </div>
                <span>Bán gói buổi học</span>
              </Link>

              <Link
                to="/payments"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Wallet className="h-4 w-4" />
                </div>
                <span>Thu học phí</span>
              </Link>

              <Link
                to="/attendance"
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <span>Điểm danh hôm nay</span>
              </Link>

              <Link
                to="/classes"
                className="flex items-center gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <span>Lịch dạy 3 cơ sở</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ===================== VIEW 2: GIÁO VIÊN / TRỢ GIẢNG (TEACHER / TA VIEW) ===================== */}
      {isTeacherOrTa && (
        <>
          {/* Teacher Stat Tiles (NO financial data) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Lớp phụ trách"
              value={String(myClasses.length)}
              sub="Môn Toán"
              icon={BookOpen}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatTile
              label="Ca dạy hôm nay"
              value={String(todayClasses.length)}
              sub={FULL_WEEKDAY_NAMES[todayWeekday]}
              icon={CalendarDays}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <StatTile
              label="Lượt điểm danh tháng"
              value={String(monthAttendance.length)}
              sub="Các lớp phụ trách"
              icon={ClipboardCheck}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <StatTile
              label="Tỷ lệ chuyên cần"
              value={`${attendanceRate}%`}
              sub={`${presentCount} lượt có mặt`}
              icon={TrendingUp}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
          </div>

          {/* Today's Classes & Fast Attendance Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-indigo-600" />
                  Lịch dạy hôm nay ({FULL_WEEKDAY_NAMES[todayWeekday]} — {todayIso})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm nút để mở thẳng danh sách điểm danh cho ca dạy của Thầy/Cô
                </p>
              </div>
            </div>

            {todayClasses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <p className="text-sm font-medium text-slate-600">
                  🎉 Hôm nay Thầy/Cô không có ca dạy nào theo thời khóa biểu.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Chúc Thầy/Cô một ngày làm việc hiệu quả và tràn đầy năng lượng!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayClasses.map((c) => {
                  const slot = c.schedule?.find((s) => s.weekday === todayWeekday)
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-indigo-300 hover:shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                            {c.subject || 'Toán học'}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            {slot ? `${slot.startTime} - ${slot.endTime}` : 'Theo lịch'}
                          </span>
                        </div>
                        <h4 className="mt-2 text-base font-bold text-slate-900">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          Phòng: <span className="font-semibold text-slate-700">{c.room || 'Chưa xếp'}</span>
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                        <Link
                          to={`/attendance?classId=${c.id}&date=${todayIso}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          Điểm danh ca này
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== VIEW 3: PHỤ HUYNH / HỌC SINH (PARENT VIEW) ===================== */}
      {isParent && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <Users className="mx-auto h-12 w-12 text-indigo-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Cổng thông tin Học sinh / Phụ huynh</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Chào mừng Quý phụ huynh và các em học sinh. Vui lòng liên hệ trung tâm để được cập nhật tài khoản xem chi tiết tiến độ học tập và buổi học của con.
          </p>
        </div>
      )}

      {/* ===================== SHARED SECTION: BIỂU ĐỒ ĐIỂM DANH THEO THÁNG ===================== */}
      {!isParent && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {manage ? 'Điểm danh toàn trung tâm theo ngày' : 'Điểm danh các lớp phụ trách theo ngày'}
              </h3>
              <p className="text-xs text-slate-500">
                Thống kê các lượt có mặt, học bù, vắng có phép và không phép
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: STATUS_COLOR[s] }}
                  />
                  {STATUS_LABEL[s]}
                </span>
              ))}
            </div>
          </div>

          {monthAttendance.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              Chưa có lượt điểm danh nào trong tháng {month}.
            </p>
          ) : (
            <div className="overflow-x-auto pt-4">
              <svg
                width={Math.max(560, daysInMonth * 20)}
                height={170}
                role="img"
                aria-label="Biểu đồ số lượt điểm danh theo ngày, chia theo trạng thái"
              >
                {byDay.map((d, i) => {
                  const x = i * 20 + 4
                  const barWidth = 14
                  const chartHeight = 120
                  let yCursor = chartHeight
                  const segments = STATUS_ORDER.map((status) => {
                    const count = d.counts[status]
                    const h = count > 0 ? (count / maxDayTotal) * chartHeight : 0
                    const y = yCursor - h
                    yCursor -= h > 0 ? h + 2 : 0
                    return { status, count, y, h }
                  })
                  return (
                    <g
                      key={d.day}
                      onMouseEnter={() => setHoverDay(d.day)}
                      onMouseLeave={() => setHoverDay((cur) => (cur === d.day ? null : cur))}
                      className="cursor-pointer"
                    >
                      <rect x={x} y={0} width={barWidth} height={chartHeight} fill="transparent" />
                      {segments.map(
                        (seg) =>
                          seg.h > 0 && (
                            <rect
                              key={seg.status}
                              x={x}
                              y={seg.y}
                              width={barWidth}
                              height={seg.h}
                              rx={3}
                              fill={STATUS_COLOR[seg.status]}
                              opacity={hoverDay === null || hoverDay === d.day ? 1 : 0.3}
                              className="transition-opacity"
                            />
                          ),
                      )}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight + 16}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={hoverDay === d.day ? 'bold' : 'normal'}
                        fill={hoverDay === d.day ? '#4f46e5' : '#94a3b8'}
                      >
                        {d.day}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}

          {hoverDay !== null && byDay[hoverDay - 1] && byDay[hoverDay - 1].total > 0 && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-700 flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Chi tiết ngày {hoverDay} tháng {month}:
              </span>
              <div className="flex gap-3">
                {STATUS_ORDER.filter((s) => byDay[hoverDay - 1].counts[s] > 0)
                  .map((s) => (
                    <span key={s} className="font-medium">
                      {STATUS_LABEL[s]}: <strong>{byDay[hoverDay - 1].counts[s]}</strong>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== LIST: HỌC SINH SẮP HẾT BUỔI (FOR OWNER/MANAGER) ===================== */}
      {manage && lowBalance.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-amber-600" />
                Cảnh báo học sinh sắp hết buổi (≤ {LOW_BALANCE_THRESHOLD} buổi)
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Các học sinh này cần được tư vấn đóng học phí hoặc gia hạn gói học tiếp theo
              </p>
            </div>
            <Link
              to="/enrollments"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Xem tất cả gói <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowBalance.slice(0, 6).map((e) => {
              const student = students.find((s) => s.id === e.studentId)
              return (
                <div
                  key={e.id}
                  className="rounded-xl border border-amber-200 bg-white p-3.5 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{student ? studentAvatar(student.id) : '👤'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {student?.fullName || 'Học sinh'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        ĐT: {student?.phone || student?.parentPhone || 'Chưa có'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-700">
                      Còn {e.remainingSessions} buổi
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

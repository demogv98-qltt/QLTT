import { collection, query, Timestamp, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { studentAvatar } from '../lib/avatar'
import { downloadCsv } from '../lib/csv'
import { currentMonthValue, formatVND, monthLabel, monthOffset, monthRange } from '../lib/month'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { StudentDetailModal } from '../components/StudentDetailModal'
import {
  FileSpreadsheet,
  Building2,
  Download,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import type { AppUser, Attendance, ClassGroup, Enrollment, Payment, PaymentMethod, Student } from '../types'

const TREND_MONTHS = 6
const REVENUE_COLOR = '#4f46e5' // indigo-600

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
}

function BarRow({ label, value, max, formatted }: { label: string; value: number; max: number; formatted: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm text-gray-600" title={label}>
        {label}
      </span>
      <div className="h-5 flex-1 rounded-sm bg-gray-100">
        <div className="h-5 rounded-sm" style={{ width: `${pct}%`, backgroundColor: REVENUE_COLOR }} />
      </div>
      <span className="w-28 shrink-0 text-right text-sm text-gray-700">{formatted}</span>
    </div>
  )
}

function StatTile({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </div>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function ReportsPage() {
  const { profile } = useAuthStore()
  const { centers, selectedCenterId } = useCenterStore()
  const [centerFilter, setCenterFilter] = useState<string>(selectedCenterId || 'ALL')
  const [month, setMonth] = useState(currentMonthValue())
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const { start, end } = useMemo(() => monthRange(month), [month])
  // Firestore chỉ chấp nhận list-query khi mọi field rule đọc cũng nằm trong filter của
  // chính query đó — "Tất cả cơ sở" không thể bỏ qua centerId, phải dùng where('in', ...)
  // giới hạn đúng các cơ sở người này thực sự là staff (không phải toàn bộ orgId).
  const myCenterIds = useMemo(() => profile?.centerIds ?? [], [profile])

  // 6-month trailing window
  const trendStartMonth = useMemo(() => monthOffset(month, -(TREND_MONTHS - 1)), [month])
  const trendStart = useMemo(() => monthRange(trendStartMonth).start, [trendStartMonth])

  // Fetch users to map teachers & TAs
  const { data: staffUsers } = useCollection<AppUser>(
    () =>
      profile
        ? query(collection(db, 'users'), where('orgId', '==', profile.orgId))
        : null,
    [profile],
  )
  const userMap = useMemo(() => new Map(staffUsers.map((u) => [u.id, u.displayName])), [staffUsers])
  const centerMap = useMemo(() => new Map(centers.map((c) => [c.id, c.name])), [centers])

  // Students
  const { data: students } = useCollection<Student>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(collection(db, 'students'), where('orgId', '==', profile.orgId), where('centerId', 'in', myCenterIds))
            : null)
        : query(collection(db, 'students'), where('orgId', '==', profile.orgId), where('centerId', '==', centerFilter))
    },
    [profile, centerFilter, myCenterIds],
  )
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

  // Classes
  const { data: classes } = useCollection<ClassGroup>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(collection(db, 'classes'), where('orgId', '==', profile.orgId), where('centerId', 'in', myCenterIds))
            : null)
        : query(collection(db, 'classes'), where('orgId', '==', profile.orgId), where('centerId', '==', centerFilter))
    },
    [profile, centerFilter, myCenterIds],
  )

  // All-time enrollments (for debt and active student count)
  const { data: allEnrollments } = useCollection<Enrollment>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(collection(db, 'enrollments'), where('orgId', '==', profile.orgId), where('centerId', 'in', myCenterIds))
            : null)
        : query(collection(db, 'enrollments'), where('orgId', '==', profile.orgId), where('centerId', '==', centerFilter))
    },
    [profile, centerFilter, myCenterIds],
  )

  // All-time payments (for debt)
  const { data: allPayments } = useCollection<Payment>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(collection(db, 'payments'), where('orgId', '==', profile.orgId), where('centerId', 'in', myCenterIds))
            : null)
        : query(collection(db, 'payments'), where('orgId', '==', profile.orgId), where('centerId', '==', centerFilter))
    },
    [profile, centerFilter, myCenterIds],
  )

  // Trailing 6-month window payments
  const { data: trendPayments } = useCollection<Payment>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(
                collection(db, 'payments'),
                where('orgId', '==', profile.orgId),
                where('centerId', 'in', myCenterIds),
                where('recordedAt', '>=', Timestamp.fromDate(trendStart)),
              )
            : null)
        : query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', centerFilter),
            where('recordedAt', '>=', Timestamp.fromDate(trendStart)),
          )
    },
    [profile, centerFilter, trendStart, myCenterIds],
  )

  // Packages sold in the selected month
  const { data: monthEnrollments } = useCollection<Enrollment>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(
                collection(db, 'enrollments'),
                where('orgId', '==', profile.orgId),
                where('centerId', 'in', myCenterIds),
                where('purchasedAt', '>=', Timestamp.fromDate(start)),
                where('purchasedAt', '<', Timestamp.fromDate(end)),
              )
            : null)
        : query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', centerFilter),
            where('purchasedAt', '>=', Timestamp.fromDate(start)),
            where('purchasedAt', '<', Timestamp.fromDate(end)),
          )
    },
    [profile, centerFilter, start, end, myCenterIds],
  )

  // Attendance in the selected month
  const { data: monthAttendance } = useCollection<Attendance>(
    () => {
      if (!profile) return null
      return centerFilter === 'ALL'
        ? (myCenterIds.length > 0
            ? query(
                collection(db, 'attendance'),
                where('orgId', '==', profile.orgId),
                where('centerId', 'in', myCenterIds),
                where('recordedAt', '>=', Timestamp.fromDate(start)),
                where('recordedAt', '<', Timestamp.fromDate(end)),
              )
            : null)
        : query(
            collection(db, 'attendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', centerFilter),
            where('recordedAt', '>=', Timestamp.fromDate(start)),
            where('recordedAt', '<', Timestamp.fromDate(end)),
          )
    },
    [profile, centerFilter, start, end, myCenterIds],
  )

  // --- Công nợ (outstanding balance per student) ---
  const debtByStudent = useMemo(() => {
    const owed: Record<string, number> = {}
    const paid: Record<string, number> = {}
    for (const en of allEnrollments) owed[en.studentId] = (owed[en.studentId] ?? 0) + en.totalPrice
    for (const p of allPayments) paid[p.studentId] = (paid[p.studentId] ?? 0) + p.amount
    return students
      .map((s) => ({
        studentId: s.id,
        name: s.fullName,
        phone: s.parentPhone || s.phone || '',
        owed: owed[s.id] ?? 0,
        paid: paid[s.id] ?? 0,
        debt: (owed[s.id] ?? 0) - (paid[s.id] ?? 0),
      }))
      .filter((r) => r.owed > 0)
      .sort((a, b) => b.debt - a.debt)
  }, [students, allEnrollments, allPayments])

  const [showAllDebt, setShowAllDebt] = useState(false)
  const debtRows = showAllDebt ? debtByStudent : debtByStudent.filter((r) => r.debt > 0)
  const totalDebt = debtByStudent.reduce((sum, r) => sum + Math.max(0, r.debt), 0)

  // --- Revenue trend (last 6 months) ---
  const monthBuckets = useMemo(() => {
    const labels: string[] = []
    for (let i = TREND_MONTHS - 1; i >= 0; i--) labels.push(monthOffset(month, -i))
    return labels
  }, [month])

  const revenueByMonth = useMemo(() => {
    const totals: Record<string, number> = Object.fromEntries(monthBuckets.map((m) => [m, 0]))
    for (const p of trendPayments) {
      if (!p.recordedAt?.toDate) continue
      const d = p.recordedAt.toDate()
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in totals) totals[key] += p.amount
    }
    return monthBuckets.map((m) => ({ month: m, total: totals[m] }))
  }, [trendPayments, monthBuckets])
  const maxMonthRevenue = Math.max(1, ...revenueByMonth.map((r) => r.total))
  const [hoverMonth, setHoverMonth] = useState<string | null>(null)

  // Revenue by method
  const revenueByMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = { cash: 0, bank_transfer: 0, other: 0 }
    for (const p of trendPayments) {
      if (!p.recordedAt?.toDate) continue
      const d = p.recordedAt.toDate()
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key === month) totals[p.method] += p.amount
    }
    return totals
  }, [trendPayments, month])
  const maxMethodRevenue = Math.max(1, ...Object.values(revenueByMethod))

  const monthRevenueTotal = revenueByMonth.at(-1)?.total ?? 0
  const monthPackagesSold = monthEnrollments.length
  const monthPackagesValue = monthEnrollments.reduce((sum, e) => sum + e.totalPrice, 0)

  // --- Comprehensive Class-by-Class Monthly Summary Table ---
  const classSummaryList = useMemo(() => {
    const studentDebtMap = new Map(debtByStudent.map((d) => [d.studentId, Math.max(0, d.debt)]))

    return classes.map((c) => {
      const activeEnrollmentsInClass = allEnrollments.filter((e) => e.classId === c.id && e.active)
      const studentIdsInClass = Array.from(new Set(activeEnrollmentsInClass.map((e) => e.studentId)))
      const studentCount = studentIdsInClass.length

      const attendanceInMonth = monthAttendance.filter((a) => a.classId === c.id)
      const presentCount = attendanceInMonth.filter((a) => a.status === 'present' || a.status === 'makeup').length
      const attendanceRate = attendanceInMonth.length > 0 ? Math.round((presentCount / attendanceInMonth.length) * 100) : 0

      // Count unique dates/sessions taught in this month
      const uniqueSessionDates = new Set(
        attendanceInMonth.map((a) => {
          if (a.recordedAt?.toDate) {
            return a.recordedAt.toDate().toISOString().slice(0, 10)
          }
          return a.sessionId || 'date'
        }),
      )
      const sessionsCount = uniqueSessionDates.size

      // Revenue from packages sold for this class in this month
      const monthRevenue = monthEnrollments
        .filter((e) => e.classId === c.id)
        .reduce((sum, e) => sum + e.totalPrice, 0)

      // Total debt of students in this class
      const classDebt = studentIdsInClass.reduce((sum, sId) => sum + (studentDebtMap.get(sId) || 0), 0)

      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        centerName: centerMap.get(c.centerId) || 'Cơ sở',
        teacherName: userMap.get(c.teacherId) || 'Chưa gán',
        taNames: (c.taIds || []).map((id) => userMap.get(id)).filter(Boolean).join(', ') || 'Không',
        studentCount,
        sessionsCount,
        attendanceCount: attendanceInMonth.length,
        attendanceRate,
        revenue: monthRevenue,
        debt: classDebt,
      }
    })
  }, [classes, allEnrollments, monthAttendance, monthEnrollments, debtByStudent, centerMap, userMap])

  // Summary totals for class summary table
  const totalClassesCount = classSummaryList.length
  const totalStudentsEnrolled = classSummaryList.reduce((sum, c) => sum + c.studentCount, 0)
  const totalSessionsConducted = classSummaryList.reduce((sum, c) => sum + c.sessionsCount, 0)
  const totalMonthRevenueClasses = classSummaryList.reduce((sum, c) => sum + c.revenue, 0)
  const totalDebtClasses = classSummaryList.reduce((sum, c) => sum + c.debt, 0)

  // Export functions
  function exportMonthlyClassReportCsv() {
    const headers = [
      'Tên Lớp Học',
      'Môn Học',
      'Cơ Sở',
      'Giáo Viên Chính',
      'Trợ Giảng',
      'Sĩ Số Học Sinh',
      'Số Buổi Đã Dạy Trong Tháng',
      'Tổng Lượt Điểm Danh',
      'Tỉ Lệ Chuyên Cần (%)',
      'Doanh Thu Bán Gói Tháng (đ)',
      'Công Nợ Còn Lại (đ)',
    ]
    const rows = classSummaryList.map((row) => [
      row.name,
      row.subject,
      row.centerName,
      row.teacherName,
      row.taNames,
      row.studentCount,
      row.sessionsCount,
      row.attendanceCount,
      `${row.attendanceRate}%`,
      row.revenue,
      row.debt,
    ])
    downloadCsv(`bao-cao-tong-ket-lop-${month}.csv`, headers, rows)
  }

  function exportDebtCsv() {
    downloadCsv(
      `cong-no-${month}.csv`,
      ['Học sinh', 'SĐT', 'Đã bán (đ)', 'Đã thu (đ)', 'Còn nợ (đ)'],
      debtByStudent.map((r) => [r.name, r.phone, r.owed, r.paid, r.debt]),
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Báo cáo & Thống kê tài chính</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng kết doanh thu, chuyên cần, công nợ và chốt sổ theo từng lớp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Center Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">🏢 Toàn hệ thống (Cả 3 cơ sở)</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs focus:border-indigo-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Đã thu trong tháng"
          value={formatVND(monthRevenueTotal)}
          sub="Tiền thực nhận"
          icon={DollarSign}
        />
        <StatTile
          label="Gói bán trong tháng"
          value={String(monthPackagesSold)}
          sub={monthPackagesSold > 0 ? formatVND(monthPackagesValue) : 'Chưa có gói mới'}
          icon={FileSpreadsheet}
        />
        <StatTile
          label="Tổng công nợ"
          value={formatVND(totalDebt)}
          sub="Học phí chưa thu đủ"
          icon={TrendingUp}
        />
        <StatTile
          label="Học sinh đang nợ"
          value={String(debtByStudent.filter((r) => r.debt > 0).length)}
          sub={`trên tổng ${students.length} HS`}
          icon={Users}
        />
      </div>

      {/* ================= SECTION: BẢNG TỔNG KẾT TỪNG LỚP HỌC TRONG THÁNG (CHỐT SỔ CHO CHỦ TRUNG TÂM) ================= */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Bảng tổng kết chốt sổ từng lớp trong tháng ({monthLabel(month)})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Chi tiết sĩ số, số buổi đã dạy, tỉ lệ chuyên cần, doanh thu gói mới và nợ học phí theo từng lớp
            </p>
          </div>

          <button
            type="button"
            onClick={exportMonthlyClassReportCsv}
            disabled={classSummaryList.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 shadow-xs hover:shadow-indigo-200 transition-all disabled:opacity-50"
            title="Tải bảng tổng kết này về máy dưới định dạng Excel/CSV (chuẩn tiếng Việt có dấu)"
          >
            <Download className="h-4 w-4" />
            <span>Xuất file Excel / CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Lớp học & Cơ sở</th>
                <th className="px-4 py-3">GV & Trợ giảng</th>
                <th className="px-3 py-3 text-center">Sĩ số</th>
                <th className="px-3 py-3 text-center">Buổi đã dạy</th>
                <th className="px-3 py-3 text-center">Lượt học</th>
                <th className="px-3 py-3 text-center">Chuyên cần</th>
                <th className="px-4 py-3 text-right">Doanh thu gói mới</th>
                <th className="px-4 py-3 text-right">Công nợ lớp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classSummaryList.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{cls.name}</div>
                    <div className="text-[11px] font-normal text-slate-400">
                      {cls.centerName} · {cls.subject}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="font-medium text-slate-800">👨‍🏫 {cls.teacherName}</div>
                    <div className="text-[11px] text-slate-400">🧑‍💼 TG: {cls.taNames}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-700">
                    {cls.studentCount} em
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-indigo-600">
                    {cls.sessionsCount} buổi
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {cls.attendanceCount} lượt
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-extrabold ${
                        cls.attendanceRate >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : cls.attendanceRate >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {cls.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                    {formatVND(cls.revenue)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-extrabold ${
                      cls.debt > 0 ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    {cls.debt > 0 ? formatVND(cls.debt) : '0 đ'}
                  </td>
                </tr>
              ))}

              {classSummaryList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Chưa có dữ liệu lớp học nào trong cơ sở này.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Summary Footer */}
            {classSummaryList.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-black text-slate-900 text-xs sm:text-sm">
                <tr>
                  <td className="px-4 py-3" colSpan={2}>
                    TỔNG CỘNG ({totalClassesCount} lớp)
                  </td>
                  <td className="px-3 py-3 text-center">{totalStudentsEnrolled} HS</td>
                  <td className="px-3 py-3 text-center text-indigo-700">{totalSessionsConducted} buổi</td>
                  <td className="px-3 py-3 text-center">-</td>
                  <td className="px-3 py-3 text-center">-</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatVND(totalMonthRevenueClasses)}</td>
                  <td className="px-4 py-3 text-right text-red-700">{formatVND(totalDebtClasses)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Revenue Trend Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend 6 months */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="mb-3 text-sm font-bold text-slate-900">
            Doanh thu 6 tháng gần nhất (tiền thực thu)
          </p>
          <div className="overflow-x-auto">
            <svg width={Math.max(360, TREND_MONTHS * 72)} height={150} role="img" aria-label="Biểu đồ doanh thu">
              {revenueByMonth.map((r, i) => {
                const chartHeight = 110
                const barWidth = 40
                const gap = 72
                const x = i * gap + 16
                const h = r.total > 0 ? (r.total / maxMonthRevenue) * chartHeight : 0
                const y = chartHeight - h
                return (
                  <g key={r.month} onMouseEnter={() => setHoverMonth(r.month)} onMouseLeave={() => setHoverMonth((c) => (c === r.month ? null : c))}>
                    <rect x={x} y={0} width={barWidth} height={chartHeight} fill="transparent" />
                    {h > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={h}
                        rx={6}
                        fill={REVENUE_COLOR}
                        opacity={hoverMonth === null || hoverMonth === r.month ? 1 : 0.35}
                      />
                    )}
                    <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fontSize={11} fill="#6b7280" fontWeight="bold">
                      {monthLabel(r.month)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          {hoverMonth !== null && (
            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="font-bold">{monthLabel(hoverMonth)}:</span>{' '}
              {formatVND(revenueByMonth.find((r) => r.month === hoverMonth)?.total ?? 0)}
            </div>
          )}
        </div>

        {/* Revenue by Payment Method */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="mb-3 text-sm font-bold text-slate-900">Doanh thu theo hình thức thu tiền (tháng này)</p>
          <div className="space-y-3">
            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <BarRow
                key={m}
                label={METHOD_LABELS[m]}
                value={revenueByMethod[m]}
                max={maxMethodRevenue}
                formatted={formatVND(revenueByMethod[m])}
              />
            ))}
            {Object.values(revenueByMethod).every((v) => v === 0) && (
              <p className="py-4 text-center text-xs text-slate-400">Chưa có khoản thu nào trong tháng này.</p>
            )}
          </div>
        </div>
      </div>

      {/* ================= SECTION: CÔNG NỢ CHI TIẾT ================= */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Danh sách công nợ chi tiết học sinh</h3>
            <p className="text-xs text-slate-500">
              Bấm vào tên học sinh để xem hồ sơ 360°, gói học, nhật ký điểm danh và nhắn Zalo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={showAllDebt}
                onChange={(e) => setShowAllDebt(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Hiện cả học sinh đã đóng đủ
            </label>
            <button
              type="button"
              onClick={exportDebtCsv}
              disabled={debtByStudent.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất CSV Công nợ</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-left text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Học sinh (Bấm để xem hồ sơ)</th>
                <th className="px-3 py-2.5 text-right">Đã bán</th>
                <th className="px-3 py-2.5 text-right">Đã thu</th>
                <th className="px-3 py-2.5 text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debtRows.map((r) => {
                const sObj = studentMap.get(r.studentId)
                return (
                  <tr key={r.studentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={() => sObj && setDetailStudent(sObj)}
                        className="group flex items-center text-left hover:text-indigo-600 transition-colors"
                        title="Bấm để xem toàn diện hồ sơ học sinh"
                      >
                        <span className="mr-2 text-xl shrink-0">{studentAvatar(r.studentId)}</span>
                        <div>
                          <span className="group-hover:underline font-bold text-slate-900">
                            {r.name}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-normal">
                            SĐT: {r.phone || 'Chưa có'}
                          </span>
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600 font-medium">{formatVND(r.owed)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">{formatVND(r.paid)}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-black ${
                        r.debt > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatVND(r.debt)}
                    </td>
                  </tr>
                )
              })}
              {debtRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                    {debtByStudent.length === 0 ? 'Chưa có gói nào được bán.' : 'Không có học sinh nào đang nợ.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: HỒ SƠ 360° HỌC SINH ================= */}
      <StudentDetailModal
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
      />
    </div>
  )
}

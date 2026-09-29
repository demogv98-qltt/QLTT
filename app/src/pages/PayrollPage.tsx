import {
  collection,
  doc,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { useStaffOfCenter } from '../lib/useStaff'
import { currentMonthValue, formatVND } from '../lib/month'
import { canManage } from '../lib/roles'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { Logo } from '../components/Logo'
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Printer,
  X,
  MessageCircle,
  Eye,
  Users,
} from 'lucide-react'
import type { AppUser, ClassGroup, ClassSession, Enrollment, Payment, Payroll, TeacherAttendanceRecord } from '../types'

const DEFAULT_TEACHER_RATE = 200000 // 200k/ca
const DEFAULT_TA_RATE = 70000 // 70k/ca — trợ giảng luôn trả cố định theo ca, kể cả ở lớp khoán % doanh thu

// Thù lao tính theo 1 lớp (có thể là cố định/ca hoặc % doanh thu)
interface ClassPayEntry {
  classId: string
  className: string
  salaryMode: 'fixed_per_session' | 'percentage_revenue'
  sessionsCount: number
  /** Chỉ có khi fixed_per_session */
  rate?: number
  /** Chỉ có khi percentage_revenue */
  validRevenue?: number
  revenuePercentage?: number
  standardSessionsPerMonth?: number
  subtotal: number
}

interface StaffPayrollItem {
  user: AppUser
  roleLabel: string
  sessionsCount: number
  sessions: { session: ClassSession; className: string }[]
  classEntries: ClassPayEntry[]
  rate: number // chỉ dùng cho fixed mode (legacy/display)
  bonus: number
  bonusReason: string
  total: number
  paid: boolean
  payrollDocId?: string
}

export function PayrollPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId, centers } = useCenterStore()
  const [month, setMonth] = useState(currentMonthValue())
  const manage = canManage(profile?.role)

  const selectedCenter = centers.find((c) => c.id === selectedCenterId)

  // Staff of center — only owner/manager may list org-wide users (firestore.rules); a
  // teacher/TA viewing their own payroll below uses `profile` directly instead.
  const { teachers, tas, loading: staffLoading } = useStaffOfCenter(
    manage ? profile?.orgId : undefined,
    selectedCenterId,
  )

  // Classes of center
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
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])

  // Class sessions of center
  const { data: allSessions, loading: sessionsLoading } = useCollection<ClassSession>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'classSessions'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile],
  )

  // Filter sessions in this month
  const monthSessions = useMemo(() => {
    return allSessions.filter((s) => s.date && s.date.startsWith(month))
  }, [allSessions, month])

  // Payments cho các lớp % doanh thu trong tháng này
  // Query: orgId + centerId (dùng index đã có) — lọc theo classId & forMonth clientside
  const { data: allPayments } = useCollection<Payment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile, month],
  )

  // Enrollments — để kiểm tra droppedOut
  const { data: allEnrollments } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile],
  )

  // Map enrollmentId → enrollment để tra droppedOut nhanh
  const enrollmentMap = useMemo(
    () => new Map(allEnrollments.map((e) => [e.id, e])),
    [allEnrollments],
  )

  // Chấm công GV/TG — quyết định buổi nào tính lương cho người nào (cả 2 chế độ lương).
  const { data: teacherAttendanceRecords } = useCollection<TeacherAttendanceRecord>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'teacherAttendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile],
  )
  // key: `${sessionId}_${staffId}` → confirmed (có mặt hay không)
  const attendanceBySessionStaff = useMemo(
    () => new Map(teacherAttendanceRecords.map((r) => [`${r.sessionId}_${r.staffId}`, r.confirmed])),
    [teacherAttendanceRecords],
  )
  // Buổi chưa chấm công = mặc định coi như có mặt (giữ hành vi cũ khi chưa ai chấm công).
  function wasPresent(sessionId: string, staffId: string): boolean {
    const recorded = attendanceBySessionStaff.get(`${sessionId}_${staffId}`)
    return recorded ?? true
  }

  // Tính doanh thu hợp lệ theo lớp + tháng (loại payment của enrollment droppedOut)
  const validRevenueByClassMonth = useMemo(() => {
    const map: Record<string, number> = {} // key: `${classId}_${forMonth}`
    for (const p of allPayments) {
      if (!p.classId || !p.forMonth) continue // doc cũ không có field — bỏ qua
      if (p.forMonth !== month) continue // chỉ tính tháng đang xem
      // Kiểm tra enrollment tương ứng có droppedOut không
      // enrollment của payment này có thể tra qua enrollmentId hoặc tìm theo studentId+classId
      let dropped = false
      if (p.enrollmentId) {
        const en = enrollmentMap.get(p.enrollmentId)
        if (en?.droppedOut) dropped = true
      } else {
        // Không có enrollmentId — một học sinh có thể có NHIỀU enrollment cho cùng
        // lớp qua các tháng khác nhau (gói học lại theo tháng), nên phải khớp đúng
        // enrollment mua trong đúng tháng `forMonth` của payment, không lấy đại cái đầu tiên.
        const candidates = allEnrollments.filter(
          (e) => e.studentId === p.studentId && e.classId === p.classId,
        )
        const sameMonth = candidates.find((e) => {
          const d = e.purchasedAt?.toDate ? e.purchasedAt.toDate() : null
          if (!d) return false
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return ym === p.forMonth
        })
        if (sameMonth?.droppedOut) dropped = true
      }
      if (!dropped) {
        const key = `${p.classId}_${p.forMonth}`
        map[key] = (map[key] ?? 0) + p.amount
      }
    }
    return map
  }, [allPayments, allEnrollments, enrollmentMap, month])

  // Stored payroll records from Firestore
  const { data: savedPayrolls } = useCollection<Payroll>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'payroll'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('month', '==', month),
          )
        : null,
    [selectedCenterId, profile, month],
  )
  const savedPayrollMap = useMemo(
    () => new Map(savedPayrolls.map((p) => [p.staffId, p])),
    [savedPayrolls],
  )

  // Local state for editable rates & bonuses before saving
  const [customRates, setCustomRates] = useState<Record<string, number>>({})
  const [customBonuses, setCustomBonuses] = useState<Record<string, number>>({})
  const [customBonusReasons, setCustomBonusReasons] = useState<Record<string, string>>({})

  // Modals state
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<StaffPayrollItem | null>(null)
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<StaffPayrollItem | null>(null)
  const [savingStaffId, setSavingStaffId] = useState<string | null>(null)

  // Calculate payroll table. Non-manage roles never ran the org-wide staff query above, so
  // build their own single-person "staff list" straight from their own profile instead.
  const visibleStaff = useMemo(() => {
    if (manage) return [...teachers, ...tas]
    return profile ? [profile] : []
  }, [teachers, tas, manage, profile])

  const payrollItems: StaffPayrollItem[] = useMemo(() => {
    return visibleStaff.map((staff) => {
      const savedDoc = savedPayrollMap.get(staff.id)
      const bonus =
        customBonuses[staff.id] ??
        savedDoc?.bonusAmount ??
        0
      const bonusReason =
        customBonusReasons[staff.id] ??
        savedDoc?.bonusReason ??
        ''

      // Nhóm sessions theo lớp
      const sessionsByClass: Record<string, ClassSession[]> = {}
      for (const sess of monthSessions) {
        if (sess.status === 'canceled') continue
        const cls = classMap.get(sess.classId)
        if (!cls) continue
        const isTeacher = cls.teacherId === staff.id
        const isTa = cls.taIds?.includes(staff.id)
        if (!isTeacher && !isTa) continue
        if (!sessionsByClass[sess.classId]) sessionsByClass[sess.classId] = []
        sessionsByClass[sess.classId].push(sess)
      }

      const staffSessions: { session: ClassSession; className: string }[] = []
      const classEntries: ClassPayEntry[] = []
      let totalFromClasses = 0

      for (const [cid, sessions] of Object.entries(sessionsByClass)) {
        const cls = classMap.get(cid)
        if (!cls) continue

        // Thêm vào danh sách sessions chung để hiển thị chi tiết
        for (const s of sessions) {
          staffSessions.push({ session: s, className: cls.name })
        }

        // Khoán % doanh thu chỉ áp dụng cho giáo viên chính của lớp. Trợ giảng luôn được trả
        // cố định theo ca (kể cả ở lớp đang khoán % cho giáo viên) — đây là chính sách của
        // trung tâm, không phải lựa chọn kỹ thuật: 1 lớp khoán % không có nghĩa cả GV và TG
        // đều nhận % (sẽ thành 2 lần), mà chỉ GV nhận %, TG vẫn ăn lương ca như bình thường.
        const isTeacherOfClass = cls.teacherId === staff.id
        const mode = cls.salaryMode === 'percentage_revenue' && isTeacherOfClass
          ? 'percentage_revenue'
          : 'fixed_per_session'

        // Chỉ tính những buổi người này thực sự có mặt (chấm công) — buổi chưa ai chấm công
        // thì mặc định coi như có mặt, giữ hành vi hợp lý khi quản lý chưa kịp chấm công.
        const attendedSessions = sessions.filter((s) => wasPresent(s.id, staff.id))

        if (mode === 'percentage_revenue') {
          const realSessionsCount = attendedSessions.length
          const pct = cls.revenuePercentage ?? 20
          const stdSessions = cls.standardSessionsPerMonth ?? 8
          const validRevenue = validRevenueByClassMonth[`${cid}_${month}`] ?? 0
          const subtotal = stdSessions > 0
            ? Math.round((validRevenue * pct) / 100 / stdSessions * realSessionsCount)
            : 0
          classEntries.push({
            classId: cid,
            className: cls.name,
            salaryMode: 'percentage_revenue',
            sessionsCount: realSessionsCount,
            validRevenue,
            revenuePercentage: pct,
            standardSessionsPerMonth: stdSessions,
            subtotal,
          })
          totalFromClasses += subtotal
        } else {
          // Cố định/ca (logic cũ)
          const defaultRate = staff.role === 'teacher' ? DEFAULT_TEACHER_RATE : DEFAULT_TA_RATE
          const rate =
            customRates[staff.id] ??
            savedDoc?.ratePerSession ??
            defaultRate
          const subtotal = attendedSessions.length * rate
          classEntries.push({
            classId: cid,
            className: cls.name,
            salaryMode: 'fixed_per_session',
            sessionsCount: attendedSessions.length,
            rate,
            subtotal,
          })
          totalFromClasses += subtotal
        }
      }

      // Rate đại diện: dùng cho legacy display & payslip (lấy từ class cố định đầu tiên hoặc default)
      const fixedEntry = classEntries.find((e) => e.salaryMode === 'fixed_per_session')
      const defaultRate = staff.role === 'teacher' ? DEFAULT_TEACHER_RATE : DEFAULT_TA_RATE
      const displayRate =
        fixedEntry?.rate ??
        customRates[staff.id] ??
        savedDoc?.ratePerSession ??
        defaultRate

      const total = totalFromClasses + bonus
      // Tổng số ca ĐÃ chấm công có mặt (không tính buổi vắng) — khớp với số ca dùng để tính lương.
      const sessionsCount = classEntries.reduce((sum, e) => sum + e.sessionsCount, 0)

      return {
        user: staff,
        roleLabel: staff.role === 'teacher' ? 'Giáo viên' : 'Trợ giảng',
        sessionsCount,
        sessions: staffSessions.sort((a, b) => a.session.date.localeCompare(b.session.date)),
        classEntries,
        rate: displayRate,
        bonus,
        bonusReason,
        total,
        paid: !!savedDoc,
        payrollDocId: savedDoc?.id,
      }
    })
  }, [
    visibleStaff,
    monthSessions,
    classMap,
    customRates,
    savedPayrollMap,
    customBonuses,
    customBonusReasons,
    validRevenueByClassMonth,
    month,
  ])

  // Overall summary
  const totalCenterPayroll = payrollItems.reduce((sum, item) => sum + item.total, 0)
  const totalCenterSessions = payrollItems.reduce((sum, item) => sum + item.sessionsCount, 0)

  // Save payroll status to Firestore
  const handleSavePayroll = async (item: StaffPayrollItem) => {
    if (!profile || !selectedCenterId) return
    setSavingStaffId(item.user.id)
    try {
      const payrollId = `${selectedCenterId}_${item.user.id}_${month}`
      await setDoc(doc(db, 'payroll', payrollId), {
        orgId: profile.orgId,
        centerId: selectedCenterId,
        staffId: item.user.id,
        month,
        sessionsCount: item.sessionsCount,
        ratePerSession: item.rate,
        total: item.total,
        bonusAmount: item.bonus,
        bonusReason: item.bonusReason,
        generatedAt: serverTimestamp(),
      })
    } finally {
      setSavingStaffId(null)
    }
  }

  // Generate Zalo notification URL
  const getZaloShareUrl = (item: StaffPayrollItem) => {
    const hasPercentage = item.classEntries.some((e) => e.salaryMode === 'percentage_revenue')
    const text = encodeURIComponent(
      `Kính gửi Thầy/Cô ${item.user.displayName},\n` +
        `Trung tâm gửi bảng xác nhận thù lao giảng dạy tháng ${month}:\n` +
        `• Chức vụ: ${item.roleLabel}\n` +
        `• Tổng số ca đã dạy: ${item.sessionsCount} ca\n` +
        (hasPercentage
          ? item.classEntries
              .map((e) =>
                e.salaryMode === 'percentage_revenue'
                  ? `  • ${e.className}: ${e.sessionsCount} buổi thực dạy · DT hợp lệ: ${formatVND(e.validRevenue ?? 0)} → ${formatVND(e.subtotal)}`
                  : `  • ${e.className}: ${e.sessionsCount} ca × ${formatVND(e.rate ?? 0)} = ${formatVND(e.subtotal)}`,
              )
              .join('\n') + '\n'
          : `• Đơn giá: ${formatVND(item.rate)}/ca\n`) +
        `• Phụ cấp/Thưởng: ${formatVND(item.bonus)}${item.bonusReason ? ` (${item.bonusReason})` : ''}\n` +
        `• TỔNG THÙ LAO: ${formatVND(item.total)}\n` +
        `Thầy/Cô vui lòng đối soát và liên hệ quản trị nếu cần hỗ trợ ạ. Chúc Thầy/Cô nhiều sức khỏe!`,
    )
    return `https://zalo.me?text=${text}`
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-slate-500">Chưa có cơ sở nào được chọn.</p>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Banknote className="h-6 w-6 text-emerald-600" />
            Bảng lương & Chấm công giảng dạy
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            {manage
              ? `Tự động tính thù lao theo số ca dạy thực tế của giáo viên & trợ giảng cơ sở ${selectedCenter?.name || ''}`
              : `Bảng thù lao và lịch sử ca dạy của Thầy/Cô trong tháng ${month}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Chọn tháng:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs focus:border-indigo-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {manage ? 'Tổng quỹ thù lao tháng' : 'Tổng thù lao nhận'}
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{formatVND(totalCenterPayroll)}</p>
          <p className="mt-1 text-xs text-slate-500">Tháng {month}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {manage ? 'Tổng số ca dạy toàn trung tâm' : 'Số ca đã dạy của Thầy/Cô'}
          </p>
          <p className="mt-1 text-2xl font-black text-indigo-600">{totalCenterSessions} ca</p>
          <p className="mt-1 text-xs text-slate-500">Đã điểm danh hoàn thành</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {manage ? 'Số lượng nhân sự giảng dạy' : 'Trạng thái đối soát'}
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {manage ? `${payrollItems.length} người` : payrollItems[0]?.paid ? 'Đã duyệt' : 'Chờ duyệt'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {manage ? `${teachers.length} Giáo viên · ${tas.length} Trợ giảng` : 'Đối soát cuối tháng'}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4 sm:px-6 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            Danh sách tính thù lao (Tháng {month})
          </h3>
          <span className="text-xs text-slate-400">Đơn vị: VNĐ</span>
        </div>

        {staffLoading || sessionsLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Đang tổng hợp dữ liệu ca dạy...</div>
        ) : payrollItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Chưa có nhân sự giáo viên hoặc trợ giảng nào tại cơ sở này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 sm:px-6">Nhân sự</th>
                  <th className="px-3 py-3.5">Vai trò</th>
                  <th className="px-3 py-3.5 text-center">Số ca dạy</th>
                  <th className="px-3 py-3.5">Chế độ lương / Đơn giá</th>
                  <th className="px-3 py-3.5">Thưởng / Phụ cấp</th>
                  <th className="px-3 py-3.5">Tổng thù lao</th>
                  <th className="px-3 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right sm:px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payrollItems.map((item) => {
                  const hasFixed = item.classEntries.some((e) => e.salaryMode === 'fixed_per_session')

                  return (
                    <tr key={item.user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="font-bold text-slate-900">{item.user.displayName}</div>
                        <div className="text-xs text-slate-400">{item.user.email}</div>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                            item.user.role === 'teacher'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {item.roleLabel}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffForDetail(item)}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline decoration-dotted"
                          title="Bấm để xem danh sách chi tiết các ca đã dạy"
                        >
                          {item.sessionsCount} ca
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>

                      <td className="px-3 py-3.5">
                        {/* Hiển thị chế độ lương theo lớp */}
                        <div className="space-y-1">
                          {item.classEntries.length === 0 && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                          {item.classEntries.map((entry) => (
                            <div key={entry.classId} className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold border ${
                                  entry.salaryMode === 'percentage_revenue'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {entry.salaryMode === 'percentage_revenue'
                                  ? `Khoán ${entry.revenuePercentage}% DT`
                                  : 'Cố định/ca'}
                              </span>
                              <span className="text-xs text-slate-600 truncate max-w-[120px]">
                                {entry.className}
                              </span>
                            </div>
                          ))}
                          {/* Ô nhập đơn giá — chỉ hiện khi có ít nhất 1 lớp cố định */}
                          {hasFixed && manage && (
                            <input
                              type="number"
                              step={10000}
                              value={item.rate}
                              onChange={(e) =>
                                setCustomRates((prev) => ({
                                  ...prev,
                                  [item.user.id]: Number(e.target.value) || 0,
                                }))
                              }
                              className="mt-1 w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                              placeholder="Đơn giá/ca"
                            />
                          )}
                          {hasFixed && !manage && (
                            <span className="text-xs text-slate-600">{formatVND(item.rate)}/ca</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        {manage ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              step={10000}
                              placeholder="0"
                              value={item.bonus || ''}
                              onChange={(e) =>
                                setCustomBonuses((prev) => ({
                                  ...prev,
                                  [item.user.id]: Number(e.target.value) || 0,
                                }))
                              }
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
                            />
                            <input
                              type="text"
                              placeholder="Lý do thưởng"
                              value={item.bonusReason || ''}
                              onChange={(e) =>
                                setCustomBonusReasons((prev) => ({
                                  ...prev,
                                  [item.user.id]: e.target.value,
                                }))
                              }
                              className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-indigo-600 focus:outline-hidden"
                            />
                          </div>
                        ) : (
                          <div>
                            <span>{formatVND(item.bonus)}</span>
                            {item.bonusReason && (
                              <p className="text-[11px] text-slate-500">{item.bonusReason}</p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        <span className="font-extrabold text-emerald-600 text-base">
                          {formatVND(item.total)}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        {item.paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã chốt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            <Clock className="h-3 w-3" />
                            Chờ chốt
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {manage && (
                            <button
                              type="button"
                              disabled={savingStaffId === item.user.id}
                              onClick={() => handleSavePayroll(item)}
                              className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                              title="Lưu trạng thái chốt lương vào hệ thống"
                            >
                              {savingStaffId === item.user.id ? 'Đang lưu...' : 'Chốt'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedStaffForSlip(item)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Xem & In phiếu lương"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          <a
                            href={getZaloShareUrl(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Gửi xác nhận thù lao qua Zalo"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: CHI TIẾT CÁC CA DẠY TRONG THÁNG ================= */}
      {selectedStaffForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedStaffForDetail(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                Chi tiết ca dạy: {selectedStaffForDetail.user.displayName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tháng {month} · Tổng cộng {selectedStaffForDetail.sessionsCount} ca hoàn thành
              </p>
            </div>

            {/* Chi tiết theo lớp */}
            {selectedStaffForDetail.classEntries.length > 0 && (
              <div className="mb-3 space-y-2">
                {selectedStaffForDetail.classEntries.map((entry) => (
                  <div
                    key={entry.classId}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{entry.className}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold border ${
                          entry.salaryMode === 'percentage_revenue'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {entry.salaryMode === 'percentage_revenue' ? 'Khoán % DT' : 'Cố định/ca'}
                      </span>
                    </div>
                    {entry.salaryMode === 'percentage_revenue' ? (
                      <p className="text-slate-500">
                        {entry.sessionsCount} buổi thực dạy · DT hợp lệ: {formatVND(entry.validRevenue ?? 0)}{' '}
                        × {entry.revenuePercentage}% ÷ {entry.standardSessionsPerMonth} buổi chuẩn ={' '}
                        <strong className="text-emerald-700">{formatVND(entry.subtotal)}</strong>
                      </p>
                    ) : (
                      <p className="text-slate-500">
                        {entry.sessionsCount} ca × {formatVND(entry.rate ?? 0)} ={' '}
                        <strong className="text-emerald-700">{formatVND(entry.subtotal)}</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {selectedStaffForDetail.sessions.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  Không có ca dạy nào được ghi nhận trong tháng này.
                </p>
              ) : (
                selectedStaffForDetail.sessions.map((item, idx) => (
                  <div
                    key={item.session.id || idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.className}</span>
                      <p className="text-slate-500 mt-0.5">
                        Ngày: <strong className="text-indigo-700">{item.session.date}</strong>
                        {item.session.startTime && ` · ${item.session.startTime} - ${item.session.endTime}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[10px]">
                        Hoàn thành
                      </span>
                      {!wasPresent(item.session.id, selectedStaffForDetail.user.id) && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-700 text-[10px]">
                          Vắng buổi này
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 text-right border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedStaffForDetail(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PHIẾU THANH TOÁN THÙ LAO (PRINTABLE PAYSLIP) ================= */}
      {selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedStaffForSlip(null)}
              className="print:hidden absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Printable Payslip Container */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <Logo size="sm" title="HỌC TOÁN CÙNG TLM" subtitle="Trung tâm Toán học" />
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Cơ sở: {selectedCenter?.name}</p>
              </div>

              <div className="text-center my-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Phiếu thanh toán thù lao
                </h3>
                <p className="text-xs font-bold text-indigo-700 mt-0.5">Tháng {month}</p>
              </div>

              <div className="space-y-2 text-xs border-y border-slate-100 py-3 my-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Họ và tên:</span>
                  <span className="font-bold text-slate-900">{selectedStaffForSlip.user.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chức vụ:</span>
                  <span className="font-semibold text-slate-700">{selectedStaffForSlip.roleLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số ca giảng dạy / trợ giảng:</span>
                  <span className="font-bold text-indigo-700">{selectedStaffForSlip.sessionsCount} ca</span>
                </div>
                {/* Chi tiết theo lớp trong phiếu */}
                {selectedStaffForSlip.classEntries.map((entry) => (
                  <div key={entry.classId} className="flex justify-between text-[11px]">
                    <span className="text-slate-400 max-w-[180px] truncate">↳ {entry.className}:</span>
                    <span className="text-slate-600">
                      {entry.salaryMode === 'percentage_revenue'
                        ? `${entry.sessionsCount}b × ${entry.revenuePercentage}%DT = ${formatVND(entry.subtotal)}`
                        : `${entry.sessionsCount}ca × ${formatVND(entry.rate ?? 0)} = ${formatVND(entry.subtotal)}`}
                    </span>
                  </div>
                ))}
                {selectedStaffForSlip.bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Phụ cấp / Thưởng{selectedStaffForSlip.bonusReason ? ` (${selectedStaffForSlip.bonusReason})` : ''}:
                    </span>
                    <span className="font-semibold text-emerald-700">{formatVND(selectedStaffForSlip.bonus)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-black text-slate-900 uppercase">Thực nhận:</span>
                  <span className="font-black text-emerald-600 text-base">
                    {formatVND(selectedStaffForSlip.total)}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 text-center text-[10px] text-slate-500 pt-2">
                <div>
                  <p className="font-bold text-slate-700">Người lập phiếu</p>
                  <p className="mt-8">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Người nhận thù lao</p>
                  <p className="mt-8">(Ký và ghi rõ họ tên)</p>
                </div>
              </div>
            </div>

            <div className="print:hidden mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Printer className="h-4 w-4" />
                In phiếu thù lao
              </button>
              <button
                type="button"
                onClick={() => setSelectedStaffForSlip(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

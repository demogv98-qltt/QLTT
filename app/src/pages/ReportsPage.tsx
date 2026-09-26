import { collection, query, Timestamp, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { studentAvatar } from '../lib/avatar'
import { downloadCsv } from '../lib/csv'
import { currentMonthValue, formatVND, monthLabel, monthOffset, monthRange } from '../lib/month'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { Attendance, ClassGroup, Enrollment, Payment, PaymentMethod, Student } from '../types'

const TREND_MONTHS = 6
const REVENUE_COLOR = '#4f46e5' // indigo-600 — same brand hue as primary buttons/active nav elsewhere in the app

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

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export function ReportsPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId } = useCenterStore()
  const [month, setMonth] = useState(currentMonthValue())
  const { start, end } = useMemo(() => monthRange(month), [month])

  // 6-month trailing window (oldest..selected month) for the revenue trend chart, and to
  // derive the selected month's payment-method breakdown from the same fetch.
  const trendStartMonth = useMemo(() => monthOffset(month, -(TREND_MONTHS - 1)), [month])
  const trendStart = useMemo(() => monthRange(trendStartMonth).start, [trendStartMonth])

  const { data: students } = useCollection<Student>(
    () =>
      selectedCenterId && profile
        ? query(collection(db, 'students'), where('orgId', '==', profile.orgId), where('centerId', '==', selectedCenterId))
        : null,
    [selectedCenterId, profile],
  )
  const { data: classes } = useCollection<ClassGroup>(
    () =>
      selectedCenterId && profile
        ? query(collection(db, 'classes'), where('orgId', '==', profile.orgId), where('centerId', '==', selectedCenterId))
        : null,
    [selectedCenterId, profile],
  )
  // All-time, for công nợ (outstanding balance) — same definition PaymentsPage uses: sum of
  // every package ever sold minus sum of every payment ever recorded, per student.
  const { data: allEnrollments } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile
        ? query(collection(db, 'enrollments'), where('orgId', '==', profile.orgId), where('centerId', '==', selectedCenterId))
        : null,
    [selectedCenterId, profile],
  )
  const { data: allPayments } = useCollection<Payment>(
    () =>
      selectedCenterId && profile
        ? query(collection(db, 'payments'), where('orgId', '==', profile.orgId), where('centerId', '==', selectedCenterId))
        : null,
    [selectedCenterId, profile],
  )
  // Trailing 6-month window, for the revenue trend chart + this month's method breakdown.
  const { data: trendPayments } = useCollection<Payment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('recordedAt', '>=', Timestamp.fromDate(trendStart)),
          )
        : null,
    [selectedCenterId, profile, trendStart],
  )
  // Packages sold in the selected month, for "doanh thu bán gói theo lớp".
  const { data: monthEnrollments } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('purchasedAt', '>=', Timestamp.fromDate(start)),
            where('purchasedAt', '<', Timestamp.fromDate(end)),
          )
        : null,
    [selectedCenterId, profile, start, end],
  )
  const { data: monthAttendance } = useCollection<Attendance>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'attendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('recordedAt', '>=', Timestamp.fromDate(start)),
            where('recordedAt', '<', Timestamp.fromDate(end)),
          )
        : null,
    [selectedCenterId, profile, start, end],
  )

  const className = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes])

  // --- Công nợ (outstanding balance) ---
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

  // --- Revenue trend (last 6 months) + this month's payment-method breakdown ---
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

  // --- Revenue by class (packages sold this month) ---
  const revenueByClass = useMemo(() => {
    const sold: Record<string, { revenue: number; count: number }> = {}
    for (const en of monthEnrollments) {
      const bucket = sold[en.classId] ?? { revenue: 0, count: 0 }
      bucket.revenue += en.totalPrice
      bucket.count += 1
      sold[en.classId] = bucket
    }
    const attendanceByClass: Record<string, number> = {}
    for (const a of monthAttendance) attendanceByClass[a.classId] = (attendanceByClass[a.classId] ?? 0) + 1

    const classIds = new Set([...Object.keys(sold), ...Object.keys(attendanceByClass)])
    return Array.from(classIds)
      .map((classId) => ({
        classId,
        name: className[classId] ?? '(Lớp đã xoá)',
        revenue: sold[classId]?.revenue ?? 0,
        count: sold[classId]?.count ?? 0,
        attendance: attendanceByClass[classId] ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [monthEnrollments, monthAttendance, className])
  const maxClassRevenue = Math.max(1, ...revenueByClass.map((c) => c.revenue))

  const monthRevenueTotal = revenueByMonth.at(-1)?.total ?? 0
  const monthPackagesSold = monthEnrollments.length
  const monthPackagesValue = monthEnrollments.reduce((sum, e) => sum + e.totalPrice, 0)

  function exportDebtCsv() {
    downloadCsv(
      `cong-no-${month}.csv`,
      ['Học sinh', 'SĐT', 'Đã bán (đ)', 'Đã thu (đ)', 'Còn nợ (đ)'],
      debtByStudent.map((r) => [r.name, r.phone, r.owed, r.paid, r.debt]),
    )
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Báo cáo thống kê</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Đã thu trong tháng" value={formatVND(monthRevenueTotal)} />
        <StatTile
          label="Gói bán trong tháng"
          value={String(monthPackagesSold)}
          sub={monthPackagesSold > 0 ? formatVND(monthPackagesValue) : undefined}
        />
        <StatTile label="Tổng công nợ" value={formatVND(totalDebt)} />
        <StatTile label="Học sinh đang nợ" value={String(debtByStudent.filter((r) => r.debt > 0).length)} />
      </div>

      {/* Revenue trend */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">Doanh thu 6 tháng gần nhất (tiền đã thu)</p>
        <div className="overflow-x-auto">
          <svg width={Math.max(360, TREND_MONTHS * 72)} height={150} role="img" aria-label="Biểu đồ doanh thu 6 tháng gần nhất">
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
                      rx={2}
                      fill={REVENUE_COLOR}
                      opacity={hoverMonth === null || hoverMonth === r.month ? 1 : 0.35}
                    />
                  )}
                  <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fontSize={11} fill="#6b7280">
                    {monthLabel(r.month)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        {hoverMonth !== null && (
          <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <span className="font-medium">{monthLabel(hoverMonth)}:</span>{' '}
            {formatVND(revenueByMonth.find((r) => r.month === hoverMonth)?.total ?? 0)}
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* Revenue by payment method */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Doanh thu theo hình thức (tháng này)</p>
          <div className="space-y-2">
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
              <p className="py-4 text-center text-sm text-gray-400">Chưa có khoản thu nào trong tháng này.</p>
            )}
          </div>
        </div>

        {/* Revenue by class */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Doanh thu bán gói theo lớp (tháng này)</p>
          <div className="space-y-2">
            {revenueByClass.slice(0, 8).map((c) => (
              <BarRow key={c.classId} label={c.name} value={c.revenue} max={maxClassRevenue} formatted={formatVND(c.revenue)} />
            ))}
            {revenueByClass.length === 0 && <p className="py-4 text-center text-sm text-gray-400">Chưa có dữ liệu tháng này.</p>}
          </div>
        </div>
      </div>

      {/* Công nợ */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Công nợ chi tiết</p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <input type="checkbox" checked={showAllDebt} onChange={(e) => setShowAllDebt(e.target.checked)} />
              Hiện cả học sinh đã đóng đủ
            </label>
            <button
              type="button"
              onClick={exportDebtCsv}
              disabled={debtByStudent.length === 0}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Xuất CSV
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="px-2 py-1.5">Học sinh</th>
              <th className="px-2 py-1.5 text-right">Đã bán</th>
              <th className="px-2 py-1.5 text-right">Đã thu</th>
              <th className="px-2 py-1.5 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {debtRows.map((r) => (
              <tr key={r.studentId} className="border-t border-gray-100">
                <td className="px-2 py-1.5 font-medium text-gray-900">
                  <span className="mr-2">{studentAvatar(r.studentId)}</span>
                  {r.name}
                </td>
                <td className="px-2 py-1.5 text-right text-gray-600">{formatVND(r.owed)}</td>
                <td className="px-2 py-1.5 text-right text-gray-600">{formatVND(r.paid)}</td>
                <td className={`px-2 py-1.5 text-right font-medium ${r.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatVND(r.debt)}
                </td>
              </tr>
            ))}
            {debtRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                  {debtByStudent.length === 0 ? 'Chưa có gói nào được bán.' : 'Không có học sinh nào đang nợ.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

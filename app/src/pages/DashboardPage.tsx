import { collection, query, Timestamp, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { currentMonthValue, formatVND, monthRange } from '../lib/month'
import { ROLE_LABELS } from '../lib/roles'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { Attendance, AttendanceStatus, Enrollment, Payment, Student } from '../types'

const LOW_BALANCE_THRESHOLD = 2

// Same identity colors as the Điểm danh page's status pills — a status keeps the same
// color everywhere it appears in the app.
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

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId, centers } = useCenterStore()
  const [month, setMonth] = useState(currentMonthValue())
  const { start, end, daysInMonth } = useMemo(() => monthRange(month), [month])

  const { data: students } = useCollection<Student>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'students'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile],
  )
  const { data: activeEnrollments } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('active', '==', true),
          )
        : null,
    [selectedCenterId, profile],
  )
  const { data: monthPayments } = useCollection<Payment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('recordedAt', '>=', Timestamp.fromDate(start)),
            where('recordedAt', '<', Timestamp.fromDate(end)),
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

  const lowBalance = activeEnrollments.filter((e) => e.remainingSessions <= LOW_BALANCE_THRESHOLD)
  const totalRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0)
  const presentCount = monthAttendance.filter((a) => a.status === 'present' || a.status === 'makeup').length
  const attendanceRate = monthAttendance.length > 0 ? Math.round((presentCount / monthAttendance.length) * 100) : 0

  // Day-of-month -> count per status, for the stacked bar chart.
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

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Xin chào, {profile?.displayName}</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Vai trò: {profile ? ROLE_LABELS[profile.role] : '-'} · Quản lý {centers.length} cơ sở
      </p>

      {!selectedCenterId ? (
        <p className="text-sm text-gray-500">
          Chưa có cơ sở nào được gán cho tài khoản này.{' '}
          {profile?.role === 'owner' && 'Vào mục "Cơ sở" để tạo cơ sở đầu tiên.'}
        </p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Học sinh" value={String(students.length)} />
            <StatTile label="Doanh thu tháng" value={formatVND(totalRevenue)} />
            <StatTile label="Lượt điểm danh tháng" value={String(monthAttendance.length)} sub={`${attendanceRate}% có mặt`} />
            <StatTile label={`Sắp hết buổi (≤ ${LOW_BALANCE_THRESHOLD})`} value={String(lowBalance.length)} />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Điểm danh theo ngày trong tháng</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {STATUS_ORDER.map((s) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLOR[s] }} />
                    {STATUS_LABEL[s]}
                  </span>
                ))}
              </div>
            </div>

            {monthAttendance.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Chưa có lượt điểm danh nào trong tháng này.</p>
            ) : (
              <div className="overflow-x-auto">
                <svg
                  width={Math.max(560, daysInMonth * 18)}
                  height={160}
                  role="img"
                  aria-label="Biểu đồ số lượt điểm danh theo ngày, chia theo trạng thái"
                >
                  {byDay.map((d, i) => {
                    const x = i * 18 + 4
                    const barWidth = 12
                    const chartHeight = 120
                    let yCursor = chartHeight
                    const segments = STATUS_ORDER.map((status) => {
                      const count = d.counts[status]
                      const h = count > 0 ? (count / maxDayTotal) * chartHeight : 0
                      const y = yCursor - h
                      yCursor -= h > 0 ? h + 2 : 0 // 2px surface gap between stacked segments
                      return { status, count, y, h }
                    })
                    return (
                      <g
                        key={d.day}
                        onMouseEnter={() => setHoverDay(d.day)}
                        onMouseLeave={() => setHoverDay((cur) => (cur === d.day ? null : cur))}
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
                                rx={2}
                                fill={STATUS_COLOR[seg.status]}
                                opacity={hoverDay === null || hoverDay === d.day ? 1 : 0.35}
                              />
                            ),
                        )}
                        <text x={x + barWidth / 2} y={chartHeight + 14} textAnchor="middle" fontSize={9} fill="#9ca3af">
                          {d.day}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            {hoverDay !== null && byDay[hoverDay - 1] && byDay[hoverDay - 1].total > 0 && (
              <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <span className="font-medium">Ngày {hoverDay}:</span>{' '}
                {STATUS_ORDER.filter((s) => byDay[hoverDay - 1].counts[s] > 0)
                  .map((s) => `${STATUS_LABEL[s]} ${byDay[hoverDay - 1].counts[s]}`)
                  .join(', ')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

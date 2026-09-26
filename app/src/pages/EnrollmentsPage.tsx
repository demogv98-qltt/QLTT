import {
  addDoc,
  collection,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { db } from '../lib/firebase'
import { studentAvatar } from '../lib/avatar'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { ClassGroup, Enrollment, PackageType, Student } from '../types'

const LOW_BALANCE_THRESHOLD = 2

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function EnrollmentsPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId } = useCenterStore()

  const { data: students } = useCollection<Student>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'students'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            orderBy('fullName'),
          )
        : null,
    [selectedCenterId, profile],
  )
  const { data: classes } = useCollection<ClassGroup>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'classes'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            orderBy('name'),
          )
        : null,
    [selectedCenterId, profile],
  )
  const { data: enrollments, loading } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            orderBy('purchasedAt', 'desc'),
          )
        : null,
    [selectedCenterId, profile],
  )

  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [packageType, setPackageType] = useState<PackageType>('session_pack')
  const [totalSessions, setTotalSessions] = useState(10)
  const [pricePerSession, setPricePerSession] = useState(150000)
  const [submitting, setSubmitting] = useState(false)

  const studentName = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.fullName])),
    [students],
  )
  const className = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!studentId || !classId || !selectedCenterId || !profile || totalSessions <= 0) return
    setSubmitting(true)
    try {
      const now = new Date()
      const expiresAt =
        packageType === 'session_pack' ? addMonths(now, 3) : addMonths(now, 1)

      await addDoc(collection(db, 'enrollments'), {
        orgId: profile.orgId,
        studentId,
        classId,
        centerId: selectedCenterId,
        packageType,
        totalSessions,
        usedSessions: 0,
        remainingSessions: totalSessions,
        pricePerSession,
        totalPrice: totalSessions * pricePerSession,
        purchasedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        active: true,
      })
      setStudentId('')
      setClassId('')
      setTotalSessions(10)
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-4xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Gói buổi học</h2>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Học sinh</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">-- Chọn --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Lớp</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">-- Chọn --</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Loại gói</label>
          <select
            value={packageType}
            onChange={(e) => setPackageType(e.target.value as PackageType)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="session_pack">Trả theo buổi (khuyến nghị)</option>
            <option value="monthly">Gói cố định/tháng</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Số buổi</label>
          <input
            type="number"
            min={1}
            value={totalSessions}
            onChange={(e) => setTotalSessions(Number(e.target.value))}
            className="w-20 rounded-md border border-gray-300 px-2 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Đơn giá/buổi (đ)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={pricePerSession}
            onChange={(e) => setPricePerSession(Number(e.target.value))}
            className="w-28 rounded-md border border-gray-300 px-2 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Bán gói
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Học sinh</th>
              <th className="px-3 py-2">Lớp</th>
              <th className="px-3 py-2">Loại gói</th>
              <th className="px-3 py-2">Đã dùng/Tổng</th>
              <th className="px-3 py-2">Còn lại</th>
              <th className="px-3 py-2">Hết hạn</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((en) => {
              const expired = en.expiresAt.toDate() < new Date()
              const low = en.remainingSessions <= LOW_BALANCE_THRESHOLD && en.remainingSessions > 0
              return (
                <tr key={en.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    <span className="mr-2">{studentAvatar(en.studentId)}</span>
                    {studentName[en.studentId] ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{className[en.classId] ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {en.packageType === 'session_pack' ? 'Trả theo buổi' : 'Gói tháng'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {en.usedSessions}/{en.totalSessions}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        low
                          ? 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'
                          : 'text-gray-700'
                      }
                    >
                      {en.remainingSessions}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {en.expiresAt.toDate().toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-3 py-2">
                    {!en.active ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Đã dùng hết</span>
                    ) : expired ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Hết hạn</span>
                    ) : low ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Sắp hết buổi</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Đang hoạt động</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                  Chưa có gói nào được bán.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

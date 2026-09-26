import {
  addDoc,
  collection,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { Enrollment, Payment, PaymentMethod, Student } from '../types'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
}

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export function PaymentsPage() {
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
  const { data: enrollments } = useCollection<Enrollment>(
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
  const { data: payments, loading } = useCollection<Payment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'payments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            orderBy('recordedAt', 'desc'),
          )
        : null,
    [selectedCenterId, profile],
  )

  const studentName = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.fullName])), [students])

  const debtByStudent = useMemo(() => {
    const owed: Record<string, number> = {}
    const paid: Record<string, number> = {}
    for (const en of enrollments) owed[en.studentId] = (owed[en.studentId] ?? 0) + en.totalPrice
    for (const p of payments) paid[p.studentId] = (paid[p.studentId] ?? 0) + p.amount
    return students
      .map((s) => ({
        studentId: s.id,
        name: s.fullName,
        owed: owed[s.id] ?? 0,
        paid: paid[s.id] ?? 0,
        debt: (owed[s.id] ?? 0) - (paid[s.id] ?? 0),
      }))
      .filter((r) => r.owed > 0)
  }, [students, enrollments, payments])

  const [studentId, setStudentId] = useState('')
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!studentId || amount <= 0 || !selectedCenterId || !profile) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'payments'), {
        orgId: profile.orgId,
        studentId,
        centerId: selectedCenterId,
        amount,
        method,
        note: note.trim(),
        recordedBy: profile.id,
        recordedAt: serverTimestamp(),
      })
      setStudentId('')
      setAmount(0)
      setNote('')
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-4xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Thanh toán</h2>

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
          <label className="mb-1 block text-xs text-gray-500">Số tiền (đ)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-32 rounded-md border border-gray-300 px-2 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Hình thức</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs text-gray-500">Ghi chú</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Ghi nhận
        </button>
      </form>

      {debtByStudent.some((r) => r.debt > 0) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-800">Công nợ còn lại</p>
          <ul className="space-y-1 text-sm text-amber-800">
            {debtByStudent
              .filter((r) => r.debt > 0)
              .map((r) => (
                <li key={r.studentId}>
                  {r.name}: còn nợ {formatVND(r.debt)} (đã đóng {formatVND(r.paid)}/{formatVND(r.owed)})
                </li>
              ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Học sinh</th>
              <th className="px-3 py-2">Số tiền</th>
              <th className="px-3 py-2">Hình thức</th>
              <th className="px-3 py-2">Ghi chú</th>
              <th className="px-3 py-2">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{studentName[p.studentId] ?? '—'}</td>
                <td className="px-3 py-2 text-gray-700">{formatVND(p.amount)}</td>
                <td className="px-3 py-2 text-gray-600">{METHOD_LABELS[p.method]}</td>
                <td className="px-3 py-2 text-gray-600">{p.note || '-'}</td>
                <td className="px-3 py-2 text-gray-500">
                  {p.recordedAt?.toDate ? p.recordedAt.toDate().toLocaleString('vi-VN') : '-'}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                  Chưa có giao dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

import { addDoc, collection, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { Student } from '../types'

export function StudentsPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId } = useCenterStore()
  const { data: students, loading } = useCollection<Student>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'students'),
            // orgId must be in the filter — firestore.rules checks resource.data.orgId, and a
            // list query is only provably safe when every field the rule reads is also
            // constrained by the query itself.
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            orderBy('fullName'),
          )
        : null,
    [selectedCenterId, profile],
  )

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !selectedCenterId || !profile) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'students'), {
        orgId: profile.orgId,
        centerId: selectedCenterId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        parentPhone: parentPhone.trim(),
        active: true,
        createdAt: serverTimestamp(),
      })
      setFullName('')
      setPhone('')
      setParentPhone('')
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Học sinh</h2>

      <form
        onSubmit={handleCreate}
        className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-4"
      >
        <input
          placeholder="Họ tên học sinh"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="flex-1 min-w-[160px] rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="SĐT học sinh"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="SĐT phụ huynh"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Thêm học sinh
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Họ tên</th>
              <th className="px-3 py-2">SĐT HS</th>
              <th className="px-3 py-2">SĐT PH</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{s.fullName}</td>
                <td className="px-3 py-2 text-gray-600">{s.phone || '-'}</td>
                <td className="px-3 py-2 text-gray-600">{s.parentPhone || '-'}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {s.active ? 'Đang học' : 'Ngừng học'}
                  </span>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                  Chưa có học sinh nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

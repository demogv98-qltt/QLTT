import { addDoc, collection, orderBy, query, serverTimestamp, where, writeBatch, doc } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { db } from '../lib/firebase'
import { studentAvatar } from '../lib/avatar'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { Student } from '../types'

function parseBulkLine(line: string): { fullName: string; phone: string; parentPhone: string } | null {
  const parts = line.split(',').map((p) => p.trim())
  const fullName = parts[0] ?? ''
  if (!fullName) return null
  return { fullName, phone: parts[1] ?? '', parentPhone: parts[2] ?? '' }
}

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

  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)

  const bulkRows = bulkText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseBulkLine)
  const bulkValidCount = bulkRows.filter(Boolean).length

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

  async function handleBulkImport() {
    if (!selectedCenterId || !profile || bulkValidCount === 0) return
    setBulkSubmitting(true)
    setBulkResult(null)
    try {
      const batch = writeBatch(db)
      for (const row of bulkRows) {
        if (!row) continue
        const ref = doc(collection(db, 'students'))
        batch.set(ref, {
          orgId: profile.orgId,
          centerId: selectedCenterId,
          fullName: row.fullName,
          phone: row.phone,
          parentPhone: row.parentPhone,
          active: true,
          createdAt: serverTimestamp(),
        })
      }
      await batch.commit()
      setBulkResult(`Đã thêm ${bulkValidCount} học sinh.`)
      setBulkText('')
    } finally {
      setBulkSubmitting(false)
    }
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Học sinh</h2>
        <button
          type="button"
          onClick={() => setShowBulk((v) => !v)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {showBulk ? 'Đóng nhập danh sách' : 'Nhập danh sách đồng loạt'}
        </button>
      </div>

      {showBulk && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Dán danh sách học sinh (mỗi dòng 1 em)</p>
          <p className="mb-2 text-xs text-gray-500">
            Định dạng mỗi dòng: <code className="rounded bg-gray-100 px-1">Họ tên, SĐT học sinh, SĐT phụ huynh</code>{' '}
            — chỉ Họ tên là bắt buộc, có thể copy trực tiếp từ Excel/Google Sheets (cách nhau bằng dấu phẩy).
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={'Nguyễn Văn An, 0901234567, 0909876543\nTrần Thị Bình, 0912345678\nLê Văn Cường'}
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkSubmitting || bulkValidCount === 0}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {bulkSubmitting ? 'Đang thêm...' : `Thêm ${bulkValidCount} học sinh`}
            </button>
            {bulkResult && <span className="text-sm text-green-700">{bulkResult}</span>}
          </div>
        </div>
      )}

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
                <td className="px-3 py-2 font-medium text-gray-900">
                  <span className="mr-2">{studentAvatar(s.id)}</span>
                  {s.fullName}
                </td>
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

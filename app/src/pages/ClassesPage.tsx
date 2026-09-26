import { addDoc, collection, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { useStaffOfCenter } from '../lib/useStaff'
import { WEEKDAY_LABELS } from '../lib/schedule'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { canManage } from '../lib/roles'
import type { ClassGroup, RecurringSlot, Weekday } from '../types'

const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

export function ClassesPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId } = useCenterStore()
  const { teachers, tas } = useStaffOfCenter(selectedCenterId)
  const manage = canManage(profile?.role)

  const { data: classes, loading } = useCollection<ClassGroup>(
    () =>
      selectedCenterId
        ? query(collection(db, 'classes'), where('centerId', '==', selectedCenterId), orderBy('name'))
        : null,
    [selectedCenterId],
  )

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [taIds, setTaIds] = useState<string[]>([])
  const [room, setRoom] = useState('')
  const [slots, setSlots] = useState<RecurringSlot[]>([{ weekday: 1, startTime: '19:00', endTime: '20:30' }])
  const [submitting, setSubmitting] = useState(false)

  function updateSlot(index: number, patch: Partial<RecurringSlot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !selectedCenterId || !teacherId) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'classes'), {
        centerId: selectedCenterId,
        name: name.trim(),
        subject: subject.trim(),
        teacherId,
        taIds,
        schedule: slots,
        room: room.trim(),
        active: true,
        createdAt: serverTimestamp(),
      })
      setName('')
      setSubject('')
      setTeacherId('')
      setTaIds([])
      setRoom('')
      setSlots([{ weekday: 1, startTime: '19:00', endTime: '20:30' }])
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Lớp / Ca học</h2>

      {manage && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Tên lớp (VD: Toán 12 - T3/T5/CN 19h)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Môn học"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Phòng học"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Chọn giáo viên chính --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500">Trợ giảng:</span>
              {tas.map((ta) => (
                <label key={ta.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={taIds.includes(ta.id)}
                    onChange={(e) =>
                      setTaIds((prev) =>
                        e.target.checked ? [...prev, ta.id] : prev.filter((id) => id !== ta.id),
                      )
                    }
                  />
                  {ta.displayName}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Ca học lặp lại hàng tuần</p>
            {slots.map((slot, i) => (
              <div key={i} className="mb-1 flex items-center gap-2">
                <select
                  value={slot.weekday}
                  onChange={(e) => updateSlot(i, { weekday: Number(e.target.value) as Weekday })}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  {ALL_WEEKDAYS.map((d) => (
                    <option key={d} value={d}>
                      {WEEKDAY_LABELS[d]}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500"
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSlots((prev) => [...prev, { weekday: 1, startTime: '19:00', endTime: '20:30' }])}
              className="text-xs text-indigo-600"
            >
              + Thêm ca
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Tạo lớp
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-500">
                {c.subject} · Phòng {c.room || '-'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {c.schedule.map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.startTime}-${s.endTime}`).join(' · ')}
              </p>
            </li>
          ))}
          {classes.length === 0 && <p className="text-sm text-gray-500">Chưa có lớp nào.</p>}
        </ul>
      )}
    </div>
  )
}

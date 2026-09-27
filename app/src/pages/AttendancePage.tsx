import {
  collection,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import { studentAvatar } from '../lib/avatar'
import { applyAttendanceCredit } from '../lib/creditDeduction'
import { useCollection } from '../lib/useCollection'
import { todayISODate, weekdayOf, WEEKDAY_LABELS } from '../lib/schedule'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { canManage } from '../lib/roles'
import type { Attendance, AttendanceStatus, ClassGroup, Enrollment, Student } from '../types'

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  excused_absence: 'Vắng có phép',
  unexcused_absence: 'Vắng không phép',
  makeup: 'Học bù',
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700',
  excused_absence: 'bg-blue-100 text-blue-700',
  unexcused_absence: 'bg-red-100 text-red-700',
  makeup: 'bg-purple-100 text-purple-700',
}

export function AttendancePage() {
  const { profile } = useAuthStore()
  const { selectedCenterId } = useCenterStore()
  const manage = canManage(profile?.role)

  const { data: allClasses } = useCollection<ClassGroup>(
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

  const classes = useMemo(() => {
    if (manage || !profile) return allClasses
    return allClasses.filter((c) => c.teacherId === profile.id || c.taIds?.includes(profile.id))
  }, [allClasses, manage, profile])

  const [searchParams] = useSearchParams()
  const paramDate = searchParams.get('date')
  const paramClassId = searchParams.get('classId')

  const [date, setDate] = useState(() => paramDate || todayISODate())
  const [classId, setClassId] = useState(() => paramClassId || '')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)

  useEffect(() => {
    if (paramClassId) {
      setClassId(paramClassId)
    } else if (classes.length > 0 && !classId) {
      setClassId(classes[0].id)
    }
  }, [classes, classId, paramClassId])

  const selectedClass = classes.find((c) => c.id === classId) ?? null
  const todaysSlot = selectedClass?.schedule.find((s) => s.weekday === weekdayOf(date))

  const { data: enrollments } = useCollection<Enrollment>(
    () =>
      classId && selectedCenterId && profile
        ? query(
            collection(db, 'enrollments'),
            // orgId/centerId must be in the filter — Firestore rules check resource.data's
            // orgId and centerId, and a list query can only be proven safe when every field
            // the rule reads is also constrained by the query itself.
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('classId', '==', classId),
            where('active', '==', true),
          )
        : null,
    [classId, selectedCenterId, profile],
  )
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
  const studentName = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s.fullName])), [students])
  const roster = useMemo(
    () => [...new Set(enrollments.map((e) => e.studentId))],
    [enrollments],
  )

  const { data: attendanceRecords } = useCollection<Attendance>(
    () =>
      sessionId && selectedCenterId && profile
        ? query(
            collection(db, 'attendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('sessionId', '==', sessionId),
          )
        : null,
    [sessionId, selectedCenterId, profile],
  )
  const attendanceByStudent = useMemo(
    () => Object.fromEntries(attendanceRecords.map((a) => [a.studentId, a])),
    [attendanceRecords],
  )

  // Get-or-create the concrete session doc for this class+date (id is deterministic so
  // repeated opens of the same day are idempotent).
  useEffect(() => {
    setSessionId(null)
    if (!classId || !selectedCenterId || !profile) return
    let cancelled = false
    setCreatingSession(true)
    ;(async () => {
      const ref = doc(db, 'classSessions', `${classId}_${date}`)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, {
          orgId: profile.orgId,
          centerId: selectedCenterId,
          classId,
          date,
          startTime: todaysSlot?.startTime ?? '',
          endTime: todaysSlot?.endTime ?? '',
          status: 'scheduled',
          createdAt: serverTimestamp(),
        })
      }
      if (!cancelled) {
        setSessionId(ref.id)
        setCreatingSession(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, selectedCenterId, profile])

  async function record(studentId: string, status: AttendanceStatus) {
    if (!sessionId || !classId || !selectedCenterId || !profile) return
    const ref = doc(db, 'attendance', `${sessionId}_${studentId}`)
    await setDoc(ref, {
      orgId: profile.orgId,
      sessionId,
      classId,
      centerId: selectedCenterId,
      studentId,
      status,
      creditApplied: false,
      recordedBy: profile.id,
      recordedAt: serverTimestamp(),
    })
    // No Cloud Function trigger runs this project (Spark plan, no billing) — apply the FIFO
    // credit deduction right here instead. See app/src/lib/creditDeduction.ts.
    await applyAttendanceCredit(db, ref, ref.id, {
      orgId: profile.orgId,
      studentId,
      classId,
      centerId: selectedCenterId,
      status,
    })
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-gray-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Điểm danh</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        />
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-2 text-sm"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedClass && !todaysSlot && (
          <span className="self-center text-xs text-amber-600">
            Ngày này không thuộc lịch cố định của lớp — vẫn có thể điểm danh (buổi học bù/phát sinh).
          </span>
        )}
      </div>

      {classes.length === 0 && (
        <p className="text-sm text-gray-500">Bạn chưa được phân công lớp nào ở cơ sở này.</p>
      )}

      {creatingSession && <p className="text-sm text-gray-500">Đang chuẩn bị buổi học...</p>}

      {sessionId && roster.length === 0 && (
        <p className="text-sm text-gray-500">Chưa có học sinh nào đăng ký gói buổi cho lớp này.</p>
      )}

      {sessionId && roster.length > 0 && (
        <ul className="space-y-2">
          {roster.map((studentId) => {
            const recorded = attendanceByStudent[studentId]
            return (
              <li
                key={studentId}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <span className="font-medium text-gray-900">
                  <span className="mr-2">{studentAvatar(studentId)}</span>
                  {studentName[studentId] ?? studentId}
                </span>
                {recorded ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[recorded.status]}`}>
                    {STATUS_LABELS[recorded.status]}
                  </span>
                ) : (
                  <div className="flex gap-1">
                    {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => record(studentId, status)}
                        className={`rounded-md px-2 py-1 text-xs font-medium hover:opacity-80 ${STATUS_COLORS[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Ngày trong tuần hiện tại: {WEEKDAY_LABELS[weekdayOf(date)]}. Điểm danh "Có mặt", "Vắng
        không phép" hoặc "Học bù" sẽ tự động trừ 1 buổi trong gói của học sinh.
      </p>
    </div>
  )
}

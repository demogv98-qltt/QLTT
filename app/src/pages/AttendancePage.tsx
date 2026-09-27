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
import { todayISODate, weekdayOf } from '../lib/schedule'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { useOrgStore } from '../stores/orgStore'
import { canManage } from '../lib/roles'
import { QRScannerModal } from '../components/QRScannerModal'
import { StudentCardModal } from '../components/StudentCardModal'
import { StudentDetailModal } from '../components/StudentDetailModal'
import { Camera, QrCode, MessageCircle, Clock, CalendarDays, CheckCircle2 } from 'lucide-react'
import type { Attendance, AttendanceStatus, ClassGroup, Enrollment, Student } from '../types'

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  excused_absence: 'Vắng có phép',
  unexcused_absence: 'Vắng không phép',
  makeup: 'Học bù',
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  excused_absence: 'bg-blue-100 text-blue-800 border-blue-200',
  unexcused_absence: 'bg-red-100 text-red-800 border-red-200',
  makeup: 'bg-purple-100 text-purple-800 border-purple-200',
}

export function AttendancePage() {
  const { profile } = useAuthStore()
  const { selectedCenterId, centers } = useCenterStore()
  const { organization } = useOrgStore()
  const manage = canManage(profile?.role)

  const selectedCenter = centers.find((c) => c.id === selectedCenterId)

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

  // QR scanner & student card modals
  const [showScanner, setShowScanner] = useState(false)
  const [badgeStudent, setBadgeStudent] = useState<Student | null>(null)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)

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
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])

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

  // Get-or-create the concrete session doc for this class+date
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
  }, [classId, date, selectedCenterId, profile, todaysSlot])

  async function record(studentId: string, status: AttendanceStatus) {
    if (!sessionId || !classId || !selectedCenterId || !profile) return
    const ref = doc(db, 'attendance', `${sessionId}_${studentId}`)
    // merge: true + omitting creditApplied is deliberate: applyAttendanceCredit's transaction
    // below is the sole owner of that field. A plain (non-merge) setDoc here would blindly
    // reset creditApplied to false even when a concurrent call already committed true for the
    // same doc, defeating the idempotency lock and causing a double session deduction.
    await setDoc(
      ref,
      {
        orgId: profile.orgId,
        sessionId,
        classId,
        centerId: selectedCenterId,
        studentId,
        status,
        recordedBy: profile.id,
        recordedAt: serverTimestamp(),
      },
      { merge: true },
    )
    // Apply FIFO credit deduction directly
    await applyAttendanceCredit(db, ref, ref.id, {
      orgId: profile.orgId,
      studentId,
      classId,
      centerId: selectedCenterId,
      status,
    })
  }

  // QR Code scan processing
  async function handleQRScan(scannedStudentId: string) {
    const student = studentMap.get(scannedStudentId)
    if (!student) {
      return {
        success: false,
        message: `Mã không hợp lệ hoặc học sinh không thuộc cơ sở này (${scannedStudentId.slice(0, 8)}...)`,
      }
    }
    if (!sessionId) {
      return {
        success: false,
        studentName: student.fullName,
        message: 'Ca học chưa sẵn sàng. Vui lòng chọn lớp trước khi quét mã.',
      }
    }
    if (!roster.includes(student.id)) {
      return {
        success: false,
        studentName: student.fullName,
        message: 'Học sinh chưa có gói buổi học còn hiệu lực cho lớp này.',
      }
    }
    const existing = attendanceByStudent[student.id]
    if (existing) {
      return {
        success: false,
        studentName: student.fullName,
        message: `Học sinh đã được điểm danh trước đó: ${STATUS_LABELS[existing.status]}.`,
      }
    }
    await record(student.id, 'present')
    return {
      success: true,
      studentName: student.fullName,
      message: 'Đã điểm danh CÓ MẶT và tự động trừ 1 buổi thành công!',
    }
  }

  // Generate Zalo notification URL
  function getZaloNoticeUrl(student: Student, status?: AttendanceStatus) {
    const phone = (student.parentPhone || student.phone || '').replace(/\D/g, '')
    const className = selectedClass?.name || 'Toán học'
    const statusText = status ? STATUS_LABELS[status] : 'chưa điểm danh'
    const text = encodeURIComponent(
      `Kính gửi phụ huynh em ${student.fullName},\n` +
        `Trung tâm Toán học thông báo: Ngày ${date}, tại ca học lớp ${className}, em đã được điểm danh: ${statusText}.\n` +
        `Trung tâm xin thông báo để gia đình nắm thông tin ạ!`,
    )
    return phone ? `https://zalo.me/${phone}` : `https://zalo.me?text=${text}`
  }

  if (!selectedCenterId) {
    return <p className="text-sm text-slate-500">Chưa có cơ sở nào — hãy tạo cơ sở trước.</p>
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Điểm danh ca học
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Tự động trừ buổi học trong gói theo cơ chế FIFO · Hỗ trợ quét mã QR 1 chạm
          </p>
        </div>

        {/* Big QR Scan button */}
        {sessionId && (
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            Quét mã QR điểm danh
          </button>
        )}
      </div>

      {/* Date & Class Select Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && todaysSlot && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            <Clock className="h-3.5 w-3.5" />
            Ca học: {todaysSlot.startTime} - {todaysSlot.endTime} (Phòng: {selectedClass.room || 'Chưa xếp'})
          </div>
        )}

        {selectedClass && !todaysSlot && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            Ngày {date} không thuộc lịch định kỳ — vẫn điểm danh được (học bù / ca tăng cường).
          </span>
        )}
      </div>

      {classes.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Bạn chưa được phân công lớp nào ở cơ sở này.
        </div>
      )}

      {creatingSession && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 animate-pulse">
          Đang chuẩn bị buổi học...
        </div>
      )}

      {sessionId && roster.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có học sinh nào đăng ký gói buổi cho lớp này.
        </div>
      )}

      {sessionId && roster.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <span>Danh sách học sinh ({roster.length} em)</span>
            <span>Trạng thái chuyên cần & Thao tác</span>
          </div>

          <ul className="space-y-2.5">
            {roster.map((studentId) => {
              const recorded = attendanceByStudent[studentId]
              const studentObj = studentMap.get(studentId)

              return (
                <li
                  key={studentId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-slate-300"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => studentObj && setDetailStudent(studentObj)}
                      className="text-2xl shrink-0 hover:scale-110 transition-transform"
                      title="Xem hồ sơ 360° học sinh"
                    >
                      {studentAvatar(studentId)}
                    </button>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => studentObj && setDetailStudent(studentObj)}
                        className="font-bold text-slate-900 text-sm sm:text-base truncate text-left hover:text-indigo-600 hover:underline block"
                        title="Bấm để xem toàn diện hồ sơ học sinh (tiến độ, chuyên cần, công nợ)"
                      >
                        {studentObj?.fullName ?? studentId}
                      </button>
                      <p className="text-xs text-slate-400 truncate">
                        PH: {studentObj?.parentPhone || studentObj?.phone || 'Chưa cập nhật SĐT'}
                      </p>
                    </div>
                  </div>

                  {/* Status Pills / Actions */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {recorded ? (
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${STATUS_COLORS[recorded.status]}`}
                      >
                        {STATUS_LABELS[recorded.status]}
                      </span>
                    ) : (
                      <div className="flex gap-1.5 flex-wrap">
                        {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => record(studentId, status)}
                            className={`rounded-xl px-2.5 py-1 text-xs font-bold border transition-transform active:scale-95 shadow-2xs ${STATUS_COLORS[status]}`}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Secondary Actions: Student QR Card & Zalo Notice */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                      {studentObj && (
                        <button
                          type="button"
                          onClick={() => setBadgeStudent(studentObj)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          title="Xem & in thẻ học sinh (Mã QR)"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                      )}

                      {studentObj && (
                        <a
                          href={getZaloNoticeUrl(studentObj, recorded?.status)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Gửi tin nhắn Zalo thông báo cho phụ huynh"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Footer Info */}
      <div className="rounded-xl bg-slate-100/80 p-3.5 text-xs text-slate-500 leading-relaxed border border-slate-200">
        💡 <strong>Ghi chú:</strong> Điểm danh <strong>"Có mặt"</strong>, <strong>"Vắng không phép"</strong> hoặc <strong>"Học bù"</strong> sẽ tự động trừ 1 buổi trong gói theo cơ chế FIFO (ưu tiên gói mua trước). Quét mã QR sẽ tự động đánh dấu Có mặt ngay tức khắc!
      </div>

      {/* ================= MODAL: QUÉT MÃ QR ĐIỂM DANH ================= */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />

      {/* ================= MODAL: THẺ HỌC SINH ĐIỆN TỬ ================= */}
      <StudentCardModal
        student={badgeStudent}
        centerName={selectedCenter?.name}
        orgName={organization?.name}
        onClose={() => setBadgeStudent(null)}
      />

      {/* ================= MODAL: HỒ SƠ 360° HỌC SINH ================= */}
      <StudentDetailModal
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
      />
    </div>
  )
}

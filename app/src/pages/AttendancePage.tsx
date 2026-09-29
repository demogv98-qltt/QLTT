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
import html2canvas from 'html2canvas'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import { studentAvatar } from '../lib/avatar'
import { applyAttendanceCredit } from '../lib/creditDeduction'
import { useCollection } from '../lib/useCollection'
import { useStaffOfCenter } from '../lib/useStaff'
import { todayISODate, weekdayOf } from '../lib/schedule'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { useOrgStore } from '../stores/orgStore'
import { canManage } from '../lib/roles'
import { QRScannerModal } from '../components/QRScannerModal'
import { StudentCardModal } from '../components/StudentCardModal'
import { StudentDetailModal } from '../components/StudentDetailModal'
import { Logo } from '../components/Logo'
import {
  Camera,
  QrCode,
  MessageCircle,
  Clock,
  CalendarDays,
  CheckCircle2,
  Copy,
  ImageDown,
  Phone,
  AlertTriangle,
} from 'lucide-react'
import type {
  Attendance,
  AttendanceStatus,
  ClassGroup,
  Enrollment,
  Student,
  TeacherAttendanceRecord,
} from '../types'

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

// ---- Thông báo Zalo ----

type ZaloTab = 'start' | 'update'

interface ZaloNoticeProps {
  tab: ZaloTab
  setTab: (t: ZaloTab) => void
  selectedClass: ClassGroup | null
  date: string
  todaysSlot: { startTime: string; endTime: string } | undefined
  roster: string[]
  studentMap: Map<string, Student>
  attendanceByStudent: Record<string, Attendance>
  // Snapshot đầu buổi (để tính "đã vào lớp sau khi tab bắt đầu")
  initialAbsents: Set<string>
  canShowUpdateTab: boolean
  orgName?: string
  centerName?: string
}

function formatDate(dateStr: string) {
  // "YYYY-MM-DD" → "DD/MM/YYYY"
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function ZaloNoticePanel({
  tab,
  setTab,
  selectedClass,
  date,
  todaysSlot,
  roster,
  studentMap,
  attendanceByStudent,
  initialAbsents,
  canShowUpdateTab,
  orgName,
  centerName,
}: ZaloNoticeProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copyToast, setCopyToast] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const className = selectedClass?.name ?? 'Lớp học'
  const startTime = todaysSlot?.startTime ?? ''
  const endTime = todaysSlot?.endTime ?? ''
  const dateDisplay = formatDate(date)

  // Phân loại học sinh theo trạng thái điểm danh hiện tại
  const { absentIds, presentLate } = useMemo(() => {
    const absent: string[] = []
    const late: Array<{ studentId: string; timeStr: string }> = []
    const onTime: string[] = []

    for (const studentId of roster) {
      const rec = attendanceByStudent[studentId]
      if (!rec || rec.status === 'excused_absence' || rec.status === 'unexcused_absence') {
        absent.push(studentId)
      } else {
        // Tính đi trễ: recordedAt - startTime của ngày đó
        let isLate = false
        let timeStr = ''
        if (rec.recordedAt?.toDate && startTime) {
          const recordedDate = rec.recordedAt.toDate()
          timeStr = recordedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          const [h, min] = startTime.split(':').map(Number)
          const sessionStart = new Date(recordedDate)
          sessionStart.setHours(h, min, 0, 0)
          const diffMin = (recordedDate.getTime() - sessionStart.getTime()) / 60000
          if (diffMin > 10) isLate = true
        }
        if (isLate) {
          late.push({ studentId, timeStr })
        } else {
          onTime.push(studentId)
        }
      }
    }
    return { absentIds: absent, presentLate: late }
  }, [roster, attendanceByStudent, startTime])

  // Tab "Cập nhật 15 phút": ai đã vào lớp sau lúc đầu buổi
  const lateArrivals = useMemo(() => {
    if (tab !== 'update') return []
    return presentLate.filter((p) => initialAbsents.has(p.studentId))
  }, [tab, presentLate, initialAbsents])

  const stillAbsent = useMemo(() => {
    if (tab !== 'update') return []
    return absentIds
  }, [tab, absentIds])

  // Sinh nội dung text
  const noticeText = useMemo(() => {
    if (tab === 'start') {
      const header = `📋 Điểm danh lớp ${className} — ${dateDisplay}, ca ${startTime}-${endTime}`
      if (absentIds.length === 0) {
        return `${header}\n🎉 Cả lớp đều có mặt đầu giờ!`
      }
      const lines = absentIds
        .map((id) => `❌ ${studentMap.get(id)?.fullName ?? id}`)
        .join('\n')
      return `${header}\nCác em vắng mặt đầu giờ:\n${lines}\nQuý phụ huynh vui lòng xác nhận tình trạng của con giúp trung tâm ạ. Cảm ơn quý phụ huynh!`
    } else {
      const header = `🔄 Cập nhật điểm danh lớp ${className} — ${dateDisplay}`
      const lateLines =
        lateArrivals.length > 0
          ? `Đã vào lớp (trễ):\n${lateArrivals.map((p) => `⏰ ${studentMap.get(p.studentId)?.fullName ?? p.studentId}${p.timeStr ? ` — vào lúc ${p.timeStr}` : ''}`).join('\n')}`
          : 'Không có em nào vào lớp thêm.'
      const absentLines =
        stillAbsent.length > 0
          ? `Vẫn chưa có mặt:\n${stillAbsent.map((id) => `❌ ${studentMap.get(id)?.fullName ?? id}`).join('\n')}`
          : '✅ Tất cả đều đã vào lớp!'
      return `${header}\n${lateLines}\n${absentLines}\nTrung tâm sẽ tiếp tục cập nhật nếu có thay đổi. Cảm ơn quý phụ huynh!`
    }
  }, [tab, absentIds, lateArrivals, stillAbsent, className, dateDisplay, startTime, endTime, studentMap])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(noticeText)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 3000)
    } catch {
      // Fallback: chọn text trong textarea
      alert('Không sao chép được tự động. Hãy bấm Ctrl+A, Ctrl+C trong ô văn bản bên dưới.')
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `thong-bao-diem-danh-${className.replace(/\s+/g, '-')}-${date}.png`
      a.click()
    } catch (err) {
      console.error('html2canvas error:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-indigo-900">Bộ tạo thông báo Zalo</h4>
        </div>
        <p className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
          Soạn sẵn — tự dán tay vào nhóm Zalo
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('start')}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            tab === 'start'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          📋 Mẫu đầu buổi
        </button>
        <button
          type="button"
          onClick={() => canShowUpdateTab && setTab('update')}
          disabled={!canShowUpdateTab}
          title={!canShowUpdateTab ? 'Chỉ hiện sau khi đã qua 15 phút kể từ giờ bắt đầu' : undefined}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            tab === 'update'
              ? 'bg-indigo-600 text-white shadow-xs'
              : canShowUpdateTab
                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          🔄 Cập nhật 15 phút{!canShowUpdateTab && ' (chưa tới giờ)'}
        </button>
      </div>

      {/* Card có thể chụp ảnh */}
      <div
        ref={cardRef}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Logo trung tâm */}
        <div className="border-b border-slate-100 pb-3">
          <Logo size="sm" title={orgName ?? 'Trung tâm'} subtitle={centerName} />
        </div>

        {/* Nội dung */}
        <pre className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans">
          {noticeText}
        </pre>
      </div>

      {/* Textarea để copy thủ công khi clipboard API bị chặn */}
      <div>
        <p className="text-[11px] text-slate-500 mb-1">Nội dung văn bản (chỉnh sửa tự do nếu cần):</p>
        <textarea
          readOnly
          value={noticeText}
          rows={6}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 font-mono resize-y focus:border-indigo-400 focus:outline-none"
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          Sao chép nội dung
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-60"
        >
          <ImageDown className="h-3.5 w-3.5" />
          {downloading ? 'Đang tạo ảnh...' : 'Tải ảnh thông báo (.png)'}
        </button>
        {copyToast && (
          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 font-semibold">
            ✅ Đã sao chép — dán vào nhóm Zalo
          </span>
        )}
      </div>
    </div>
  )
}

// ---- Trang Điểm danh ----

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

  // Zalo notice tab
  const [zaloTab, setZaloTab] = useState<ZaloTab>('start')
  // Snapshot học sinh vắng đầu buổi (để Tab "Cập nhật 15 phút" tính "đã vào sau")
  const [initialAbsents, setInitialAbsents] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (paramClassId) {
      setClassId(paramClassId)
    } else if (classes.length > 0 && !classId) {
      setClassId(classes[0].id)
    }
  }, [classes, classId, paramClassId])

  const selectedClass = classes.find((c) => c.id === classId) ?? null
  const todaysSlot = selectedClass?.schedule.find((s) => s.weekday === weekdayOf(date))

  // Chấm công GV/Trợ giảng — chỉ owner/manager mới thấy/sửa được (xem firestore.rules).
  const { teachers: centerTeachers, tas: centerTas } = useStaffOfCenter(
    manage ? profile?.orgId : undefined,
    selectedCenterId,
  )
  const staffNameMap = useMemo(
    () => new Map([...centerTeachers, ...centerTas].map((u) => [u.id, u.displayName])),
    [centerTeachers, centerTas],
  )
  const assignedStaff = useMemo(() => {
    if (!selectedClass) return []
    const list: { id: string; role: 'teacher' | 'ta'; name: string }[] = []
    if (selectedClass.teacherId) {
      list.push({
        id: selectedClass.teacherId,
        role: 'teacher',
        name: staffNameMap.get(selectedClass.teacherId) ?? 'Giáo viên',
      })
    }
    for (const taId of selectedClass.taIds ?? []) {
      list.push({ id: taId, role: 'ta', name: staffNameMap.get(taId) ?? 'Trợ giảng' })
    }
    return list
  }, [selectedClass, staffNameMap])

  const { data: teacherAttendanceRecords } = useCollection<TeacherAttendanceRecord>(
    () =>
      sessionId && selectedCenterId && profile && manage
        ? query(
            collection(db, 'teacherAttendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('sessionId', '==', sessionId),
          )
        : null,
    [sessionId, selectedCenterId, profile, manage],
  )
  const teacherAttendanceByStaff = useMemo(
    () => new Map(teacherAttendanceRecords.map((r) => [r.staffId, r.confirmed])),
    [teacherAttendanceRecords],
  )

  async function handleStaffAttendance(staffId: string, role: 'teacher' | 'ta', present: boolean) {
    if (!sessionId || !classId || !selectedCenterId || !profile) return
    await setDoc(
      doc(db, 'teacherAttendance', `${sessionId}_${staffId}`),
      {
        orgId: profile.orgId,
        sessionId,
        classId,
        centerId: selectedCenterId,
        staffId,
        staffRole: role,
        confirmed: present,
        confirmedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

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

  // Toàn bộ lịch sử điểm danh của lớp này (mọi buổi) — dùng để tìm đúng trạng thái của
  // "buổi liền trước" cho cảnh báo nguy cơ thôi học bên dưới, thay vì chỉ nhìn buổi hiện tại.
  const { data: classAttendanceHistory } = useCollection<Attendance>(
    () =>
      classId && selectedCenterId && profile
        ? query(
            collection(db, 'attendance'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('classId', '==', classId),
          )
        : null,
    [classId, selectedCenterId, profile],
  )
  // Với mỗi học sinh: trạng thái của buổi gần nhất TRƯỚC ngày đang xem (không tính buổi hiện tại).
  const previousStatusByStudent = useMemo(() => {
    const latestBefore: Record<string, { recordedAtMs: number; status: AttendanceStatus }> = {}
    for (const a of classAttendanceHistory) {
      if (a.sessionId === sessionId) continue // bỏ qua buổi đang xem
      const ms = a.recordedAt?.toDate ? a.recordedAt.toDate().getTime() : 0
      const cur = latestBefore[a.studentId]
      if (!cur || ms > cur.recordedAtMs) {
        latestBefore[a.studentId] = { recordedAtMs: ms, status: a.status }
      }
    }
    return Object.fromEntries(Object.entries(latestBefore).map(([id, v]) => [id, v.status]))
  }, [classAttendanceHistory, sessionId])

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
        // Chụp lại đúng GV chính/trợ giảng của lớp NGAY TẠI THỜI ĐIỂM buổi học này được tạo —
        // không được để PayrollPage tự tra lại classes.teacherId/taIds hiện tại, vì nếu lớp đổi
        // GV/TG giữa tháng, mọi buổi cũ sẽ bị tính nhầm sang người mới (xem PayrollPage.tsx).
        await setDoc(ref, {
          orgId: profile.orgId,
          centerId: selectedCenterId,
          classId,
          date,
          startTime: todaysSlot?.startTime ?? '',
          endTime: todaysSlot?.endTime ?? '',
          status: 'scheduled',
          createdAt: serverTimestamp(),
          teacherId: selectedClass?.teacherId ?? '',
          taIds: selectedClass?.taIds ?? [],
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
  }, [classId, date, selectedCenterId, profile, todaysSlot, selectedClass])

  // Tính canShowUpdateTab: startTime + 15 phút đã qua chưa?
  const canShowUpdateTab = useMemo(() => {
    if (!todaysSlot?.startTime || !date) return false
    const [h, m] = todaysSlot.startTime.split(':').map(Number)
    const sessionStart = new Date(date)
    sessionStart.setHours(h, m, 0, 0)
    const cutoff = new Date(sessionStart.getTime() + 15 * 60 * 1000)
    return Date.now() >= cutoff.getTime()
  }, [todaysSlot, date])

  // Snapshot học sinh vắng khi mở lần đầu (chỉ set 1 lần khi sessionId vừa sẵn sàng)
  const initialAbsentsSnapped = useRef(false)
  useEffect(() => {
    if (!sessionId || initialAbsentsSnapped.current || roster.length === 0) return
    initialAbsentsSnapped.current = true
    const absents = new Set(
      roster.filter((id) => {
        const rec = attendanceByStudent[id]
        return !rec || rec.status === 'excused_absence' || rec.status === 'unexcused_absence'
      }),
    )
    setInitialAbsents(absents)
  }, [sessionId, roster, attendanceByStudent])

  // Reset snapshot khi đổi buổi/lớp
  useEffect(() => {
    initialAbsentsSnapped.current = false
    setInitialAbsents(new Set())
    setZaloTab('start')
  }, [classId, date])

  async function record(studentId: string, status: AttendanceStatus) {
    if (!sessionId || !classId || !selectedCenterId || !profile) return
    const ref = doc(db, 'attendance', `${sessionId}_${studentId}`)
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
        `Trung tâm thông báo: Ngày ${date}, tại ca học lớp ${className}, em đã được điểm danh: ${statusText}.\n` +
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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        {/* Chấm công GV/Trợ giảng của buổi này — chỉ owner/manager thấy/sửa được */}
        {manage && sessionId && assignedStaff.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700">
              Chấm công buổi này{' '}
              <span className="font-normal text-slate-400">(dùng để tính lương)</span>
            </p>
            {assignedStaff.map((s) => {
              const recorded = teacherAttendanceByStaff.get(s.id)
              const present = recorded ?? true // chưa chấm công = mặc định coi như có mặt
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700">
                    {s.name}{' '}
                    <span className="text-slate-400">({s.role === 'teacher' ? 'GV chính' : 'Trợ giảng'})</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStaffAttendance(s.id, s.role, true)}
                      className={`rounded-md px-2 py-1 font-semibold transition-colors ${
                        present
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Có mặt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStaffAttendance(s.id, s.role, false)}
                      className={`rounded-md px-2 py-1 font-semibold transition-colors ${
                        !present
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Vắng
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
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

              // Cảnh báo nguy cơ thôi học: buổi này vắng không phép, VÀ buổi liền trước (khác
              // ngày, tra từ classAttendanceHistory) cũng đã là vắng không phép.
              const isCurrentUnexcused = recorded?.status === 'unexcused_absence'
              const isPreviousUnexcused = previousStatusByStudent[studentId] === 'unexcused_absence'
              const showRiskAlert = isCurrentUnexcused && isPreviousUnexcused

              const cleanPhone = (studentObj?.parentPhone || studentObj?.phone || '').replace(/\D/g, '')

              return (
                <li
                  key={studentId}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border bg-white p-4 shadow-xs transition-colors hover:border-slate-300 ${
                    showRiskAlert ? 'border-red-300 bg-red-50/30' : 'border-slate-200/80'
                  }`}
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
                      {showRiskAlert && (
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" />
                          Vắng không phép — nguy cơ thôi học
                        </p>
                      )}
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

                      {showRiskAlert && cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors"
                          title="Gọi điện cho phụ huynh ngay"
                        >
                          <Phone className="h-4 w-4" />
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

      {/* ====== KHU VỰC THÔNG BÁO ZALO ====== */}
      {sessionId && roster.length > 0 && (
        <ZaloNoticePanel
          tab={zaloTab}
          setTab={setZaloTab}
          selectedClass={selectedClass}
          date={date}
          todaysSlot={todaysSlot}
          roster={roster}
          studentMap={studentMap}
          attendanceByStudent={attendanceByStudent}
          initialAbsents={initialAbsents}
          canShowUpdateTab={canShowUpdateTab}
          orgName={organization?.name}
          centerName={selectedCenter?.name}
        />
      )}

      {/* Footer Info */}
      <div className="rounded-xl bg-slate-100/80 p-3.5 text-xs text-slate-500 leading-relaxed border border-slate-200">
        💡 <strong>Ghi chú:</strong> Điểm danh <strong>"Có mặt"</strong>,{' '}
        <strong>"Vắng không phép"</strong> hoặc <strong>"Học bù"</strong> sẽ tự động trừ 1 buổi trong gói theo
        cơ chế FIFO (ưu tiên gói mua trước). Quét mã QR sẽ tự động đánh dấu Có mặt ngay tức khắc!
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

import { collection, query, where } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { WEEKDAY_LABELS, todayISODate, weekdayOf } from '../lib/schedule'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import {
  Clock,
  MapPin,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import type { AppUser, ClassGroup, Weekday } from '../types'

const ALL_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0] // T2 to CN

interface ScheduledSession {
  classId: string
  className: string
  subject: string
  room: string
  centerId: string
  centerName: string
  teacherId: string
  teacherName: string
  taIds: string[]
  taNames: string[]
  weekday: Weekday
  startTime: string
  endTime: string
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function CrossCenterScheduleMatrix() {
  const { profile } = useAuthStore()
  const { centers } = useCenterStore()

  const todayIso = todayISODate()
  const todayWeekday = weekdayOf(todayIso)

  const [selectedWeekday, setSelectedWeekday] = useState<Weekday>(todayWeekday)
  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('ALL')
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Query ALL classes across the entire organization
  const { data: allClasses, loading: classesLoading } = useCollection<ClassGroup>(
    () =>
      profile
        ? query(
            collection(db, 'classes'),
            where('orgId', '==', profile.orgId),
          )
        : null,
    [profile],
  )

  // Query ALL teachers and TAs in the organization
  const { data: staffMembers } = useCollection<AppUser>(
    () =>
      profile
        ? query(
            collection(db, 'users'),
            where('orgId', '==', profile.orgId),
            where('role', 'in', ['teacher', 'ta']),
          )
        : null,
    [profile],
  )

  const centerMap = useMemo(() => new Map(centers.map((c) => [c.id, c.name])), [centers])
  const staffMap = useMemo(() => new Map(staffMembers.map((u) => [u.id, u.displayName])), [staffMembers])

  // Flatten active classes into slot items for the selected weekday
  const sessionsOnDay = useMemo(() => {
    const list: ScheduledSession[] = []

    for (const c of allClasses) {
      if (!c.active) continue
      const matchingSlots = (c.schedule || []).filter((s) => s.weekday === selectedWeekday)
      for (const slot of matchingSlots) {
        list.push({
          classId: c.id,
          className: c.name,
          subject: c.subject,
          room: c.room || 'Chưa xếp phòng',
          centerId: c.centerId,
          centerName: centerMap.get(c.centerId) || 'Cơ sở khác',
          teacherId: c.teacherId,
          teacherName: staffMap.get(c.teacherId) || 'Chưa gán GV',
          taIds: c.taIds || [],
          taNames: (c.taIds || []).map((id) => staffMap.get(id) || 'Trợ giảng'),
          weekday: slot.weekday,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      }
    }

    return list.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [allClasses, selectedWeekday, centerMap, staffMap])

  // Conflict Detection: check if any Teacher or TA is double-booked on this day
  const conflicts = useMemo(() => {
    const conflictList: {
      type: 'overlap' | 'tight'
      staffName: string
      role: string
      sessionA: ScheduledSession
      sessionB: ScheduledSession
      desc: string
    }[] = []

    for (let i = 0; i < sessionsOnDay.length; i++) {
      for (let j = i + 1; j < sessionsOnDay.length; j++) {
        const a = sessionsOnDay[i]
        const b = sessionsOnDay[j]

        // Find common staff (teacher or TAs)
        const commonStaffIds: string[] = []
        if (a.teacherId && a.teacherId === b.teacherId) commonStaffIds.push(a.teacherId)
        for (const taId of a.taIds) {
          if (b.taIds.includes(taId) && !commonStaffIds.includes(taId)) {
            commonStaffIds.push(taId)
          }
        }
        if (a.teacherId && b.taIds.includes(a.teacherId) && !commonStaffIds.includes(a.teacherId)) {
          commonStaffIds.push(a.teacherId)
        }
        if (b.teacherId && a.taIds.includes(b.teacherId) && !commonStaffIds.includes(b.teacherId)) {
          commonStaffIds.push(b.teacherId)
        }

        if (commonStaffIds.length === 0) continue

        const startA = timeToMinutes(a.startTime)
        const endA = timeToMinutes(a.endTime)
        const startB = timeToMinutes(b.startTime)
        const endB = timeToMinutes(b.endTime)

        for (const staffId of commonStaffIds) {
          const staffUser = staffMembers.find((u) => u.id === staffId)
          const staffName = staffUser?.displayName || 'Nhân sự'
          const roleLabel = staffUser?.role === 'teacher' ? 'Giáo viên' : 'Trợ giảng'

          // Check direct overlap: startA < endB && endA > startB
          if (startA < endB && endA > startB) {
            conflictList.push({
              type: 'overlap',
              staffName,
              role: roleLabel,
              sessionA: a,
              sessionB: b,
              desc: `Bị xếp trùng giờ (${a.startTime}-${a.endTime} và ${b.startTime}-${b.endTime}) giữa lớp "${a.className}" (${a.centerName}) và "${b.className}" (${b.centerName})`,
            })
          }
          // Check tight movement between DIFFERENT centers (< 20 mins gap)
          else if (a.centerId !== b.centerId) {
            const gap = Math.min(Math.abs(startB - endA), Math.abs(startA - endB))
            if (gap < 20) {
              conflictList.push({
                type: 'tight',
                staffName,
                role: roleLabel,
                sessionA: a,
                sessionB: b,
                desc: `Khoảng cách di chuyển quá gấp giữa 2 cơ sở (${gap} phút) giữa "${a.className}" (${a.centerName}) và "${b.className}" (${b.centerName})`,
              })
            }
          }
        }
      }
    }

    return conflictList
  }, [sessionsOnDay, staffMembers])

  // Filtered sessions based on user selections
  const filteredSessions = useMemo(() => {
    return sessionsOnDay.filter((s) => {
      if (selectedCenterFilter !== 'ALL' && s.centerId !== selectedCenterFilter) return false
      if (selectedStaffFilter !== 'ALL') {
        const matchesTeacher = s.teacherId === selectedStaffFilter
        const matchesTa = s.taIds.includes(selectedStaffFilter)
        if (!matchesTeacher && !matchesTa) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = s.className.toLowerCase().includes(q)
        const matchSubject = s.subject.toLowerCase().includes(q)
        const matchRoom = s.room.toLowerCase().includes(q)
        const matchTeacher = s.teacherName.toLowerCase().includes(q)
        const matchTa = s.taNames.some((n) => n.toLowerCase().includes(q))
        const matchCenter = s.centerName.toLowerCase().includes(q)
        if (!matchName && !matchSubject && !matchRoom && !matchTeacher && !matchTa && !matchCenter) {
          return false
        }
      }
      return true
    })
  }, [sessionsOnDay, selectedCenterFilter, selectedStaffFilter, searchQuery])

  // Group by Center for Side-by-Side 3 Branches View
  const sessionsByCenter = useMemo(() => {
    const map = new Map<string, ScheduledSession[]>()
    for (const c of centers) {
      map.set(c.id, [])
    }
    for (const s of filteredSessions) {
      const list = map.get(s.centerId) || []
      list.push(s)
      map.set(s.centerId, list)
    }
    return map
  }, [centers, filteredSessions])

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Ma trận lịch dạy & trực ca toàn hệ thống (3 cơ sở)
              </h3>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Kiểm tra nhanh: <em>"Giờ đó, ngày đó, ở cơ sở nào ai đang dạy? Trợ giảng nào đang trực?"</em>
            </p>
          </div>

          {/* Quick conflict status badge */}
          <div>
            {conflicts.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Phát hiện <strong>{conflicts.length}</strong> ca có cảnh báo trùng lịch / di chuyển gấp!
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Lịch dạy toàn hệ thống ổn định, không có xung đột giờ!</span>
              </div>
            )}
          </div>
        </div>

        {/* Weekday Selector Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-4">
          {ALL_WEEKDAYS.map((w) => {
            const isToday = w === todayWeekday
            const isSelected = w === selectedWeekday
            return (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWeekday(w)}
                className={`relative flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span>{WEEKDAY_LABELS[w]}</span>
                {isToday && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    Hôm nay
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter by Center */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedCenterFilter}
              onChange={(e) => setSelectedCenterFilter(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">🏢 Tất cả 3 cơ sở (Xem song song)</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Staff (Teacher or TA) */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5">
            <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">👥 Tất cả giáo viên & trợ giảng</option>
              <optgroup label="Giáo viên">
                {staffMembers
                  .filter((u) => u.role === 'teacher')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      👨‍🏫 GV: {t.displayName}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Trợ giảng">
                {staffMembers
                  .filter((u) => u.role === 'ta')
                  .map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      🧑‍💼 TG: {ta.displayName}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Text Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm lớp, môn, phòng, tên thầy cô..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Conflict / Overlap Warnings Alert Box */}
      {conflicts.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Cảnh báo xếp lịch cần lưu ý trên toàn hệ thống ({WEEKDAY_LABELS[selectedWeekday]}):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {conflicts.map((conf, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">
                    {conf.role}: <span className="text-indigo-700">{conf.staffName}</span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      conf.type === 'overlap'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {conf.type === 'overlap' ? 'Trùng giờ dạy' : 'Di chuyển gấp'}
                  </span>
                </div>
                <p className="text-slate-600">{conf.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: 3 Branches Side-by-Side (or Single Selected Center) */}
      {classesLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          Đang tải lịch toàn hệ thống...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {centers
            .filter((c) => selectedCenterFilter === 'ALL' || c.id === selectedCenterFilter)
            .map((center) => {
              const sessions = sessionsByCenter.get(center.id) || []

              return (
                <div
                  key={center.id}
                  className="flex flex-col rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden"
                >
                  {/* Branch Card Header */}
                  <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                        <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                          {center.name}
                        </h4>
                      </div>
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                        {sessions.length} ca
                      </span>
                    </div>
                  </div>

                  {/* Sessions List */}
                  <div className="flex-1 p-4 space-y-3 bg-slate-50/30 overflow-y-auto max-h-[600px]">
                    {sessions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-400">
                        Không có ca học nào trong {WEEKDAY_LABELS[selectedWeekday]} tại cơ sở này.
                      </div>
                    ) : (
                      sessions.map((s, idx) => (
                        <div
                          key={`${s.classId}-${idx}`}
                          className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-2.5"
                        >
                          {/* Time & Room header */}
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-black text-indigo-700">
                              <Clock className="h-3.5 w-3.5" />
                              {s.startTime} - {s.endTime}
                            </span>
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              Phòng: {s.room}
                            </span>
                          </div>

                          {/* Class Name */}
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                              {s.className}
                            </h5>
                            <p className="text-xs text-slate-500 mt-0.5">{s.subject}</p>
                          </div>

                          {/* Teacher & TA Details */}
                          <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-medium text-slate-400">👨‍🏫 GV:</span>
                              <strong className="font-bold text-slate-900">{s.teacherName}</strong>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <span className="font-medium text-slate-400">🧑‍💼 Trợ giảng:</span>
                              <span className="font-semibold text-slate-700">
                                {s.taNames.length > 0 ? s.taNames.join(', ') : 'Không có'}
                              </span>
                            </div>
                          </div>

                          {/* Action Button: Điểm danh ca này */}
                          <div className="pt-2 flex justify-end">
                            <Link
                              to={`/attendance?classId=${s.classId}&date=${todayIso}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-colors"
                            >
                              <span>Vào điểm danh</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

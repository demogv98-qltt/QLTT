// Script tạo dữ liệu DEMO (1 trung tâm "Toán Thành Đạt", 3 cơ sở, 500 học sinh) vào
// project Firebase THẬT (qltt-tlm) — hoàn toàn tách biệt với trung tâm thật của thầy
// nhờ kiến trúc multi-tenant (mỗi orgId là 1 "hộp" dữ liệu riêng).
//
// CÁCH CHẠY (xem hướng dẫn đầy đủ do Claude gửi kèm):
//   1. Tải "serviceAccountKey.json" từ Firebase Console, để CÙNG THƯ MỤC với file này.
//   2. cd vào thư mục chứa file này, chạy: npx tsx seed-demo-production.mts
//
// Script CHỦ ĐỘNG bỏ qua bảng creditLedger (chỉ để log nội bộ, không hiện ở đâu trên
// giao diện) để giảm số lượt ghi — đã test qua Firebase Emulator, tổng ~11.800 lượt
// ghi, an toàn dưới hạn mức 20.000 lượt/ngày của gói Spark miễn phí.
//
// ⚠️ CHỈ CHẠY ĐÚNG 1 LẦN. Mỗi lần chạy sẽ tạo thêm 1 trung tâm demo mới (không tự
// nhận ra và ghi đè lên lần chạy trước) — chạy 2 lần sẽ ra 2 trung tâm demo trùng
// lặp, tốn thêm ~12.000 lượt ghi nữa. Nếu chạy nhầm lần 2, đừng chạy tiếp — báo lại
// để được hướng dẫn dọn dữ liệu thừa.

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Timestamp, type DocumentData, type DocumentReference } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = join(__dirname, 'serviceAccountKey.json')

let serviceAccount: ServiceAccount
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'))
} catch {
  console.error(`\n❌ Không tìm thấy file "serviceAccountKey.json" trong thư mục:\n   ${__dirname}\n`)
  console.error('Xem lại hướng dẫn: tải file khoá từ Firebase Console, đổi tên đúng')
  console.error('thành "serviceAccountKey.json", để cùng chỗ với file script này.\n')
  process.exit(1)
}

const app = initializeApp({ credential: cert(serviceAccount), projectId: 'qltt-tlm' })
const db = getFirestore(app)
const auth = getAuth(app)
const T = Timestamp

// ---------------------------------------------------------------------------
// Cấu hình chung
// ---------------------------------------------------------------------------
const DEMO_PASSWORD = 'Demo@2026'
const TODAY = new Date('2026-09-28T12:00:00+07:00')

function dstr(d: Date) {
  return d.toISOString().slice(0, 10)
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function addMonths(d: Date, n: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}
// Mọi ngày trong [from, to] (bao gồm 2 đầu) trùng 1 trong 2 thứ trong tuần cho trước.
function sessionDatesInRange(from: Date, to: Date, weekdays: number[]) {
  const out: Date[] = []
  let cur = new Date(from)
  while (cur <= to) {
    if (weekdays.includes(cur.getDay())) out.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return out
}
function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)]
}
// RNG có seed cố định để chạy lại nhiều lần vẫn ra cùng 1 bộ dữ liệu (dễ đối chiếu).
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.
      imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(42)

const MONTH_START: Record<string, Date> = {
  '2026-07': new Date('2026-07-01T00:00:00+07:00'),
  '2026-08': new Date('2026-08-01T00:00:00+07:00'),
  '2026-09': new Date('2026-09-01T00:00:00+07:00'),
}
const MONTH_END: Record<string, Date> = {
  '2026-07': new Date('2026-07-31T23:59:59+07:00'),
  '2026-08': new Date('2026-08-31T23:59:59+07:00'),
  '2026-09': TODAY, // tháng 9 chưa hết (hôm nay 28/9)
}

// ---------------------------------------------------------------------------
// 1. Tổ chức + 3 cơ sở
// ---------------------------------------------------------------------------
const orgId = db.collection('organizations').doc().id
const ORG_NAME = 'Trung Tâm Toán Học Thành Đạt'

const CENTERS = [
  { key: 'linhxuan', id: db.collection('centers').doc().id, name: 'Cơ sở Linh Xuân', address: '123 Kha Vạn Cân, TP. Thủ Đức', level: 'thcs' },
  { key: 'pbc', id: db.collection('centers').doc().id, name: 'Cơ sở Phan Bội Châu', address: '45 Phan Bội Châu, Q. Bình Thạnh', level: 'thpt' },
  { key: 'thuanan', id: db.collection('centers').doc().id, name: 'Cơ sở Thuận An', address: '78 Nguyễn Trãi, TP. Thuận An', level: 'thpt' },
] as const

// ---------------------------------------------------------------------------
// 2. Giáo viên / Trợ giảng (10 GV + 3 TG) theo từng cơ sở
// ---------------------------------------------------------------------------
type StaffDef = { key: string; name: string; role: 'teacher' | 'ta'; center: (typeof CENTERS)[number]['key'] }
const STAFF: StaffDef[] = [
  { key: 'gv_huong', name: 'Nguyễn Thị Hương', role: 'teacher', center: 'linhxuan' },
  { key: 'gv_long', name: 'Trần Văn Long', role: 'teacher', center: 'linhxuan' },
  { key: 'gv_mai', name: 'Lê Thị Mai', role: 'teacher', center: 'linhxuan' },
  { key: 'gv_duc', name: 'Phạm Văn Đức', role: 'teacher', center: 'linhxuan' },
  { key: 'tg_nga', name: 'Hoàng Thị Nga', role: 'ta', center: 'linhxuan' },

  { key: 'gv_thanh', name: 'Vũ Thị Thanh', role: 'teacher', center: 'pbc' },
  { key: 'gv_hung', name: 'Đặng Văn Hùng', role: 'teacher', center: 'pbc' },
  { key: 'gv_lan', name: 'Bùi Thị Lan', role: 'teacher', center: 'pbc' },
  { key: 'tg_tai', name: 'Ngô Văn Tài', role: 'ta', center: 'pbc' },

  { key: 'gv_ha', name: 'Trịnh Thị Hà', role: 'teacher', center: 'thuanan' },
  { key: 'gv_nam', name: 'Đỗ Văn Nam', role: 'teacher', center: 'thuanan' },
  { key: 'gv_thu', name: 'Lý Thị Thu', role: 'teacher', center: 'thuanan' },
  { key: 'tg_khoa', name: 'Phan Văn Khoa', role: 'ta', center: 'thuanan' },
]

// ---------------------------------------------------------------------------
// 3. Lớp học (20 lớp) — mỗi lớp 2 buổi/tuần, đã xếp giờ không trùng cho từng GV
// ---------------------------------------------------------------------------
type ClassDef = {
  key: string; name: string; subject: string; center: (typeof CENTERS)[number]['key']
  teacherKey: string; taKey?: string; weekdays: [number, number]
  start: string; end: string; room: string
}
const CLASSES: ClassDef[] = [
  // Linh Xuân (THCS)
  { key: 'lx_t6a', name: 'Toán 6A', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_huong', taKey: 'tg_nga', weekdays: [1, 4], start: '19:00', end: '20:30', room: 'P101' },
  { key: 'lx_t6b', name: 'Toán 6B', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_huong', taKey: 'tg_nga', weekdays: [2, 5], start: '19:00', end: '20:30', room: 'P101' },
  { key: 'lx_t7a', name: 'Toán 7A', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_long', taKey: 'tg_nga', weekdays: [1, 4], start: '17:30', end: '19:00', room: 'P102' },
  { key: 'lx_t7b', name: 'Toán 7B', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_long', taKey: 'tg_nga', weekdays: [2, 5], start: '17:30', end: '19:00', room: 'P102' },
  { key: 'lx_t8a', name: 'Toán 8A', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_mai', weekdays: [1, 4], start: '19:00', end: '20:30', room: 'P103' },
  { key: 'lx_t8b', name: 'Toán 8B', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_mai', weekdays: [3, 6], start: '19:00', end: '20:30', room: 'P103' },
  { key: 'lx_t9a', name: 'Toán 9A', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_duc', weekdays: [2, 5], start: '17:30', end: '19:00', room: 'P104' },
  { key: 'lx_t9b', name: 'Toán 9B', subject: 'Toán', center: 'linhxuan', teacherKey: 'gv_duc', weekdays: [3, 6], start: '17:30', end: '19:00', room: 'P104' },

  // Phan Bội Châu (THPT)
  { key: 'pbc_t10a', name: 'Toán 10A', subject: 'Toán', center: 'pbc', teacherKey: 'gv_thanh', taKey: 'tg_tai', weekdays: [1, 3], start: '19:00', end: '20:30', room: 'P201' },
  { key: 'pbc_t10b', name: 'Toán 10B', subject: 'Toán', center: 'pbc', teacherKey: 'gv_thanh', taKey: 'tg_tai', weekdays: [2, 4], start: '19:00', end: '20:30', room: 'P201' },
  { key: 'pbc_t11a', name: 'Toán 11A', subject: 'Toán', center: 'pbc', teacherKey: 'gv_hung', taKey: 'tg_tai', weekdays: [1, 3], start: '17:30', end: '19:00', room: 'P202' },
  { key: 'pbc_t11b', name: 'Toán 11B', subject: 'Toán', center: 'pbc', teacherKey: 'gv_hung', taKey: 'tg_tai', weekdays: [2, 4], start: '17:30', end: '19:00', room: 'P202' },
  { key: 'pbc_t12a', name: 'Toán 12A', subject: 'Toán', center: 'pbc', teacherKey: 'gv_lan', weekdays: [1, 3], start: '20:30', end: '22:00', room: 'P203' },
  { key: 'pbc_t12b', name: 'Toán 12B', subject: 'Toán', center: 'pbc', teacherKey: 'gv_lan', weekdays: [2, 4], start: '20:30', end: '22:00', room: 'P203' },

  // Thuận An (THPT)
  { key: 'ta_t10a', name: 'Toán 10A', subject: 'Toán', center: 'thuanan', teacherKey: 'gv_ha', taKey: 'tg_khoa', weekdays: [1, 3], start: '19:00', end: '20:30', room: 'P301' },
  { key: 'ta_t10b', name: 'Toán 10B', subject: 'Toán', center: 'thuanan', teacherKey: 'gv_ha', taKey: 'tg_khoa', weekdays: [2, 4], start: '19:00', end: '20:30', room: 'P301' },
  { key: 'ta_t11a', name: 'Toán 11A', subject: 'Toán', center: 'thuanan', teacherKey: 'gv_nam', taKey: 'tg_khoa', weekdays: [1, 3], start: '17:30', end: '19:00', room: 'P302' },
  { key: 'ta_t11b', name: 'Toán 11B', subject: 'Toán', center: 'thuanan', teacherKey: 'gv_nam', taKey: 'tg_khoa', weekdays: [2, 4], start: '17:30', end: '19:00', room: 'P302' },
  { key: 'ta_t12a', name: 'Toán 12A', subject: 'Toán', center: 'thuanan', teacherKey: 'gv_thu', weekdays: [1, 3], start: '20:30', end: '22:00', room: 'P303' },
  { key: 'ta_t12b', name: 'Toán 12B', subject: 'Toán', center: 'thuanan', teacherKey: 'gv_thu', weekdays: [2, 4], start: '20:30', end: '22:00', room: 'P303' },
]

// ---------------------------------------------------------------------------
// 4. Học sinh — 3 đợt (tháng 7 / 8 / 9), có nghỉ học theo đúng số thầy cho
// ---------------------------------------------------------------------------
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý']
const MIDDLE = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Ngọc', 'Thành', 'Gia', 'Anh', 'Bảo']
const FIRST = ['An', 'Bình', 'Chi', 'Dũng', 'Em', 'Phúc', 'Giang', 'Hà', 'Khánh', 'Linh', 'Minh', 'Nam', 'Oanh', 'Phương', 'Quân', 'Sơn', 'Thảo', 'Uyên', 'Việt', 'Xuân', 'Yến', 'Kiệt', 'Hân', 'Long', 'My']
function randomName() {
  return `${pick(LAST_NAMES, rnd)} ${pick(MIDDLE, rnd)} ${pick(FIRST, rnd)}`
}
function randomPhone() {
  return '09' + Array.from({ length: 8 }, () => Math.floor(rnd() * 10)).join('')
}

type Cohort = { month: string; count: number; centerShare: Record<string, number> }
const COHORTS: Cohort[] = [
  { month: '2026-07', count: 200, centerShare: { linhxuan: 0.4, pbc: 0.3, thuanan: 0.3 } },
  { month: '2026-08', count: 160, centerShare: { linhxuan: 0.4, pbc: 0.3, thuanan: 0.3 } },
  { month: '2026-09', count: 200, centerShare: { linhxuan: 0.4, pbc: 0.3, thuanan: 0.3 } },
]

interface StudentPlan {
  id: string
  fullName: string
  phone: string
  parentPhone: string
  centerKey: string
  classKey: string
  joinMonth: string
  leaveAfterMonth: string | null // null = vẫn đang học tới hôm nay
}

const students: StudentPlan[] = []
const classesByCenter: Record<string, ClassDef[]> = {}
for (const c of CLASSES) {
  ;(classesByCenter[c.center] ??= []).push(c)
}
const roundRobinIdx: Record<string, number> = {}

for (const cohort of COHORTS) {
  for (const [centerKey, share] of Object.entries(cohort.centerShare)) {
    const n = Math.round(cohort.count * share)
    for (let i = 0; i < n; i++) {
      const classesHere = classesByCenter[centerKey]
      const idx = (roundRobinIdx[centerKey] ??= 0)
      const cls = classesHere[idx % classesHere.length]
      roundRobinIdx[centerKey] = idx + 1
      students.push({
        id: db.collection('students').doc().id,
        fullName: randomName(),
        phone: rnd() < 0.3 ? randomPhone() : '',
        parentPhone: randomPhone(),
        centerKey,
        classKey: cls.key,
        joinMonth: cohort.month,
        leaveAfterMonth: null,
      })
    }
  }
}

// Nghỉ học: 10 em sau tháng 7 (không tiếp tục tháng 8), 50 em "cũ" sau tháng 8
// (không tiếp tục tháng 9) — chọn ngẫu nhiên có seed cố định trong đúng nhóm liên quan.
const julyStudents = students.filter((s) => s.joinMonth === '2026-07')
const leaversAfterJuly = new Set<string>()
{
  const shuffled = [...julyStudents].sort(() => rnd() - 0.5)
  for (const s of shuffled.slice(0, 10)) leaversAfterJuly.add(s.id)
}
for (const s of students) if (leaversAfterJuly.has(s.id)) s.leaveAfterMonth = '2026-07'

const activeAsOfAugust = students.filter(
  (s) => (s.joinMonth === '2026-07' || s.joinMonth === '2026-08') && s.leaveAfterMonth === null,
)
const leaversAfterAugust = new Set<string>()
{
  const shuffled = [...activeAsOfAugust].sort(() => rnd() - 0.5)
  for (const s of shuffled.slice(0, 50)) leaversAfterAugust.add(s.id)
}
for (const s of students) if (leaversAfterAugust.has(s.id)) s.leaveAfterMonth = '2026-08'

console.log(`Tổng học sinh tạo ra: ${students.length}`)
console.log(`  - Nghỉ sau tháng 7: ${leaversAfterJuly.size}`)
console.log(`  - Nghỉ sau tháng 8 (học sinh cũ): ${leaversAfterAugust.size}`)
const activeToday = students.filter(
  (s) => s.leaveAfterMonth === null || (s.leaveAfterMonth === '2026-09' && false),
).length
console.log(`  - Đang học tính tới 28/9: ${activeToday} (mục tiêu: 500)`)

// ---------------------------------------------------------------------------
// Batch writer tiện dụng — tự chia lô ≤ 450 ghi/lô
// ---------------------------------------------------------------------------
let batch = db.batch()
let opsInBatch = 0
let totalWrites = 0
const commits: Promise<unknown>[] = []
function w(ref: DocumentReference, data: DocumentData) {
  batch.set(ref, data)
  opsInBatch++
  totalWrites++
  if (opsInBatch >= 450) {
    commits.push(batch.commit())
    batch = db.batch()
    opsInBatch = 0
  }
}
async function flush() {
  if (opsInBatch > 0) commits.push(batch.commit())
  await Promise.all(commits)
}

async function main() {
  // ---- Tài khoản đăng nhập ----
  const ownerEmail = 'chutrungtam@toanthanhdat.demo'
  let ownerUid: string
  try {
    ownerUid = (await auth.createUser({ email: ownerEmail, password: DEMO_PASSWORD, displayName: 'Chủ Trung Tâm (Demo)' })).uid
  } catch {
    ownerUid = (await auth.getUserByEmail(ownerEmail)).uid
  }

  const staffUid: Record<string, string> = {}
  for (const s of STAFF) {
    const email = `${s.key}@toanthanhdat.demo`
    try {
      staffUid[s.key] = (await auth.createUser({ email, password: DEMO_PASSWORD, displayName: s.name })).uid
    } catch {
      staffUid[s.key] = (await auth.getUserByEmail(email)).uid
    }
  }

  // ---- organizations/{orgId} ----
  w(db.doc(`organizations/${orgId}`), {
    name: ORG_NAME,
    ownerId: ownerUid,
    status: 'active', // demo đã "kích hoạt" sẵn, không hiện banner dùng thử
    createdAt: T.fromDate(new Date('2026-07-01T08:00:00+07:00')),
  })

  // ---- users/{ownerUid} ----
  w(db.doc(`users/${ownerUid}`), {
    id: ownerUid, orgId, email: ownerEmail, displayName: 'Chủ Trung Tâm (Demo)',
    role: 'owner', centerIds: CENTERS.map((c) => c.id), createdAt: T.fromDate(new Date('2026-07-01T08:00:00+07:00')),
  })

  // ---- centers ----
  for (const c of CENTERS) {
    w(db.doc(`centers/${c.id}`), {
      orgId, name: c.name, address: c.address, createdAt: T.fromDate(new Date('2026-07-01T08:05:00+07:00')),
    })
  }
  const centerIdByKey = Object.fromEntries(CENTERS.map((c) => [c.key, c.id]))

  // ---- users cho GV/TG ----
  for (const s of STAFF) {
    w(db.doc(`users/${staffUid[s.key]}`), {
      id: staffUid[s.key], orgId, email: `${s.key}@toanthanhdat.demo`, displayName: s.name,
      role: s.role, centerIds: [centerIdByKey[s.center]], createdAt: T.fromDate(new Date('2026-07-01T08:10:00+07:00')),
    })
  }

  // ---- classes + classSessions ----
  const classIdByKey: Record<string, string> = {}
  const sessionDatesByClassKey: Record<string, Date[]> = {}
  for (const cls of CLASSES) {
    const classId = db.collection('classes').doc().id
    classIdByKey[cls.key] = classId
    w(db.doc(`classes/${classId}`), {
      orgId, centerId: centerIdByKey[cls.center], name: cls.name, subject: cls.subject,
      teacherId: staffUid[cls.teacherKey], taIds: cls.taKey ? [staffUid[cls.taKey]] : [],
      schedule: [
        { weekday: cls.weekdays[0], startTime: cls.start, endTime: cls.end },
        { weekday: cls.weekdays[1], startTime: cls.start, endTime: cls.end },
      ],
      room: cls.room, active: true, createdAt: T.fromDate(new Date('2026-07-01T08:15:00+07:00')),
    })

    const dates = sessionDatesInRange(new Date('2026-07-01T00:00:00+07:00'), TODAY, cls.weekdays)
    sessionDatesByClassKey[cls.key] = dates
    for (const d of dates) {
      const sid = `${classId}_${dstr(d)}`
      w(db.doc(`classSessions/${sid}`), {
        orgId, centerId: centerIdByKey[cls.center], classId, date: dstr(d),
        startTime: cls.start, endTime: cls.end, status: 'done',
        createdAt: T.fromDate(d),
      })
    }
  }

  // ---- students + enrollments + attendance + payments ----
  for (const s of students) {
    w(db.doc(`students/${s.id}`), {
      orgId, centerId: centerIdByKey[s.centerKey], fullName: s.fullName, phone: s.phone,
      parentPhone: s.parentPhone, active: s.leaveAfterMonth === null,
      createdAt: T.fromDate(MONTH_START[s.joinMonth]),
    })

    const cls = CLASSES.find((c) => c.key === s.classKey)!
    const classId = classIdByKey[s.classKey]
    const allMonths = ['2026-07', '2026-08', '2026-09']
    const joinIdx = allMonths.indexOf(s.joinMonth)
    const leaveIdx = s.leaveAfterMonth ? allMonths.indexOf(s.leaveAfterMonth) : allMonths.length - 1
    const activeMonths = allMonths.slice(joinIdx, leaveIdx + 1)

    for (const month of activeMonths) {
      const monthStart = MONTH_START[month]
      const monthEnd = MONTH_END[month]
      const sessionsThisMonth = sessionDatesByClassKey[s.classKey].filter((d) => d >= monthStart && d <= monthEnd)
      if (sessionsThisMonth.length === 0) continue

      const enrollmentId = db.collection('enrollments').doc().id
      const purchasedAt = sessionsThisMonth[0]
      const expiresAt = addMonths(purchasedAt, 1)

      // Trạng thái điểm danh: đa số Có mặt, ít Vắng có phép/không phép cho tự nhiên.
      let usedSessions = 0
      for (const d of sessionsThisMonth) {
        const r = rnd()
        const status = r < 0.85 ? 'present' : r < 0.93 ? 'excused_absence' : 'unexcused_absence'
        const deducts = status !== 'excused_absence'
        if (deducts) usedSessions++
        const attId = `${classId}_${dstr(d)}_${s.id}`
        w(db.doc(`attendance/${attId}`), {
          orgId, sessionId: `${classId}_${dstr(d)}`, classId, centerId: centerIdByKey[s.centerKey],
          studentId: s.id, status, creditApplied: deducts,
          ...(deducts ? { enrollmentId } : {}),
          recordedBy: staffUid[cls.teacherKey], recordedAt: T.fromDate(addDays(d, 0)),
        })
      }

      const totalSessions = sessionsThisMonth.length
      const remainingSessions = totalSessions - usedSessions
      const isCurrentMonth = month === '2026-09'
      w(db.doc(`enrollments/${enrollmentId}`), {
        orgId, centerId: centerIdByKey[s.centerKey], studentId: s.id, classId,
        totalSessions, usedSessions, remainingSessions,
        totalPrice: 500000, active: isCurrentMonth || remainingSessions > 0,
        purchasedAt: T.fromDate(purchasedAt), expiresAt: T.fromDate(expiresAt),
      })

      // Thanh toán: tháng đã qua đa số đã đóng đủ; tháng 9 (đang diễn ra) nhiều em
      // chưa đóng hết — đúng thực tế và giúp Báo cáo có công nợ để demo.
      const payRoll = rnd()
      const paidFull = isCurrentMonth ? payRoll < 0.55 : payRoll < 0.88
      const paidPartial = !paidFull && (isCurrentMonth ? payRoll < 0.8 : payRoll < 0.97)
      if (paidFull || paidPartial) {
        const amount = paidFull ? 500000 : Math.round((150000 + rnd() * 250000) / 10000) * 10000
        w(db.collection('payments').doc(), {
          orgId, centerId: centerIdByKey[s.centerKey], studentId: s.id,
          amount, method: rnd() < 0.55 ? 'cash' : 'bank_transfer', note: '',
          recordedAt: T.fromDate(addDays(purchasedAt, 1 + Math.floor(rnd() * 5))),
          recordedBy: ownerUid,
        })
      }
    }
  }

  await flush()
  console.log(`\n✅ Hoàn tất — tổng cộng ${totalWrites} lượt ghi vào Firestore.`)
  console.log('\n================= THÔNG TIN ĐĂNG NHẬP DEMO =================')
  console.log(`Trung tâm: ${ORG_NAME}`)
  console.log(`Chủ trung tâm — email: ${ownerEmail}  |  mật khẩu: ${DEMO_PASSWORD}`)
  console.log('==============================================================\n')
}

main().catch((err) => {
  console.error('\n❌ Lỗi khi chạy script:', err)
  process.exit(1)
})

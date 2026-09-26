import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { applyAttendanceCredit } from './creditDeduction'

// These tests talk to the Firestore emulator (FIRESTORE_EMULATOR_HOST must be set,
// e.g. by running `firebase emulators:exec --only firestore "npm test"` from functions/).
let app: App
let db: Firestore

beforeAll(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST is not set — run these tests via the Firestore emulator (see functions/package.json "test" script).',
    )
  }
  app = initializeApp({ projectId: 'qltt-test' }, `test-${randomUUID()}`)
  db = getFirestore(app)
})

afterAll(async () => {
  await deleteApp(app)
})

function futureTimestamp(daysFromNow: number) {
  return Timestamp.fromMillis(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
}

async function seedEnrollment(
  studentId: string,
  classId: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const ref = db.collection('enrollments').doc()
  await ref.set({
    studentId,
    classId,
    centerId: 'center-1',
    packageType: 'session_pack',
    totalSessions: 5,
    usedSessions: 0,
    remainingSessions: 5,
    pricePerSession: 150000,
    totalPrice: 750000,
    purchasedAt: Timestamp.fromMillis(Date.now() - 1000),
    expiresAt: futureTimestamp(30),
    active: true,
    ...overrides,
  })
  return ref
}

/** Each test uses its own student/class pair so enrollment queries never see another test's data. */
function freshIds() {
  const suffix = randomUUID()
  return { studentId: `student-${suffix}`, classId: `class-${suffix}` }
}

describe('applyAttendanceCredit', () => {
  it('deducts one session and writes a ledger entry on "present"', async () => {
    const { studentId, classId } = freshIds()
    const enrollmentRef = await seedEnrollment(studentId, classId)
    const attendanceRef = db.collection('attendance').doc()
    const attendanceId = attendanceRef.id

    await applyAttendanceCredit(db, attendanceRef, attendanceId, {
      studentId,
      classId,
      centerId: 'center-1',
      status: 'present',
    })

    const enrollmentAfter = (await enrollmentRef.get()).data()!
    expect(enrollmentAfter.usedSessions).toBe(1)
    expect(enrollmentAfter.remainingSessions).toBe(4)
    expect(enrollmentAfter.active).toBe(true)

    const attendanceAfter = (await attendanceRef.get()).data()!
    expect(attendanceAfter.creditApplied).toBe(true)
    expect(attendanceAfter.enrollmentId).toBe(enrollmentRef.id)

    const ledger = await db.collection('creditLedger').where('sessionId', '==', attendanceId).get()
    expect(ledger.size).toBe(1)
    expect(ledger.docs[0].data().delta).toBe(-1)
    expect(ledger.docs[0].data().reason).toBe('attendance_present')
  })

  it('deducts on "unexcused_absence" and "makeup" too', async () => {
    for (const status of ['unexcused_absence', 'makeup']) {
      const { studentId, classId } = freshIds()
      const enrollmentRef = await seedEnrollment(studentId, classId)
      const attendanceRef = db.collection('attendance').doc()
      await applyAttendanceCredit(db, attendanceRef, attendanceRef.id, {
        studentId,
        classId,
        centerId: 'center-1',
        status,
      })
      const enrollmentAfter = (await enrollmentRef.get()).data()!
      expect(enrollmentAfter.usedSessions).toBe(1)
    }
  })

  it('does not deduct on "excused_absence" and flags creditApplied false', async () => {
    const { studentId, classId } = freshIds()
    const enrollmentRef = await seedEnrollment(studentId, classId)
    const attendanceRef = db.collection('attendance').doc()

    await applyAttendanceCredit(db, attendanceRef, attendanceRef.id, {
      studentId,
      classId,
      centerId: 'center-1',
      status: 'excused_absence',
    })

    const enrollmentAfter = (await enrollmentRef.get()).data()!
    expect(enrollmentAfter.usedSessions).toBe(0)

    const attendanceAfter = (await attendanceRef.get()).data()!
    expect(attendanceAfter.creditApplied).toBe(false)
  })

  it('is idempotent when creditApplied is already true', async () => {
    const { studentId, classId } = freshIds()
    const enrollmentRef = await seedEnrollment(studentId, classId)
    const attendanceRef = db.collection('attendance').doc()

    await applyAttendanceCredit(db, attendanceRef, attendanceRef.id, {
      studentId,
      classId,
      centerId: 'center-1',
      status: 'present',
      creditApplied: true,
    })

    const enrollmentAfter = (await enrollmentRef.get()).data()!
    expect(enrollmentAfter.usedSessions).toBe(0)
  })

  it('skips expired enrollments and flags "no_active_enrollment"', async () => {
    const { studentId, classId } = freshIds()
    await seedEnrollment(studentId, classId, { expiresAt: futureTimestamp(-1) })
    const attendanceRef = db.collection('attendance').doc()

    await applyAttendanceCredit(db, attendanceRef, attendanceRef.id, {
      studentId,
      classId,
      centerId: 'center-1',
      status: 'present',
    })

    const attendanceAfter = (await attendanceRef.get()).data()!
    expect(attendanceAfter.creditApplied).toBe(false)
    expect(attendanceAfter.deductionNote).toBe('no_active_enrollment')
  })

  it('picks the oldest enrollment first (FIFO)', async () => {
    const { studentId, classId } = freshIds()
    const older = await seedEnrollment(studentId, classId, {
      purchasedAt: Timestamp.fromMillis(Date.now() - 100000),
    })
    await seedEnrollment(studentId, classId, { purchasedAt: Timestamp.fromMillis(Date.now() - 1000) })

    const attendanceRef = db.collection('attendance').doc()
    await applyAttendanceCredit(db, attendanceRef, attendanceRef.id, {
      studentId,
      classId,
      centerId: 'center-1',
      status: 'present',
    })

    const attendanceAfter = (await attendanceRef.get()).data()!
    expect(attendanceAfter.enrollmentId).toBe(older.id)
  })
})

import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions/v2'

/** Attendance statuses that consume one session credit. */
const DEDUCTING_STATUSES = new Set(['present', 'unexcused_absence', 'makeup'])

/**
 * Fires whenever a class/TA/teacher records attendance. Picks the oldest active,
 * non-expired enrollment for that student+class with remaining credit (FIFO),
 * deducts one session inside a transaction, and writes an immutable credit-ledger
 * entry. Runs with admin privileges because Firestore rules reserve direct writes
 * to `enrollments` for owner/manager — TA/teacher must go through this function.
 */
export const onAttendanceCreated = onDocumentCreated(
  'attendance/{attendanceId}',
  async (event) => {
    const snap = event.data
    if (!snap) return

    const attendance = snap.data() as {
      studentId: string
      classId: string
      centerId: string
      status: string
      creditApplied?: boolean
    }

    if (attendance.creditApplied) return // already processed (idempotency guard)
    if (!DEDUCTING_STATUSES.has(attendance.status)) {
      await snap.ref.update({ creditApplied: false })
      return
    }

    const db = getFirestore()
    const attendanceRef = snap.ref

    const candidatesSnap = await db
      .collection('enrollments')
      .where('studentId', '==', attendance.studentId)
      .where('classId', '==', attendance.classId)
      .where('active', '==', true)
      .orderBy('purchasedAt', 'asc')
      .get()

    const now = Timestamp.now()
    const candidate = candidatesSnap.docs.find((doc) => {
      const d = doc.data()
      return d.usedSessions < d.totalSessions && d.expiresAt.toMillis() > now.toMillis()
    })

    if (!candidate) {
      logger.warn('No active enrollment with remaining credit', {
        studentId: attendance.studentId,
        classId: attendance.classId,
      })
      await attendanceRef.update({ creditApplied: false, deductionNote: 'no_active_enrollment' })
      return
    }

    const enrollmentRef = candidate.ref

    await db.runTransaction(async (tx) => {
      const enrollmentDoc = await tx.get(enrollmentRef)
      const data = enrollmentDoc.data()
      if (!data) throw new Error('Enrollment disappeared')

      // Re-check inside the transaction in case a concurrent attendance already consumed it.
      if (data.usedSessions >= data.totalSessions) {
        throw new Error('ENROLLMENT_EXHAUSTED')
      }

      const usedSessions = data.usedSessions + 1
      const remainingSessions = data.totalSessions - usedSessions

      tx.update(enrollmentRef, {
        usedSessions,
        remainingSessions,
        active: remainingSessions > 0,
      })

      const ledgerRef = db.collection('creditLedger').doc()
      tx.set(ledgerRef, {
        enrollmentId: enrollmentRef.id,
        studentId: attendance.studentId,
        classId: attendance.classId,
        delta: -1,
        reason: `attendance_${attendance.status === 'unexcused_absence' ? 'unexcused' : 'present'}`,
        sessionId: event.params.attendanceId,
        createdAt: now,
        createdBy: 'system:onAttendanceCreated',
      })

      tx.update(attendanceRef, {
        creditApplied: true,
        enrollmentId: enrollmentRef.id,
      })
    }).catch(async (err) => {
      if (err instanceof Error && err.message === 'ENROLLMENT_EXHAUSTED') {
        // Retry is not attempted here to keep the function simple for MVP; the record is
        // flagged so staff can resolve it manually (e.g. sell the student a new package).
        await attendanceRef.update({ creditApplied: false, deductionNote: 'enrollment_exhausted' })
        return
      }
      throw err
    })
  },
)

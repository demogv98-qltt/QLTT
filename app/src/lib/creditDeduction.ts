import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'

/** Attendance statuses that consume one session credit. */
export const DEDUCTING_STATUSES = new Set(['present', 'unexcused_absence', 'makeup'])

export interface AttendanceCreditInput {
  studentId: string
  classId: string
  centerId: string
  status: string
}

/**
 * Runs the same FIFO credit-deduction logic that used to live in a Cloud Function
 * (functions/src/creditDeduction.ts, removed to keep the Firebase project on the free
 * Spark plan — Cloud Functions requires the paid Blaze plan). Called directly from
 * AttendancePage right after the attendance doc is written.
 *
 * Firestore transactions can't run queries, only re-`get()` known document refs, so this
 * queries candidate enrollments first (ordered oldest-purchased-first), then re-verifies
 * and writes each candidate inside its own transaction — retrying the next-oldest one if a
 * concurrent write already exhausted it.
 */
export async function applyAttendanceCredit(
  db: Firestore,
  attendanceRef: DocumentReference,
  attendanceId: string,
  data: AttendanceCreditInput,
): Promise<void> {
  if (!DEDUCTING_STATUSES.has(data.status)) {
    await updateDoc(attendanceRef, { creditApplied: false })
    return
  }

  const candidatesSnap = await getDocs(
    query(
      collection(db, 'enrollments'),
      // centerId must be in the filter — firestore.rules checks resource.data.centerId, and a
      // list query is only provably safe when every field the rule reads is also constrained
      // by the query itself.
      where('centerId', '==', data.centerId),
      where('studentId', '==', data.studentId),
      where('classId', '==', data.classId),
      where('active', '==', true),
      orderBy('purchasedAt', 'asc'),
    ),
  )

  const now = Date.now()
  const candidates = candidatesSnap.docs.filter((d) => {
    const e = d.data()
    return e.usedSessions < e.totalSessions && e.expiresAt.toMillis() > now
  })

  for (const candidate of candidates) {
    const enrollmentRef = candidate.ref
    try {
      await runTransaction(db, async (tx) => {
        const enrollmentSnap = await tx.get(enrollmentRef)
        const e = enrollmentSnap.data()
        if (!e) throw new Error('ENROLLMENT_GONE')
        // Re-check inside the transaction in case a concurrent attendance already consumed it.
        if (e.usedSessions >= e.totalSessions) throw new Error('ENROLLMENT_EXHAUSTED')

        const usedSessions = e.usedSessions + 1
        const remainingSessions = e.totalSessions - usedSessions

        tx.update(enrollmentRef, {
          usedSessions,
          remainingSessions,
          active: remainingSessions > 0,
        })

        tx.set(doc(collection(db, 'creditLedger')), {
          enrollmentId: enrollmentRef.id,
          studentId: data.studentId,
          classId: data.classId,
          delta: -1,
          reason: `attendance_${data.status === 'unexcused_absence' ? 'unexcused' : 'present'}`,
          sessionId: attendanceId,
          createdAt: serverTimestamp(),
          createdBy: 'client',
        })

        tx.update(attendanceRef, {
          creditApplied: true,
          enrollmentId: enrollmentRef.id,
        })
      })
      return // success
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'ENROLLMENT_EXHAUSTED' || message === 'ENROLLMENT_GONE') {
        continue // try the next-oldest candidate
      }
      throw err
    }
  }

  // No candidate had remaining credit — flag it so staff can resolve manually.
  await updateDoc(attendanceRef, { creditApplied: false, deductionNote: 'no_active_enrollment' })
}

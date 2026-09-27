import {
  collection,
  doc,
  getDoc,
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
  orgId: string
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
      // orgId/centerId must be in the filter — firestore.rules checks resource.data's orgId
      // and centerId, and a list query is only provably safe when every field the rule reads
      // is also constrained by the query itself.
      where('orgId', '==', data.orgId),
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
        // Reads must precede writes in a Firestore transaction — which is what makes this
        // check a real idempotency lock rather than just an informational flag. If this
        // function is ever called twice for the same attendance doc (e.g. a double-clicked
        // "Có mặt" button firing two overlapping calls), both transactions read this doc
        // before either commits; Firestore detects the conflicting commit and silently
        // re-runs the loser's callback, which then sees creditApplied already true here and
        // aborts instead of deducting a second session.
        const attendanceSnap = await tx.get(attendanceRef)
        if (attendanceSnap.data()?.creditApplied) throw new Error('ALREADY_APPLIED')

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
          orgId: data.orgId,
          centerId: data.centerId,
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
      // Another concurrent call already applied credit for this attendance doc — done,
      // nothing left to do (and nothing to flag; the winning call already set the fields).
      if (message === 'ALREADY_APPLIED') return
      if (message === 'ENROLLMENT_EXHAUSTED' || message === 'ENROLLMENT_GONE') {
        continue // try the next-oldest candidate
      }
      // A losing transaction in a genuine race can also fail commit itself (Firestore
      // detects two transactions both touched the same doc and rejects the second one's
      // write outright, rather than transparently retrying it) instead of surfacing as our
      // own ALREADY_APPLIED throw above. Rather than assume every unrecognized error is a
      // real failure, check whether the credit was in fact already applied by the winner —
      // if so this is that same benign race, not a bug, so don't surface an error for it.
      const recheck = await getDoc(attendanceRef)
      if (recheck.data()?.creditApplied) return
      throw err
    }
  }

  // No candidate had remaining credit — flag it so staff can resolve manually.
  await updateDoc(attendanceRef, { creditApplied: false, deductionNote: 'no_active_enrollment' })
}

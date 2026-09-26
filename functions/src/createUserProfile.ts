import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as functionsV1 from 'firebase-functions/v1'

/**
 * Runs after a new Firebase Auth account is created. Seeds the matching
 * `users/{uid}` profile doc with a safe default role ("parent" = least privilege).
 * Owner/manager must explicitly promote staff accounts afterwards (Firestore rules
 * only let owner/manager change `role`/`centerIds`).
 *
 * Uses the v1 auth trigger (not the v2 blocking `beforeUserCreated`) because that
 * one requires upgrading the project to Google Cloud Identity Platform, which is
 * unnecessary for this MVP and doesn't run in the plain Auth emulator.
 */
export const seedUserProfile = functionsV1.auth.user().onCreate(async (user) => {
  const db = getFirestore()
  const ref = db.collection('users').doc(user.uid)

  // Bootstrap: the very first account to ever sign up becomes the owner, since there is
  // nobody else yet who could promote them. Every account after that defaults to "parent"
  // (least privilege) and must be explicitly promoted by an owner/manager.
  const existingOwner = await db.collection('users').where('role', '==', 'owner').limit(1).get()
  const role = existingOwner.empty ? 'owner' : 'parent'

  // The client's signUp flow (see authStore.ts) writes its own merge of `displayName` right
  // after this trigger fires, and the two can land in either order — including interleaved
  // as read-here / write-there / write-here, which a plain get()-then-set() would lose. Doing
  // it as a transaction means Firestore re-runs this block if the client's write lands
  // in between our read and our commit, so whichever write is actually last wins the field,
  // and the profile always ends up with the name the person typed rather than an email
  // fallback.
  await db.runTransaction(async (tx) => {
    const existing = (await tx.get(ref)).data()
    tx.set(
      ref,
      {
        id: user.uid,
        email: user.email ?? '',
        displayName: existing?.displayName ?? user.displayName ?? user.email ?? 'Người dùng mới',
        role,
        centerIds: existing?.centerIds ?? [],
        studentIds: existing?.studentIds ?? [],
        createdAt: existing?.createdAt ?? Timestamp.now(),
      },
      { merge: true },
    )
  })
})

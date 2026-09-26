import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { collection, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { create } from 'zustand'
import { auth, db } from '../lib/firebase'
import type { AppUser } from '../types'

/** Either create a brand-new organization (this account becomes its owner) or join an
 * existing one by its orgId (always as 'parent' — staff roles are granted afterwards by
 * that org's own owner/manager, from the Nhân sự page). */
export type SignUpOrg = { mode: 'create'; orgName: string } | { mode: 'join'; orgId: string }

interface AuthState {
  firebaseUser: User | null
  profile: AppUser | null
  /** True until the very first auth-state + profile resolution completes. */
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, org: SignUpOrg) => Promise<void>
  logout: () => Promise<void>
}

let profileUnsubscribe: (() => void) | null = null

export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, (firebaseUser) => {
    profileUnsubscribe?.()
    profileUnsubscribe = null

    if (!firebaseUser) {
      set({ firebaseUser: null, profile: null, loading: false })
      return
    }

    set({ firebaseUser, loading: true })

    profileUnsubscribe = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        set({
          profile: snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null,
          loading: false,
        })
      },
      () => set({ profile: null, loading: false }),
    )
  })

  return {
    firebaseUser: null,
    profile: null,
    loading: true,
    error: null,
    login: async (email, password) => {
      set({ error: null })
      try {
        await signInWithEmailAndPassword(auth, email, password)
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Đăng nhập thất bại' })
        throw err
      }
    },
    signUp: async (email, password, displayName, org) => {
      set({ error: null })
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName })

        // No Cloud Function seeds users/{uid} here (this project stays on the free Spark
        // plan, which doesn't run Cloud Functions) — the client creates its own profile doc,
        // scoped to a tenant (organizations/{orgId}) since this app is sold to multiple
        // independent centers.
        const userRef = doc(db, 'users', cred.user.uid)
        if (org.mode === 'create') {
          // Creating a brand-new org and claiming 'owner' happens atomically in one
          // transaction: firestore.rules only allows the 'owner' role when this same
          // request also creates that org doc, and the org doc's own create rule means
          // each orgId can only ever be claimed once — so nobody can mint themselves a
          // second owner for an org that already has one.
          const orgId = doc(collection(db, 'organizations')).id
          const orgRef = doc(db, 'organizations', orgId)
          await runTransaction(db, async (tx) => {
            tx.set(orgRef, { name: org.orgName, ownerId: cred.user.uid, createdAt: serverTimestamp() })
            tx.set(userRef, {
              id: cred.user.uid,
              orgId,
              email: cred.user.email ?? '',
              displayName,
              role: 'owner',
              centerIds: [],
              studentIds: [],
              createdAt: serverTimestamp(),
            })
          })
        } else {
          // Joining is a single write, no transaction needed — firestore.rules requires
          // organizations/{org.orgId} to already exist for a 'parent' self-create to be
          // allowed, so a wrong code simply fails this write (caught below) rather than
          // needing a separate existence check first (which the rules for reading another
          // org don't permit before this account even has a profile).
          try {
            await setDoc(userRef, {
              id: cred.user.uid,
              orgId: org.orgId,
              email: cred.user.email ?? '',
              displayName,
              role: 'parent',
              centerIds: [],
              studentIds: [],
              createdAt: serverTimestamp(),
            })
          } catch {
            throw new Error('Mã trung tâm không đúng — kiểm tra lại với người quản lý của bạn.')
          }
        }
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Đăng ký thất bại' })
        throw err
      }
    },
    logout: async () => {
      await signOut(auth)
    },
  }
})

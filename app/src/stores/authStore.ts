import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { create } from 'zustand'
import { auth, db } from '../lib/firebase'
import type { AppUser } from '../types'

interface AuthState {
  firebaseUser: User | null
  profile: AppUser | null
  /** True until the very first auth-state + profile resolution completes. */
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
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
    signUp: async (email, password, displayName) => {
      set({ error: null })
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName })

        // No Cloud Function seeds users/{uid} here (this project stays on the free Spark
        // plan, which doesn't run Cloud Functions) — the client creates its own profile doc.
        // Bootstrap: the very first account to ever sign up becomes owner, since nobody else
        // exists yet to promote them; every account after that defaults to "parent" (least
        // privilege). This runs as a transaction that also claims meta/bootstrap in the same
        // write — firestore.rules only allows the 'owner' role when that companion doc is
        // created in the same transaction, and meta/bootstrap's own create rule permits that
        // exactly once, so this is safe even if two people signed up at the same instant
        // (Firestore retries the loser's transaction, which then sees bootstrap already
        // claimed and falls back to 'parent').
        const userRef = doc(db, 'users', cred.user.uid)
        const bootstrapRef = doc(db, 'meta', 'bootstrap')
        await runTransaction(db, async (tx) => {
          const bootstrapSnap = await tx.get(bootstrapRef)
          const isFirstUser = !bootstrapSnap.exists()
          if (isFirstUser) tx.set(bootstrapRef, { ownerClaimed: true })
          tx.set(userRef, {
            id: cred.user.uid,
            email: cred.user.email ?? '',
            displayName,
            role: isFirstUser ? 'owner' : 'parent',
            centerIds: [],
            studentIds: [],
            createdAt: serverTimestamp(),
          })
        })
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

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc, type DocumentReference } from 'firebase/firestore'
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

/**
 * Resolves once `users/{uid}` exists (created by the seedUserProfile auth trigger), or after
 * `timeoutMs` — whichever comes first. Used by signUp so the follow-up displayName write below
 * happens strictly *after* the trigger's write instead of racing it: a plain "merge whichever
 * lands last" approach isn't reliable here because the trigger runs as an Admin SDK transaction
 * and the emulator doesn't always detect that as conflicting with a concurrent client write.
 *
 * Polls with plain `getDoc` calls rather than `onSnapshot`: right after signup the page's
 * Firestore realtime stream is still being established (a fresh context has no warm
 * connection yet), which can take noticeably longer than a handful of one-shot reads.
 */
async function waitForDoc(ref: DocumentReference, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await getDoc(ref)).exists()) return
    await new Promise((r) => setTimeout(r, 150))
  }
}

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
        // The seedUserProfile Cloud Function creates users/{uid} on an auth trigger, and its
        // first write for a brand-new account can otherwise race this one. Wait for that write
        // to land first, then merge displayName in after — that ordering makes this the
        // deterministic last word instead of hoping our write happens to come later. See
        // functions/src/createUserProfile.ts for the (defensive, belt-and-suspenders) other
        // half of this fix.
        const userRef = doc(db, 'users', cred.user.uid)
        await waitForDoc(userRef, 5000)
        await setDoc(userRef, { displayName }, { merge: true })
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

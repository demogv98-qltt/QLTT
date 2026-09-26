import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
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
        // The seedUserProfile Cloud Function creates users/{uid} on an auth trigger that can
        // race this (it may run before or after updateProfile above resolves). Writing
        // displayName here too — merged, not overwritten — means whichever one lands last,
        // the profile still ends up with the name the person typed instead of an email
        // fallback. See functions/src/createUserProfile.ts for the other half of this fix.
        await setDoc(doc(db, 'users', cred.user.uid), { displayName }, { merge: true })
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

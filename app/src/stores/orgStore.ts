import { doc, onSnapshot } from 'firebase/firestore'
import { create } from 'zustand'
import { db } from '../lib/firebase'
import type { Organization } from '../types'

interface OrgState {
  organization: Organization | null
  loading: boolean
  subscribe: (orgId: string) => () => void
}

export const useOrgStore = create<OrgState>((set) => ({
  organization: null,
  loading: true,
  subscribe: (orgId) => {
    set({ loading: true })
    return onSnapshot(
      doc(db, 'organizations', orgId),
      (snap) => {
        set({
          organization: snap.exists() ? ({ id: snap.id, ...snap.data() } as Organization) : null,
          loading: false,
        })
      },
      () => set({ organization: null, loading: false }),
    )
  },
}))

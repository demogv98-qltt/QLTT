import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { create } from 'zustand'
import { db } from '../lib/firebase'
import type { Center } from '../types'

interface CenterState {
  centers: Center[]
  selectedCenterId: string | null
  loading: boolean
  subscribe: (centerIds: string[]) => () => void
  select: (centerId: string) => void
}

export const useCenterStore = create<CenterState>((set, get) => ({
  centers: [],
  selectedCenterId: localStorage.getItem('qltt_selected_center'),
  loading: true,

  subscribe: (centerIds) => {
    if (centerIds.length === 0) {
      set({ centers: [], loading: false })
      return () => {}
    }

    // Firestore `in` queries support at most 30 values; 3 centers is well within range.
    const q = query(collection(db, 'centers'), where('__name__', 'in', centerIds))
    const unsub = onSnapshot(q, (snap) => {
      const centers = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Center)
      set({ centers, loading: false })

      const current = get().selectedCenterId
      if (!current || !centers.some((c) => c.id === current)) {
        const fallback = centers[0]?.id ?? null
        set({ selectedCenterId: fallback })
        if (fallback) localStorage.setItem('qltt_selected_center', fallback)
      }
    })
    return unsub
  },

  select: (centerId) => {
    localStorage.setItem('qltt_selected_center', centerId)
    set({ selectedCenterId: centerId })
  },
}))

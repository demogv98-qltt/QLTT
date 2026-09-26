import { collection, query, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from './useCollection'
import type { AppUser } from '../types'

/** Teachers/TAs assigned to the given center (client-side filtered — small staff counts per center). */
export function useStaffOfCenter(centerId: string | null) {
  const { data, loading } = useCollection<AppUser>(
    () => query(collection(db, 'users'), where('role', 'in', ['teacher', 'ta'])),
    [],
  )

  const staff = useMemo(
    () => (centerId ? data.filter((u) => u.centerIds?.includes(centerId)) : []),
    [data, centerId],
  )

  return {
    teachers: staff.filter((u) => u.role === 'teacher'),
    tas: staff.filter((u) => u.role === 'ta'),
    loading,
  }
}

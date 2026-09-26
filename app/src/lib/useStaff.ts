import { collection, query, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { db } from '../lib/firebase'
import { useCollection } from './useCollection'
import type { AppUser } from '../types'

/** Teachers/TAs of the given org assigned to the given center (client-side filtered by
 * center — small staff counts per center). */
export function useStaffOfCenter(orgId: string | null | undefined, centerId: string | null) {
  const { data, loading } = useCollection<AppUser>(
    () =>
      orgId
        ? query(collection(db, 'users'), where('orgId', '==', orgId), where('role', 'in', ['teacher', 'ta']))
        : null,
    [orgId],
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

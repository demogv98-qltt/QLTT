import { onSnapshot, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'

/** Subscribes to a Firestore query and keeps a typed array of documents (with `id`) in sync. */
export function useCollection<T>(queryFactory: () => Query | null, deps: unknown[]) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = queryFactory()
    if (!q) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

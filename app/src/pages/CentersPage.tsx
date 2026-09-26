import { addDoc, arrayUnion, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { db } from '../lib/firebase'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'

export function CentersPage() {
  const { profile } = useAuthStore()
  const { centers, loading } = useCenterStore()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !profile) return
    setSubmitting(true)
    try {
      const centerRef = await addDoc(collection(db, 'centers'), {
        orgId: profile.orgId,
        name: name.trim(),
        address: address.trim(),
        createdAt: serverTimestamp(),
      })
      // Grant the creator (owner/manager) visibility into the new center right away —
      // otherwise it would be invisible to them until someone else adds it manually.
      await updateDoc(doc(db, 'users', profile.id), {
        centerIds: arrayUnion(centerRef.id),
      })
      setName('')
      setAddress('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Cơ sở</h2>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <input
          placeholder="Tên cơ sở"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Địa chỉ"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Thêm
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <ul className="space-y-2">
          {centers.map((c) => (
            <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-500">{c.address}</p>
            </li>
          ))}
          {centers.length === 0 && <p className="text-sm text-gray-500">Chưa có cơ sở nào.</p>}
        </ul>
      )}
    </div>
  )
}

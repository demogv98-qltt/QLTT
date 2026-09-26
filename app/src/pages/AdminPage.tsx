import { collection, doc, getDoc, orderBy, query, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { SUPER_ADMIN_EMAIL } from '../lib/superAdmin'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import type { Organization, OrgStatus } from '../types'

const STATUS_LABELS: Record<OrgStatus, string> = {
  trial: 'Dùng thử',
  active: 'Đã kích hoạt',
  suspended: 'Đã khóa',
}

const STATUS_COLORS: Record<OrgStatus, string> = {
  trial: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
}

function OwnerCell({ ownerId }: { ownerId: string }) {
  const [info, setInfo] = useState<{ displayName: string; email: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'users', ownerId)).then((snap) => {
      if (cancelled) return
      const data = snap.data()
      setInfo(data ? { displayName: data.displayName, email: data.email } : null)
    })
    return () => {
      cancelled = true
    }
  }, [ownerId])

  if (!info) return <span className="text-gray-400">—</span>
  return (
    <>
      <p className="text-gray-900">{info.displayName}</p>
      <p className="text-xs text-gray-500">{info.email}</p>
    </>
  )
}

export function AdminPage() {
  const { profile } = useAuthStore()
  const { data: orgs, loading } = useCollection<Organization>(
    () => query(collection(db, 'organizations'), orderBy('createdAt', 'desc')),
    [],
  )
  const [updating, setUpdating] = useState<string | null>(null)

  if (profile && profile.email !== SUPER_ADMIN_EMAIL) return <Navigate to="/" replace />

  async function setStatus(orgId: string, status: OrgStatus) {
    setUpdating(orgId)
    try {
      await updateDoc(doc(db, 'organizations', orgId), { status })
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="max-w-4xl">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Quản trị — Danh sách trung tâm</h2>
      <p className="mb-4 text-sm text-gray-500">
        Mọi trung tâm đăng ký trên hệ thống. Sau khi nhận thanh toán từ chủ trung tâm, bấm{' '}
        <strong>Kích hoạt</strong> để mở toàn bộ tính năng cho họ.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Trung tâm</th>
              <th className="px-3 py-2">Chủ trung tâm</th>
              <th className="px-3 py-2">Ngày đăng ký</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2 font-medium text-gray-900">{org.name}</td>
                <td className="px-3 py-2">
                  <OwnerCell ownerId={org.ownerId} />
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {org.createdAt?.toDate ? org.createdAt.toDate().toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[org.status]}`}>
                    {STATUS_LABELS[org.status]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {org.status !== 'active' && (
                      <button
                        type="button"
                        disabled={updating === org.id}
                        onClick={() => setStatus(org.id, 'active')}
                        className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Kích hoạt
                      </button>
                    )}
                    {org.status !== 'suspended' && (
                      <button
                        type="button"
                        disabled={updating === org.id}
                        onClick={() => setStatus(org.id, 'suspended')}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Khóa
                      </button>
                    )}
                    {org.status !== 'trial' && (
                      <button
                        type="button"
                        disabled={updating === org.id}
                        onClick={() => setStatus(org.id, 'trial')}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Về dùng thử
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                  Chưa có trung tâm nào đăng ký.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

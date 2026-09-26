import { collection, doc, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { ROLE_LABELS } from '../lib/roles'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import type { AppUser, Role } from '../types'

const ASSIGNABLE_ROLES: Role[] = ['manager', 'teacher', 'ta', 'parent']

export function StaffPage() {
  const { profile } = useAuthStore()
  const { data: users, loading } = useCollection<AppUser>(
    () =>
      profile ? query(collection(db, 'users'), where('orgId', '==', profile.orgId), orderBy('email')) : null,
    [profile],
  )
  const { centers } = useCenterStore()

  async function setRole(userId: string, role: Role) {
    await updateDoc(doc(db, 'users', userId), { role })
  }

  async function toggleCenter(user: AppUser, centerId: string) {
    const has = user.centerIds?.includes(centerId)
    const next = has
      ? user.centerIds.filter((id) => id !== centerId)
      : [...(user.centerIds ?? []), centerId]
    await updateDoc(doc(db, 'users', user.id), { centerIds: next })
  }

  return (
    <div className="max-w-4xl">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Nhân sự</h2>
      <p className="mb-4 text-sm text-gray-500">
        Gán vai trò và cơ sở phụ trách cho từng tài khoản. Tài khoản mới đăng ký mặc định là
        "Học sinh/Phụ huynh".
      </p>

      {profile && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm">
          <p className="font-medium text-indigo-900">Mã trung tâm của bạn (chia sẻ để mời nhân sự/phụ huynh):</p>
          <code className="mt-1 block rounded bg-white px-2 py-1 text-indigo-700">{profile.orgId}</code>
          <p className="mt-1 text-xs text-indigo-700">
            Người nhận mã này chọn "Tham gia trung tâm có sẵn" ở trang Đăng ký và nhập mã trên —
            tài khoản của họ sẽ mặc định là "Học sinh/Phụ huynh", bạn gán vai trò/cơ sở bên dưới sau.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Vai trò</th>
              <th className="px-3 py-2">Cơ sở phụ trách</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2 font-medium text-gray-900">{u.displayName}</td>
                <td className="px-3 py-2 text-gray-600">{u.email}</td>
                <td className="px-3 py-2">
                  {u.role === 'owner' ? (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {ROLE_LABELS.owner}
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value as Role)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2">
                  {u.role === 'parent' || u.role === 'owner' ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {centers.map((c) => (
                        <label key={c.id} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={u.centerIds?.includes(c.id) ?? false}
                            onChange={() => toggleCenter(u, c.id)}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

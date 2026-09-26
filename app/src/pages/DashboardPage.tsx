import { collection, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCollection } from '../lib/useCollection'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { ROLE_LABELS } from '../lib/roles'
import type { Enrollment, Student } from '../types'

const LOW_BALANCE_THRESHOLD = 2

export function DashboardPage() {
  const { profile } = useAuthStore()
  const { selectedCenterId, centers } = useCenterStore()

  const { data: students } = useCollection<Student>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'students'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
          )
        : null,
    [selectedCenterId, profile],
  )
  const { data: enrollments } = useCollection<Enrollment>(
    () =>
      selectedCenterId && profile
        ? query(
            collection(db, 'enrollments'),
            where('orgId', '==', profile.orgId),
            where('centerId', '==', selectedCenterId),
            where('active', '==', true),
          )
        : null,
    [selectedCenterId, profile],
  )

  const lowBalance = enrollments.filter((e) => e.remainingSessions <= LOW_BALANCE_THRESHOLD)

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Xin chào, {profile?.displayName}
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Vai trò: {profile ? ROLE_LABELS[profile.role] : '-'} · Quản lý {centers.length} cơ sở
      </p>

      {!selectedCenterId ? (
        <p className="text-sm text-gray-500">
          Chưa có cơ sở nào được gán cho tài khoản này. {profile?.role === 'owner' && 'Vào mục "Cơ sở" để tạo cơ sở đầu tiên.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase text-gray-400">Học sinh</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase text-gray-400">Gói buổi đang hoạt động</p>
            <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase text-amber-600">Sắp hết buổi (≤ {LOW_BALANCE_THRESHOLD})</p>
            <p className="text-2xl font-bold text-amber-700">{lowBalance.length}</p>
          </div>
        </div>
      )}
    </div>
  )
}

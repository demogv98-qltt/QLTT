import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { Role } from '../types'

export function RequireAuth() {
  const { firebaseUser, loading } = useAuthStore()

  if (loading) return <FullscreenLoading />
  if (!firebaseUser) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { profile, loading } = useAuthStore()

  if (loading) return <FullscreenLoading />
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/" replace />

  return <Outlet />
}

function FullscreenLoading() {
  return (
    <div className="flex h-screen items-center justify-center text-gray-500">
      Đang tải...
    </div>
  )
}

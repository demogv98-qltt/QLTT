import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { ROLE_LABELS, canManage, isStaffRole } from '../lib/roles'

const navItem =
  'block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 aria-[current=page]:bg-indigo-50 aria-[current=page]:text-indigo-700'

export function Layout() {
  const { profile, logout } = useAuthStore()
  const { centers, selectedCenterId, subscribe, select } = useCenterStore()

  useEffect(() => {
    if (!profile) return
    return subscribe(profile.centerIds ?? [])
  }, [profile, subscribe])

  if (!profile) return null

  const manage = canManage(profile.role)
  const staff = isStaffRole(profile.role)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white p-4">
        <h1 className="mb-6 px-2 text-lg font-bold text-gray-900">QLTT Vật lý</h1>
        <nav className="space-y-1">
          <NavLink to="/" end className={navItem}>
            Tổng quan
          </NavLink>
          {manage && (
            <NavLink to="/centers" className={navItem}>
              Cơ sở
            </NavLink>
          )}
          {manage && (
            <NavLink to="/students" className={navItem}>
              Học sinh
            </NavLink>
          )}
          {manage && (
            <NavLink to="/staff" className={navItem}>
              Nhân sự
            </NavLink>
          )}
          <NavLink to="/classes" className={navItem}>
            Lớp / Ca học
          </NavLink>
          {staff && (
            <NavLink to="/attendance" className={navItem}>
              Điểm danh
            </NavLink>
          )}
          {manage && (
            <NavLink to="/enrollments" className={navItem}>
              Gói buổi học
            </NavLink>
          )}
          {manage && (
            <NavLink to="/payments" className={navItem}>
              Thanh toán
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            {centers.length > 1 && (
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                value={selectedCenterId ?? ''}
                onChange={(e) => select(e.target.value)}
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {centers.length === 1 && (
              <span className="text-sm font-medium text-gray-700">{centers[0].name}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-700">{profile.displayName}</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {ROLE_LABELS[profile.role]}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-100"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

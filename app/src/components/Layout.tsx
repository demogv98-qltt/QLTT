import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCenterStore } from '../stores/centerStore'
import { useOrgStore } from '../stores/orgStore'
import { SUPER_ADMIN_EMAIL } from '../lib/superAdmin'
import { ROLE_LABELS, canManage, isStaffRole } from '../lib/roles'
import { Logo } from './Logo'
import { InstallAppBanner } from './InstallAppBanner'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Building2,
  GraduationCap,
  UserCog,
  PackageCheck,
  Wallet,
  Banknote,
  BarChart3,
  ShieldCheck,
  MapPin,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
  Crown,
  Sparkles,
  Users,
} from 'lucide-react'
import type { Role } from '../types'

interface NavLinkItemProps {
  to: string
  end?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string
  onClick?: () => void
}

function NavItem({ to, end, icon: Icon, label, badge, onClick }: NavLinkItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
              }`}
            />
            <span className="truncate">{label}</span>
          </div>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const configs: Record<Role, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
    owner: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: Crown,
    },
    manager: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: ShieldCheck,
    },
    teacher: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: BookOpen,
    },
    ta: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: Sparkles,
    },
    parent: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: Users,
    },
  }

  const conf = configs[role] ?? configs.parent
  const Icon = conf.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${conf.bg} ${conf.text} ${conf.border}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {ROLE_LABELS[role]}
    </span>
  )
}

function getUserInitials(name?: string) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Layout() {
  const { profile, logout } = useAuthStore()
  const { centers, selectedCenterId, subscribe, select } = useCenterStore()
  const { organization, subscribe: subscribeOrg } = useOrgStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [copiedOrgId, setCopiedOrgId] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!profile) return
    return subscribe(profile.centerIds ?? [])
  }, [profile, subscribe])

  useEffect(() => {
    if (!profile) return
    return subscribeOrg(profile.orgId)
  }, [profile, subscribeOrg])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  if (!profile) return null

  const manage = canManage(profile.role)
  const staff = isStaffRole(profile.role)
  const isSuperAdmin = profile.email === SUPER_ADMIN_EMAIL
  const suspended = organization?.status === 'suspended'
  const brandName = organization?.name || 'HỌC TOÁN CÙNG TLM'

  const copyOrgCode = () => {
    if (!profile.orgId) return
    navigator.clipboard.writeText(profile.orgId)
    setCopiedOrgId(true)
    setTimeout(() => setCopiedOrgId(false), 2000)
  }

  const renderNavLinks = () => (
    <div className="space-y-6">
      {/* Group: Giảng dạy & Điều hành */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Chung
        </p>
        <NavItem
          to="/"
          end
          icon={LayoutDashboard}
          label="Tổng quan"
          onClick={() => setMobileMenuOpen(false)}
        />
        <NavItem
          to="/classes"
          icon={BookOpen}
          label="Lớp / Ca học"
          onClick={() => setMobileMenuOpen(false)}
        />
        {staff && (
          <NavItem
            to="/attendance"
            icon={ClipboardCheck}
            label="Điểm danh"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        {staff && (
          <NavItem
            to="/payroll"
            icon={Banknote}
            label={manage ? 'Bảng lương' : 'Thù lao cá nhân'}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* Group: Quản trị trung tâm */}
      {manage && (
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quản trị trung tâm
          </p>
          <NavItem
            to="/students"
            icon={GraduationCap}
            label="Học sinh"
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavItem
            to="/centers"
            icon={Building2}
            label="Cơ sở"
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavItem
            to="/staff"
            icon={UserCog}
            label="Nhân sự"
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavItem
            to="/enrollments"
            icon={PackageCheck}
            label="Gói buổi học"
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavItem
            to="/payments"
            icon={Wallet}
            label="Thanh toán"
            onClick={() => setMobileMenuOpen(false)}
          />
          <NavItem
            to="/reports"
            icon={BarChart3}
            label="Báo cáo"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Group: Quản trị hệ thống */}
      {isSuperAdmin && (
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hệ thống
          </p>
          <NavItem
            to="/admin"
            icon={ShieldCheck}
            label="Quản trị SaaS"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white p-5 shadow-xs">
        <div>
          {/* Brand & Logo */}
          <div className="mb-6 px-1">
            <NavLink to="/" className="block focus:outline-hidden">
              <Logo
                size="md"
                title={brandName}
                subtitle="Trung tâm Toán học"
              />
            </NavLink>
          </div>

          {/* Navigation */}
          <nav>{renderNavLinks()}</nav>
        </div>

        {/* Footer info: Center Code with Quick Copy */}
        <div className="mt-8 border-t border-slate-100 pt-4">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Mã trung tâm</span>
              {organization?.status === 'trial' ? (
                <span className="rounded-sm bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                  Dùng thử
                </span>
              ) : (
                <span className="rounded-sm bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                  Hoạt động
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 font-mono text-xs text-slate-700 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
              <span className="truncate select-all font-semibold" title={profile.orgId}>
                {profile.orgId}
              </span>
              <button
                type="button"
                onClick={copyOrgCode}
                title="Sao chép mã trung tâm (chia sẻ cho nhân sự/phụ huynh đăng ký)"
                className="shrink-0 p-1 text-slate-400 hover:text-indigo-600 transition-colors rounded-md"
              >
                {copiedOrgId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Backdrop + Slide-over Menu) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-72 max-w-[85%] flex-1 flex-col justify-between bg-white p-5 shadow-2xl">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <Logo size="sm" title={brandName} subtitle="Trung tâm Toán học" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav>{renderNavLinks()}</nav>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Mã trung tâm</span>
                </div>
                <div className="flex items-center justify-between gap-1 font-mono text-xs text-slate-700 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                  <span className="truncate select-all font-semibold">{profile.orgId}</span>
                  <button
                    type="button"
                    onClick={copyOrgCode}
                    className="shrink-0 p-1 text-slate-400 hover:text-indigo-600"
                  >
                    {copiedOrgId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* PWA Mobile Install Banner */}
        <InstallAppBanner />

        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
          {/* Left section: Hamburger (Mobile) + Branch Selector */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile logo when sidebar hidden */}
            <div className="md:hidden">
              <Logo size="sm" showText={false} />
            </div>

            {/* Center / Branch selector */}
            <div className="flex items-center gap-2">
              {centers.length > 1 ? (
                <div className="relative flex items-center">
                  <MapPin className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-indigo-600" />
                  <select
                    className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-7 text-xs sm:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    value={selectedCenterId ?? ''}
                    onChange={(e) => select(e.target.value)}
                  >
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : centers.length === 1 ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[240px]">{centers[0].name}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Chưa có cơ sở</span>
              )}
            </div>
          </div>

          {/* Right section: Profile, Role Badge, Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Avatar circle */}
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-xs font-bold text-white shadow-xs">
                {getUserInitials(profile.displayName)}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                  {profile.displayName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {profile.email}
                </span>
              </div>
            </div>

            {/* Role Badge */}
            <RoleBadge role={profile.role} />

            {/* Logout button */}
            <button
              type="button"
              onClick={() => logout()}
              title="Đăng xuất khỏi tài khoản"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Trial Banner */}
        {organization?.status === 'trial' && (
          <div className="flex items-center justify-between border-b border-amber-200/80 bg-amber-50/90 px-4 py-2 sm:px-6 text-xs sm:text-sm text-amber-900">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Trung tâm đang ở chế độ <strong>dùng thử</strong>. Liên hệ quản trị viên để kích hoạt đầy đủ tính năng.
              </span>
            </div>
          </div>
        )}

        {/* Main Routed Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {suspended ? (
            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center shadow-xs">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-red-900">Tài khoản đang bị tạm khóa</h3>
              <p className="text-sm text-red-700 leading-relaxed">
                Trung tâm của bạn đã bị tạm khóa. Vui lòng liên hệ người bán phần mềm để được hỗ trợ kích hoạt lại.
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}

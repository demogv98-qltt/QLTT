import type { Role } from '../types'

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Chủ trung tâm',
  manager: 'Quản lý',
  ta: 'Trợ giảng',
  teacher: 'Giáo viên',
  parent: 'Học sinh/Phụ huynh',
}

export const STAFF_ROLES: Role[] = ['owner', 'manager', 'teacher', 'ta']

export function isStaffRole(role: Role | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

export function canManage(role: Role | undefined): boolean {
  return role === 'owner' || role === 'manager'
}

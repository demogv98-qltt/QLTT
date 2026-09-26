export function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthRange(monthValue: string) {
  const [y, m] = monthValue.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  return { start, end, daysInMonth }
}

/** monthValue offset by `delta` months, e.g. monthOffset('2026-01', -1) -> '2025-12'. */
export function monthOffset(monthValue: string, delta: number) {
  const [y, m] = monthValue.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(monthValue: string) {
  const [y, m] = monthValue.split('-').map(Number)
  return `Th${m}/${String(y).slice(2)}`
}

export function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ'
}

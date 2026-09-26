import type { Weekday } from '../types'

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function weekdayOf(isoDate: string): Weekday {
  return new Date(`${isoDate}T00:00:00`).getDay() as Weekday
}

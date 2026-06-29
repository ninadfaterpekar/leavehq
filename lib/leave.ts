import { DeductionInfo } from '@/types'

// ── Working days between two dates (excludes weekends) ──
export function getWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) return 0

  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// ── Format currency ──
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(amount)
}

// ── Calculate pay deduction ──
export function calcDeduction(
  leaveType: string,
  workingDays: number,
  remaining: number,
  dailyRate: number
): DeductionInfo {
  // Sick leave — never deducts
  if (leaveType === 'sick') {
    return { applies: false, excess_days: 0, amount: 0, formatted: '£0.00' }
  }

  let excessDays = 0

  // Unpaid leave — always deducts all days
  if (leaveType === 'unpaid') {
    excessDays = workingDays
  }

  // Annual leave — only deducts excess over remaining
  if (leaveType === 'annual') {
    excessDays = Math.max(0, workingDays - remaining)
  }

  if (excessDays === 0) {
    return { applies: false, excess_days: 0, amount: 0, formatted: '£0.00' }
  }

  const amount = excessDays * dailyRate
  return {
    applies: true,
    excess_days: excessDays,
    amount,
    formatted: formatCurrency(amount)
  }
}

// ── Format date for display ──
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// ── Today's date as ISO string ──
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ── User roles ──
export type UserRole = 'employee' | 'supervisor' | 'manager' | 'admin'

// ── Database row types ──
export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  manager_id: string | null
  annual_allowance: number
  daily_rate: number
  created_at: string
}

export type LeaveRequest = {
  id: string
  user_id: string
  leave_type: 'annual' | 'sick' | 'unpaid'
  start_date: string
  end_date: string
  working_days: number
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  manager_note: string | null
  created_at: string
  updated_at: string
  // joined
  profile?: Profile
}

export type LeaveBalance = {
  user_id: string
  year: number
  allowed: number
  used_approved: number
  used_pending: number
  remaining: number
}

// ── Form types ──
export type LeaveRequestForm = {
  leave_type: 'annual' | 'sick' | 'unpaid'
  start_date: string
  end_date: string
  note: string
  deduction_acknowledged: boolean
}

// ── Computed ──
export type DeductionInfo = {
  applies: boolean
  excess_days: number
  amount: number
  formatted: string
}

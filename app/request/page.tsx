'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getWorkingDays, calcDeduction, todayISO } from '@/lib/leave'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { Profile } from '@/types'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--rel-color-border-default)',
  borderRadius: 'var(--rel-borders-radius-border-radius-200)',
  fontSize: 'var(--rel-fontSizes-md)',
  color: 'var(--rel-color-text-primary)',
  outline: 'none', fontFamily: 'inherit', background: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--rel-fontSizes-md)',
  fontWeight: 'var(--rel-fontWeights-medium)' as any,
  color: 'var(--rel-color-text-heading)',
  marginBottom: '6px',
}

export default function RequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState({ allowed: 20, used: 0, remaining: 20 })
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'unpaid'>('annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const today = todayISO()
  const effectiveEnd = mode === 'single' ? startDate : endDate
  const workingDays = getWorkingDays(startDate, effectiveEnd)
  const deduction = calcDeduction(leaveType, workingDays, balance.remaining, profile?.daily_rate || 120)
  const canSubmit = workingDays > 0 && (!deduction.applies || acknowledged)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) setProfile(p)
      const year = new Date().getFullYear()
      const { data: requests } = await supabase
        .from('leave_requests').select('working_days, status, leave_type')
        .eq('user_id', session.user.id)
        .gte('start_date', `${year}-01-01`)
        .in('status', ['approved', 'pending'])
      const used = (requests || [])
        .filter((r: any) => r.leave_type !== 'sick')
        .reduce((s: number, r: any) => s + r.working_days, 0)
      const allowed = p?.annual_allowance || 20
      setBalance({ allowed, used, remaining: Math.max(0, allowed - used) })
    }
    load()
  }, [])

  async function handleSubmit() {
    if (!canSubmit || loading) return
    setLoading(true)
    setStatus('idle')
    setErrorMsg('')
    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leave_type: leaveType, start_date: startDate, end_date: effectiveEnd, note })
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      setBalance(b => ({ ...b, used: b.used + workingDays, remaining: Math.max(0, b.remaining - workingDays) }))
      setStartDate(''); setEndDate(''); setNote(''); setAcknowledged(false)
    } else {
      setStatus('error')
      setErrorMsg(data.error || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '680px', margin: '32px auto', padding: '0 24px 48px' }}>

        <h1 style={{ fontSize: 'var(--rel-fontSizes-lg)', fontWeight: 'var(--rel-fontWeights-semibold)', marginBottom: '4px', color: 'var(--rel-color-text-heading)' }}>
          Request Leave
        </h1>
        <p style={{ color: 'var(--rel-color-text-secondary)', marginBottom: '24px', fontSize: 'var(--rel-fontSizes-md)' }}>
          Submit a request. Your manager will be notified by email.
        </p>

        {/* Balance summary */}
        <rel-card>
          <div style={{ fontSize: 'var(--rel-fontSizes-md)', fontWeight: 'var(--rel-fontWeights-semibold)', marginBottom: '16px' }}>
            Your leave balance — {new Date().getFullYear()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', textAlign: 'center' }}>
            {[
              { label: 'Allowed',   value: balance.allowed,   color: 'var(--rel-color-text-heading)' },
              { label: 'Used',      value: balance.used,      color: balance.used > 15 ? 'var(--rel-colors-orange-warning)' : 'var(--rel-color-text-heading)' },
              { label: 'Remaining', value: balance.remaining, color: balance.remaining <= 3 ? 'var(--rel-colors-red-primary)' : 'var(--rel-colors-green-success)' },
            ].map(b => (
              <div key={b.label}>
                <div style={{ fontSize: 'var(--rel-fontSizes-xs)', fontWeight: 'var(--rel-fontWeights-medium)', color: 'var(--rel-color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{b.label}</div>
                <div style={{ fontSize: 'var(--rel-fontSizes-3xl)', fontWeight: 'var(--rel-fontWeights-bold)', color: b.color, lineHeight: 1 }}>{b.value}</div>
                <div style={{ fontSize: 'var(--rel-fontSizes-sm)', color: 'var(--rel-color-text-secondary)', marginTop: '2px' }}>days</div>
              </div>
            ))}
          </div>
        </rel-card>

        {balance.remaining === 0 && (
          <div style={{ marginBottom: '16px' }}>
            <rel-alert type="info" message1="No annual leave remaining. You can still request unpaid leave." />
          </div>
        )}

        {/* Form */}
        <rel-card>
          <div style={{ fontSize: 'var(--rel-fontSizes-md)', fontWeight: 'var(--rel-fontWeights-semibold)', marginBottom: '16px' }}>
            Leave details
          </div>

          {status === 'success' && (
            <div style={{ marginBottom: '16px' }}>
              <rel-alert type="success" message1="Request submitted successfully. Your manager has been notified by email." />
            </div>
          )}
          {status === 'error' && (
            <div style={{ marginBottom: '16px' }}>
              <rel-alert type="error" message1={`Something went wrong: ${errorMsg}`} />
            </div>
          )}

          {/* Leave type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Leave type</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              value={leaveType}
              onChange={e => { setLeaveType(e.target.value as any); setAcknowledged(false) }}>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          {/* Single / Range toggle */}
          <div style={{ display: 'flex', background: 'var(--rel-color-bg-tertiary)', borderRadius: 'var(--rel-borders-radius-border-radius-200)', padding: '3px', width: 'fit-content', marginBottom: '16px' }}>
            {(['single', 'range'] as const).map(m => (
              <button key={m} type="button"
                onClick={() => { setMode(m); setEndDate(''); setAcknowledged(false) }}
                style={{
                  padding: '6px 18px', border: 'none',
                  borderRadius: 'var(--rel-borders-radius-border-radius-100)',
                  fontSize: 'var(--rel-fontSizes-md)',
                  fontWeight: 'var(--rel-fontWeights-medium)' as any,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? 'var(--rel-color-text-heading)' : 'var(--rel-color-text-secondary)',
                  boxShadow: mode === m ? 'var(--rel-shadows-shadow-100)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {m === 'single' ? 'Single day' : 'Date range'}
              </button>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: mode === 'range' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>{mode === 'range' ? 'Start date' : 'Date'}</label>
              <input type="date" style={inputStyle} min={today} value={startDate}
                onChange={e => { setStartDate(e.target.value); setAcknowledged(false) }} required />
            </div>
            {mode === 'range' && (
              <div>
                <label style={labelStyle}>End date</label>
                <input type="date" style={inputStyle} min={startDate || today} value={endDate}
                  onChange={e => { setEndDate(e.target.value); setAcknowledged(false) }} required />
              </div>
            )}
          </div>

          {/* Days calculated */}
          {workingDays > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <rel-alert type="info" message1={`${workingDays} working day${workingDays !== 1 ? 's' : ''} requested`} />
            </div>
          )}

          {/* Pay deduction warning */}
          {deduction.applies && workingDays > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <rel-alert type="warning" message1={`Pay deduction applies. You are requesting ${deduction.excess_days} day${deduction.excess_days !== 1 ? 's' : ''} beyond your allowance — this will reduce your pay by ${deduction.formatted}.`} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--rel-background-warning)', border: '1px solid var(--rel-border-warning)', borderRadius: 'var(--rel-borders-radius-border-radius-200)', marginTop: '8px', cursor: 'pointer', fontSize: 'var(--rel-fontSizes-md)', color: 'var(--rel-colors-orange-warning)', fontWeight: 'var(--rel-fontWeights-medium)' as any }}>
                <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
                  style={{ marginTop: '2px', width: '15px', height: '15px', flexShrink: 0 }} />
                I understand this leave will reduce my pay by {deduction.formatted} this period.
              </label>
            </div>
          )}

          <rel-divider />

          {/* Note */}
          <div style={{ margin: '16px 0 20px' }}>
            <label style={labelStyle}>
              Note for your manager <span style={{ color: 'var(--rel-color-text-secondary)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Add any context that might help your manager..."
              maxLength={200}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div style={{ fontSize: 'var(--rel-fontSizes-xs)', color: note.length > 180 ? 'var(--rel-colors-orange-warning)' : 'var(--rel-color-text-secondary)', textAlign: 'right', marginTop: '4px' }}>
              {note.length} / 200
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <rel-button variant="default" size="medium" onClick={() => router.push('/dashboard')}>
              Cancel
            </rel-button>
            <rel-button
              variant="primary"
              size="medium"
              disabled={!canSubmit || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Submitting…' : 'Submit request'}
            </rel-button>
          </div>
        </rel-card>
      </div>
    </>
  )
}
